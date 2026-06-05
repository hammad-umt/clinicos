"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { QueryError } from "@/components/shared/QueryError";
import {
  useGetBillByTokenQuery,
  useUpdateBillChargesMutation,
  useMarkBillPaidMutation,
} from "@/store/api/billApi";
import { useSearchPatientsMutation } from "@/store/api/patientApi";
import { formatCurrency, formatDate } from "@/lib/utils";

const chargesSchema = z.object({
  extraCharges: z.number().min(0, "Amount must be 0 or more"),
});

type ChargesForm = z.infer<typeof chargesSchema>;

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);

  const [searchPatients] = useSearchPatientsMutation();
  const [updateCharges, { isLoading: updating }] = useUpdateBillChargesMutation();
  const [markPaid, { isLoading: markingPaid }] = useMarkBillPaidMutation();

  const form = useForm<ChargesForm>({
    resolver: zodResolver(chargesSchema),
    defaultValues: { extraCharges: 0 },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const result = await searchPatients(searchQuery).unwrap();
      setSearchResults(result || []);
    } catch {
      setSearchResults([]);
      toast.error("Search failed");
    }
  };

  const selectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSelectedBill(null);
  };

  const onSubmit = async (values: ChargesForm) => {
    if (!selectedBill) return;
    const toastId = toast.loading("Updating charges...");
    try {
      await updateCharges({
        id: selectedBill.id,
        extraCharges: values.extraCharges,
      }).unwrap();
      toast.success("Charges updated", { id: toastId });
      setSelectedBill(null);
      form.reset();
    } catch {
      toast.error("Failed to update charges", { id: toastId });
    }
  };

  const handleMarkPaid = async (id: string) => {
    const toastId = toast.loading("Marking as paid...");
    try {
      await markPaid(id).unwrap();
      toast.success("Bill marked as paid", { id: toastId });
      setSelectedBill(null);
      setSelectedPatient(null);
    } catch {
      toast.error("Failed to update bill", { id: toastId });
    }
  };

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Search patients and manage their bills"
      />

      <div className="flex gap-2 mb-6 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient by name/phone..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} className="bg-accent hover:bg-accent/90">
          Search
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {searchResults.map((patient) => (
            <Card
              key={patient.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => selectPatient(patient)}
            >
              <CardContent className="pt-6">
                <p className="font-medium">{patient.name}</p>
                <p className="text-sm text-muted-foreground">{patient.phone}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedPatient && !selectedBill && (
        <Card className="max-w-lg mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedPatient.name}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setSelectedPatient(null)}
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedPatient.phone}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              No active bills for this patient, or bill is already paid.
            </p>
            <Button
              variant="outline"
              onClick={() => setSelectedPatient(null)}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedBill && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-base">{selectedBill.patientName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{formatCurrency(selectedBill.totalAmount)}</span>
              <StatusBadge status={selectedBill.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(selectedBill.createdAt)}
            </p>

            {selectedBill.status === "Unpaid" && (
              <>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <FormField control={form.control} name="extraCharges" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Charges (PKR)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={updating}>
                      Update Charges
                    </Button>
                  </form>
                </Form>
                <Button
                  variant="outline"
                  onClick={() => handleMarkPaid(selectedBill.id)}
                  disabled={markingPaid}
                  className="w-full"
                >
                  Mark Paid
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              onClick={() => setSelectedBill(null)}
              className="w-full"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {!selectedPatient && searchResults.length === 0 && (
        <EmptyState
          title="Search for a patient"
          description="Enter patient name or phone number to view and manage their bills."
        />
      )}
    </div>
  );
}
