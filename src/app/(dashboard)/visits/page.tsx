"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { SkeletonSheetDetail } from "@/components/shared/PageSkeletons";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useSearchPatientsMutation } from "@/store/api/patientApi";
import { useGetVisitsByPatientQuery, useGetVisitByIdQuery } from "@/store/api/visitApi";
import { useGetPrescriptionByVisitQuery } from "@/store/api/prescriptionApi";
import { useGetBillByVisitQuery } from "@/store/api/billApi";
import type { Patient, Visit } from "@/types";
import { formatDate, formatCurrency, calculateAge } from "@/lib/utils";

export default function VisitsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  const [searchPatients] = useSearchPatientsMutation();
  const { data: visits, isLoading: visitsLoading } = useGetVisitsByPatientQuery(
    selectedPatient?.id ?? "",
    { skip: !selectedPatient }
  );
  const { data: visitDetail, isLoading: detailLoading } = useGetVisitByIdQuery(
    selectedVisitId!,
    { skip: !selectedVisitId }
  );
  const { data: prescription } = useGetPrescriptionByVisitQuery(
    selectedVisitId!,
    { skip: !selectedVisitId }
  );
  const { data: bill } = useGetBillByVisitQuery(selectedVisitId!, {
    skip: !selectedVisitId,
  });

  const runSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const result = await searchPatients(query).unwrap();
        setSearchResults(result);
      } catch {
        setSearchResults([]);
      }
    },
    [searchPatients]
  );

  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  const visitColumns = [
    {
      key: "complaint",
      header: "Complaint",
      cell: (row: Visit) => row.chiefComplaint,
    },
    {
      key: "diagnosis",
      header: "Diagnosis",
      cell: (row: Visit) => row.diagnosis ?? "—",
    },
    {
      key: "date",
      header: "Date",
      cell: (row: Visit) => formatDate(row.createdAt),
    },
  ];

  return (
    <div>
      <PageHeader title="Visits" description="Search patients and view visit history" />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patient..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!e.target.value) setSelectedPatient(null);
          }}
        />
        {searchResults.length > 0 && !selectedPatient && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
            {searchResults.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setSelectedPatient(p);
                  setSearchQuery(p.name);
                  setSearchResults([]);
                }}
              >
                {p.name} — {p.phone}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPatient && (
        <div className="mb-6 rounded-lg border bg-background px-4 py-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold">{selectedPatient.name}</p>
              <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
              <p className="text-sm mt-1">
                {selectedPatient.gender} · Age {selectedPatient.age ?? (selectedPatient.dateOfBirth ? calculateAge(selectedPatient.dateOfBirth) : "—")}
              </p>
              {selectedPatient.address && (
                <p className="text-sm text-muted-foreground mt-2">{selectedPatient.address}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!selectedPatient ? (
        <EmptyState title="Search a patient" description="Find a patient to view their visits." />
      ) : visitsLoading ? (
        <SkeletonTable columns={3} rows={5} />
      ) : !visits?.length ? (
        <EmptyState title="No visits" description="This patient has no recorded visits." />
      ) : (
        <DataTable
          columns={visitColumns}
          data={visits}
          getRowKey={(r) => r.id}
          onRowClick={(r) => setSelectedVisitId(r.id)}
        />
      )}

      <Sheet
  open={!!selectedVisitId}
  onOpenChange={(open) => !open && setSelectedVisitId(null)}
>
  <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
    
    {/* Header */}
    <div className="border-b px-6 py-4 bg-muted/30">
      <SheetHeader>
        <SheetTitle className="text-lg font-semibold">
          Visit Details
        </SheetTitle>
      </SheetHeader>
    </div>

    {detailLoading ? (
      <div className="p-6">
        <SkeletonSheetDetail />
      </div>
    ) : visitDetail && (
      <div className="p-6 space-y-6">

        {/* Visit Info Card */}
        <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">
              Visited At
            </span>
            <span className="text-sm font-semibold">
              {formatDate(visitDetail.createdAt)}
            </span>
          </div>

          <div>
            <span className="text-sm font-medium text-muted-foreground">
              Chief Complaint
            </span>
            <p className="text-base font-semibold mt-1">
              {visitDetail.chiefComplaint}
            </p>
          </div>

          {visitDetail.diagnosis && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Diagnosis
              </span>
              <p className="text-sm mt-1">
                {visitDetail.diagnosis}
              </p>
            </div>
          )}

          {visitDetail.notes && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Notes
              </span>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {visitDetail.notes}
              </p>
            </div>
          )}
        </div>

        {/* Prescription Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-base">Prescription</h4>

          {!prescription ? (
            <div className="text-sm text-muted-foreground border rounded-lg p-4">
              No prescription for this visit.
            </div>
          ) : (
            <div className="space-y-2">
              {prescription.items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-background p-3 hover:bg-muted/40 transition"
                >
                  <p className="font-medium">{item.medicine}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.dosage} • {item.frequency} • {item.duration}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bill Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-base">Billing</h4>

          {!bill ? (
            <div className="text-sm text-muted-foreground border rounded-lg p-4">
              No bill for this visit.
            </div>
          ) : (
            <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/20">
              <span className="text-base font-semibold">
                {formatCurrency(bill.consultationFee + (bill.extraCharges ?? 0))}
              </span>
              <StatusBadge status="none" />
            </div>
          )}
        </div>

      </div>
    )}
  </SheetContent>
</Sheet>
    </div>
  );
}
