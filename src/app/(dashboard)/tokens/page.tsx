"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { Patient, TokenStatus } from "@/types";

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
      
      // Auto-create bill for this token
      await createBillFromToken({ tokenId: token.id, patientId }).unwrap();
      
      toast.success("Token issued and bill created", { id: toastId });
      form.reset({ patientId: "", doctorId, doctorName });
      setSelectedPatient(null);
      setSearchQuery("");
      if (queueDoctorId === doctorId) refetch();
    } catch {
      toast.error("Failed to issue token", { id: toastId });
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

  return (
    <div>
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
                        ? `Dr. ${selectedDoctor.name}${
                            selectedDoctor.specialization
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
                                const label = `Dr. ${doctor.name}${
                                  doctor.specialization ? ` — ${doctor.specialization}` : ""
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
            <EmptyState title="Queue is empty" description="No tokens for this doctor today." />
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id} className="hover:bg-muted/50">
                      <TableCell className="font-bold">#{token.tokenNumber}</TableCell>
                      <TableCell>{token.patientName}</TableCell>
                      <TableCell>
                        <StatusBadge status={token.status} />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={token.status}
                          onValueChange={(v) =>
                            handleStatusChange(token.id, v as TokenStatus)
                          }
                        >
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tokenStatuses.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
