"use client";

import { useCallback, useEffect, useState } from "react";
import { Printer, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { SkeletonSheetDetail } from "@/components/shared/PageSkeletons";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useSearchPatientsMutation } from "@/store/api/patientApi";
import { useGetVisitsByPatientQuery, useGetVisitByIdQuery } from "@/store/api/visitApi";
import {
  useGetPrescriptionByVisitQuery,
  useLazyGetPrescriptionPdfQuery,
} from "@/store/api/prescriptionApi";
import { useGetBillByVisitQuery, useGetBillByTokenQuery } from "@/store/api/billApi";
import type { Patient, Visit, Bill, Prescription } from "@/types";
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
  const { data: billByVisit, isLoading: billByVisitLoading } = useGetBillByVisitQuery(
    selectedVisitId!,
    { skip: !selectedVisitId }
  );
  const { data: billByToken, isLoading: billByTokenLoading } = useGetBillByTokenQuery(
    visitDetail?.tokenId ?? "",
    { skip: !visitDetail?.tokenId || !!billByVisit }
  );

  const bill = billByVisit ?? billByToken ?? null;
  const billLoading = billByVisitLoading || (!billByVisit && billByTokenLoading);

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
    <div className="space-y-6 pb-6">
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
        <EmptyState title="Search a patient" description="Find a patient to view their visits." icon={Search} />
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
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Search className="h-5 w-5 text-accent" />
              Visit Details
            </h2>
            {visitDetail && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(visitDetail.createdAt)}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {detailLoading ? (
              <SkeletonSheetDetail />
            ) : visitDetail ? (
              <div className="space-y-8">

                {/* Visit Info Card */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Chief Complaint</p>
                    <p className="text-base font-medium text-foreground">
                      {visitDetail.chiefComplaint}
                    </p>
                  </div>

                  {visitDetail.diagnosis && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Diagnosis</p>
                      <p className="text-sm text-foreground">
                        {visitDetail.diagnosis}
                      </p>
                    </div>
                  )}

                  {visitDetail.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Clinical Notes</p>
                      <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border">
                        {visitDetail.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Prescription Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Prescription</h4>

                  {!prescription ? (
                    <div className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg border border-dashed text-center">
                      No prescription issued.
                    </div>
                  ) : (
                    <VisitPrescriptionDetails prescription={prescription} />
                  )}
                </div>

                {/* Bill Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Bill</h4>

                  {billLoading ? (
                    <div className="h-24 rounded-lg border bg-muted/20 animate-pulse" />
                  ) : !bill ? (
                    <div className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg border border-dashed text-center">
                      No bill found for this visit.
                    </div>
                  ) : (
                    <VisitBillDetails bill={bill} />
                  )}
                </div>

              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function VisitPrescriptionDetails({ prescription }: { prescription: Prescription }) {
  const [fetchPdf, { isFetching }] = useLazyGetPrescriptionPdfQuery();

  const handlePrint = useCallback(async () => {
    const toastId = toast.loading("Preparing prescription...");
    try {
      const blob = await fetchPdf(prescription.id).unwrap();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
      toast.success("Prescription ready to print", { id: toastId });
    } catch {
      toast.error("Failed to load prescription PDF", { id: toastId });
    }
  }, [fetchPdf, prescription.id]);

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Prescription details</p>
          {prescription.doctorName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Dr. {prescription.doctorName}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePrint}
          disabled={isFetching}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <div className="space-y-2">
        {prescription.items.map((item, i) => (
          <div key={i} className="rounded-lg border bg-background p-3">
            <p className="font-medium text-foreground">{item.medicine}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1.5">
              <span className="bg-muted px-2 py-0.5 rounded-md">{item.dosage}</span>
              <span className="bg-muted px-2 py-0.5 rounded-md">{item.frequency}</span>
              <span className="bg-muted px-2 py-0.5 rounded-md">{item.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {prescription.notes && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Instructions
          </p>
          <p className="text-sm text-foreground">{prescription.notes}</p>
        </div>
      )}

      {prescription.followUpDate && (
        <p className="text-xs text-muted-foreground">
          Follow-up: {formatDate(prescription.followUpDate)}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Issued: {formatDate(prescription.createdAt)}
      </p>
    </div>
  );
}

function VisitBillDetails({ bill }: { bill: Bill }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Bill summary</p>
        <StatusBadge status={bill.isPaid ? "Paid" : "Unpaid"} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Consultation fee</span>
          <span className="tabular-nums">{formatCurrency(bill.consultationFee)}</span>
        </div>
        {(bill.extraCharges ?? 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Extra charges</span>
            <span className="tabular-nums">{formatCurrency(bill.extraCharges!)}</span>
          </div>
        )}
        {(bill.discount ?? 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className="tabular-nums text-red-600">
              -{formatCurrency(bill.discount!)}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(bill.totalAmount)}</span>
        </div>
      </div>

      {bill.doctorName && (
        <p className="text-xs text-muted-foreground">Doctor: {bill.doctorName}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Issued: {formatDate(bill.createdAt)}
      </p>
    </div>
  );
}
