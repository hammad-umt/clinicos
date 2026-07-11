"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Search,
  MapPin,
  Calendar,
  Trash2,
  X,
  FileText,
  ClipboardList,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { SkeletonSheetDetail } from "@/components/shared/PageSkeletons";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  useSearchPatientsMutation,
  useGetPatientByIdQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
  useGetAllPatientsQuery,
} from "@/store/api/patientApi";
import { useGetVisitsByPatientQuery } from "@/store/api/visitApi";
import type { Patient, Gender } from "@/types";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

const patientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone required"),
  gender: z.enum(["Male", "Female", "Other"]),
  age: z.number().min(0, "Age is required").max(150),
  address: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((segment) => segment[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatPatientDate = (date?: string) =>
  date ? formatDate(date).split(",")[0] : "—";

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);

  const [searchPatients] = useSearchPatientsMutation();
  const [createPatient, { isLoading: creating }] = useCreatePatientMutation();
  const [updatePatient, { isLoading: updating }] = useUpdatePatientMutation();

  const { data: allPatients, isLoading: loadingPatients } = useGetAllPatientsQuery(undefined);
  const { data: patientDetail, isLoading: detailLoading } = useGetPatientByIdQuery(
    selectedId ?? "",
    { skip: !selectedId }
  );

  const { data: visits, isLoading: visitsLoading } = useGetVisitsByPatientQuery(
    selectedId ?? "",
    { skip: !selectedId }
  );

  const form = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      phone: "",
      gender: "Male",
      age: 0,
      address: "",
    },
  });

  const runSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        return;
      }

      try {
        const result = await searchPatients(trimmed).unwrap();
        setPatients(result);
      } catch {
        setPatients([]);
      }
    },
    [searchPatients]
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setPatients(allPatients ?? []);
    }
  }, [allPatients, searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setPatients(allPatients ?? []);
        return;
      }
      void runSearch(trimmed);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery, runSearch, allPatients]);

  const openCreate = () => {
    setEditPatient(null);
    form.reset({
      name: "",
      phone: "",
      gender: "Male",
      age: 0,
      address: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (patient: Patient) => {
    setEditPatient(patient);
    form.reset({
      name: patient.name,
      phone: patient.phone,
      gender: patient.gender,
      age: patient.age ?? 0,
      address: patient.address ?? "",
    });
    setDialogOpen(true);
  };

  const router = useRouter();

  const handleNewVisit = (patientId: string) => {
    router.push(`/visits?patientId=${patientId}`);
    setSelectedId(null);
  };

  const handleDelete = (patient: Patient) => {
    if (!confirm(`Delete patient ${patient.name}? This action cannot be undone.`)) return;
    toast.error("Delete is not implemented in this demo.");
  };

  const onSubmit = async (values: PatientForm) => {
    const toastId = toast.loading(editPatient ? "Updating patient..." : "Creating patient...");
    try {
      if (editPatient) {
        await updatePatient({ id: editPatient.id, data: values }).unwrap();
        toast.success("Patient updated", { id: toastId });
      } else {
        await createPatient(values).unwrap();
        toast.success("Patient created", { id: toastId });
      }
      setDialogOpen(false);
      if (searchQuery.trim()) {
        await runSearch(searchQuery);
      }
    } catch {
      toast.error("Failed to save patient", { id: toastId });
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Patient",
        cell: (row: Patient) => (
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
              {getInitials(row.name)}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-foreground">{row.name}</div>
              <div className="text-sm text-muted-foreground truncate">{row.phone}</div>
            </div>
          </div>
        ),
        className: "min-w-[220px]",
      },
      {
        key: "gender",
        header: "Gender",
        cell: (row: Patient) => row.gender,
      },
      {
        key: "age",
        header: "Age",
        cell: (row: Patient) => (row.age ?? "—"),
      },
      {
        key: "address",
        header: "Address",
        cell: (row: Patient) => row.address ?? "—",
      },
      {
        key: "actions",
        header: "",
        cell: (row: Patient) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              openEdit(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ),
        className: "w-16 text-right",
      },
    ],
    [openEdit]
  );

  const isSearching = !!searchQuery.trim() && !patients.length;
  const isEmptySearch = !loadingPatients && !patients.length && !!searchQuery.trim();
  const isEmptySystem = !loadingPatients && !patients.length && !searchQuery.trim();

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Patients"
        description="Search and manage patient records"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button className="bg-accent hover:bg-accent/90" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Patient
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editPatient ? "Edit Patient" : "Add Patient"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => value && field.onChange(value as Gender)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              {...field}
                              onChange={(event) => field.onChange(Number(event.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="hidden sm:block" />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={creating || updating}>
                    {editPatient ? "Update Patient" : "Create Patient"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-2xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by name or phone..."
          className="pl-11"
        />
      </div>

      {(loadingPatients && !patients.length) || isSearching ? (
        <SkeletonTable columns={5} />
      ) : isEmptySearch ? (
        <EmptyState
          title="No matching patients."
          description="Try another search term to find the right patient."
          icon={FileSearch}
        />
      ) : isEmptySystem ? (
        <EmptyState
          title="No patients found."
          description="Add your first patient to begin managing records."
          icon={ClipboardList}
          action={<Button onClick={openCreate}>Create Patient</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          data={patients}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setSelectedId(row.id)}
        />
      )}

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-2xl max-h-auto overflow-y-auto p-4">
          <SheetHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                 <h2 className="mt-2 text-2xl font-semibold">Patient details</h2>
              </div>
              <div className="flex  items-center gap-2">
                <Button
                  onClick={() => patientDetail && handleNewVisit(patientDetail.id)}
                  className="bg-teal-500 text-white hover:brightness-95 px-3 py-1"
                >
                  New Visit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => patientDetail && openEdit(patientDetail)}
                >
                 <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => patientDetail && handleDelete(patientDetail)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
              </div>
            </div>
          </SheetHeader>

          {detailLoading ? (
            <SkeletonSheetDetail />
          ) : patientDetail ? (
            <div className="space-y-6 pb-6">
              <div className="rounded-3xl border border-border bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-2xl font-semibold text-white">
                      {getInitials(patientDetail.name)}
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">{patientDetail.gender}</p>
                      <h3 className="text-2xl font-semibold">{patientDetail.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{patientDetail.phone}</p>
                    </div>
                  </div>
                    {/* <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                      <p className="text-xs uppercase text-muted-foreground">Registered</p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatPatientDate(patientDetail.createdAt ?? patientDetail.registeredAt)}
                      </p>
                    </div> */}
                    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                      <p className="text-xs uppercase text-muted-foreground">Visits</p>
                      <p className="mt-1 text-sm font-semibold">{visits?.length ?? 0}</p>
                    </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="mt-2 text-base font-medium">{patientDetail.gender}</p>
                </div>
                <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="mt-2 text-base font-medium">{patientDetail.age ?? "—"}</p>
                </div>
                <div className="sm:col-span-2 rounded-3xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Address</span>
                  </div>
                  <p className="mt-3 text-base font-medium">{patientDetail.address ?? "No address provided."}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-lg font-semibold">Visit history</h4>
                    <p className="text-sm text-muted-foreground">Recent clinical activity for this patient.</p>
                  </div>
                </div>

                {visitsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-24 rounded-3xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : !visits?.length ? (
                  <EmptyState
                    title="No visits recorded yet"
                    description="Create the first visit to start tracking this patient's clinical history."
                    icon={FileText}
                    action={<Button onClick={() => handleNewVisit(patientDetail.id)}>Create First Visit</Button>}
                  />
                ) : (
                  <div className="space-y-4">
                    {visits.map((visit) => (
                      <div key={visit.id} className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold">{visit.chiefComplaint}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{formatPatientDate(visit.createdAt)}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                            {visit.doctorName ?? "Unknown doctor"}
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">Diagnosis</p>
                            <p className="mt-1 text-sm font-medium">{visit.diagnosis ?? "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">Chief complaint</p>
                            <p className="mt-1 text-sm font-medium">{visit.chiefComplaint}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">Notes</p>
                            <p className="mt-1 text-sm font-medium">{visit.notes ?? "No additional notes."}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
