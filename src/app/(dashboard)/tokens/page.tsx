"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DataTable } from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { QueryError } from "@/components/shared/QueryError";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { useSearchPatientsMutation } from "@/store/api/patientApi";
import { useGetDoctorsQuery } from "@/store/api/doctorApi";
import {
  useGetTodayTokensQuery,
  useCreateTokenMutation,
  useUpdateTokenStatusMutation,
} from "@/store/api/tokenApi";
import { useCreateBillFromTokenMutation } from "@/store/api/billApi";
import type { Patient, Token, TokenStatus } from "@/types";

const issueSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  doctorId: z.string().min(1, "Select a doctor"),
  doctorName: z.string().min(1, "Select a doctor"),
});

type IssueForm = z.infer<typeof issueSchema>;

const tokenStatuses: TokenStatus[] = [
  "Pending",
  "InProgress",
  "Completed",
  "NoShow",
];

export default function TokensPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [queueDoctorId, setQueueDoctorId] = useState<string>("");

  const [searchPatients] = useSearchPatientsMutation();
  const { data: doctors, isLoading: doctorsLoading } = useGetDoctorsQuery();
  const [createToken, { isLoading: creating }] = useCreateTokenMutation();
  const [createBillFromToken] = useCreateBillFromTokenMutation();
  const [updateStatus] = useUpdateTokenStatusMutation();

  const { data: tokens, isLoading, isError, refetch } = useGetTodayTokensQuery(
    queueDoctorId,
    { skip: !queueDoctorId }
  );

  const form = useForm<IssueForm>({
    resolver: zodResolver(issueSchema),
    defaultValues: { patientId: "", doctorId: "", doctorName: "" },
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

  useEffect(() => {
    if (doctors?.length && !queueDoctorId) {
      const firstDoctor = doctors[0];
      const firstDoctorId = String(firstDoctor.id);
      setQueueDoctorId(firstDoctorId);
      form.setValue("doctorId", firstDoctorId);
      form.setValue("doctorName", `Dr. ${firstDoctor.name}`);
    }
  }, [doctors, queueDoctorId, form]);

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    form.setValue("patientId", patient.id);
    setSearchQuery(patient.name);
    setSearchResults([]);
  };

  const onIssue = async (values: IssueForm) => {
    const toastId = toast.loading("Issuing token...");
    const { patientId, doctorId, doctorName } = values;
    try {
      const token = await createToken({ patientId, doctorId }).unwrap();

      try {
        await createBillFromToken({ tokenId: token.id, patientId }).unwrap();
        toast.success("Token issued and bill created", { id: toastId });
      } catch {
        toast.success("Token issued successfully", { id: toastId });
      }

      form.reset({ patientId: "", doctorId, doctorName });
      setSelectedPatient(null);
      setSearchQuery("");
      if (queueDoctorId === doctorId) refetch();
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        "Failed to issue token";
      toast.error(message, { id: toastId });
    }
  };

  const handleStatusChange = async (id: string, status: TokenStatus) => {
    const toastId = toast.loading("Updating status...");
    try {
      await updateStatus({ id, status }).unwrap();
      await refetch();
      toast.success("Status updated", { id: toastId });
    } catch {
      toast.error("Failed to update status", { id: toastId });
    }
  };

  const printToken = (token: Token) => {
    const printContent = `
      <html>
        <head>
          <title>Token Slip</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 20px; max-width: 300px; margin: 0 auto; color: #000; }
            .header { font-size: 20px; font-weight: 600; margin-bottom: 15px; }
            .token-number { font-size: 56px; font-weight: 800; margin: 15px 0; line-height: 1; }
            .patient { font-size: 18px; font-weight: 500; margin-bottom: 4px; }
            .doctor { font-size: 14px; color: #444; }
            .date { font-size: 12px; color: #666; margin-top: 24px; }
            .footer { font-size: 12px; margin-top: 16px; border-top: 1px dashed #ccc; padding-top: 12px; color: #444; }
            @media print {
              body { padding: 0; margin: 0; max-width: 100%; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">Clinic Token</div>
          <div class="patient">${token.patientName}</div>
          <div class="doctor">${token.doctorName ? `Dr. ${token.doctorName}` : "General"}</div>
          <div class="token-number">#${token.tokenNumber}</div>
          <div class="date">${new Date(token.createdAt).toLocaleString()}</div>
          <div class="footer">Please wait in the waiting area until your number is called.</div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const columns = [
    {
      key: "tokenNumber",
      header: "Token #",
      cell: (row: any) => <span className="font-bold">#{row.tokenNumber}</span>,
    },
    {
      key: "patient",
      header: "Patient",
      cell: (row: any) => row.patientName,
    },
    {
      key: "status",
      header: "Status",
      cell: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Select
            value={row.status}
            onValueChange={(v) => handleStatusChange(row.id, v as TokenStatus)}
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tokenStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => printToken(row)}
            title="Print Token Slip"
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-6">
      <PageHeader title="Tokens" description="Issue tokens and manage today's queue" />

      <Tabs defaultValue="issue">
        <TabsList>
          <TabsTrigger value="issue">Issue Token</TabsTrigger>
          <TabsTrigger value="queue">Today&apos;s Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="issue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Issue New Token</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onIssue)} className="space-y-4 max-w-lg">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patient..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedPatient(null);
                      }}
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => selectPatient(p)}
                          >
                            {p.name} — {p.phone}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedPatient && (
                    <p className="text-sm text-muted-foreground">
                      Selected: <span className="font-medium text-foreground">{selectedPatient.name}</span>
                    </p>
                  )}
                  <FormField
                    control={form.control}
                    name="doctorId"
                    render={({ field }) => {
                      const selectedDoctor = doctors?.find(
                        (doctor) => String(doctor.id) === String(field.value)
                      );

                      const selectedDoctorLabel = selectedDoctor
                        ? `Dr. ${selectedDoctor.name}${selectedDoctor.specialization
                          ? ` — ${selectedDoctor.specialization}`
                          : ""
                        }`
                        : "";

                      return (
                        <FormItem>
                          <FormLabel>Doctor</FormLabel>
                          <Select
                            value={String(field.value ?? "")}
                            onValueChange={(doctorId) => {
                              const selectedDoctor = doctors?.find(
                                (doctor) => String(doctor.id) === doctorId
                              );

                              field.onChange(String(doctorId ?? ""));
                              form.setValue(
                                "doctorName",
                                selectedDoctor ? `Dr. ${selectedDoctor.name}` : "",
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                }
                              );
                            }}
                          >
                            <SelectTrigger className="min-w-[260px] sm:min-w-[320px]">
                              <SelectValue placeholder="Select doctor">
                                {selectedDoctor ? selectedDoctorLabel : undefined}
                              </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                              {doctors?.map((doctor) => {
                                const label = `Dr. ${doctor.name}${doctor.specialization ? ` — ${doctor.specialization}` : ""
                                  }`;

                                return (
                                  <SelectItem key={doctor.id} value={String(doctor.id)}>
                                    {label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <Button type="submit" disabled={creating || !selectedPatient} className="bg-accent hover:bg-accent/90">
                    Issue Token
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="mt-6">
          <div className="mb-4 max-w-xs sm:max-w-[320px]">
            {(() => {
              const selectedQueueDoctor = doctors?.find(
                (doctor) => String(doctor.id) === String(queueDoctorId)
              );
              const selectedQueueDoctorLabel = selectedQueueDoctor
                ? `Dr. ${selectedQueueDoctor.name}`
                : "";

              return (
                <Select
                  value={queueDoctorId}
                  onValueChange={(v) => v && setQueueDoctorId(String(v))}
                >
                  <SelectTrigger className="min-w-[260px] sm:min-w-[320px]">
                    <SelectValue placeholder="Select doctor">
                      {selectedQueueDoctor ? selectedQueueDoctorLabel : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {doctors?.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        Dr. {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })()}
          </div>

          {isError ? (
            <QueryError onRetry={refetch} />
          ) : isLoading || doctorsLoading ? (
            <SkeletonTable columns={4} />
          ) : !tokens?.length ? (
            <EmptyState title="Queue is empty" description="No tokens for this doctor today." icon={Search} />
          ) : (
            <DataTable
              columns={columns}
              data={tokens}
              getRowKey={(r) => r.id}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
