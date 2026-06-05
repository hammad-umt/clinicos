"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { EmptyState } from "@/components/shared/EmptyState";
import { QueryError } from "@/components/shared/QueryError";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import {
  useGetDoctorsQuery,
  useCreateDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
} from "@/store/api/doctorApi";
import { useGetDepartmentsQuery } from "@/store/api/departmentApi";
import type { Doctor } from "@/types";

const doctorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  specialization: z.string().min(2),
  departmentName: z.string().min(1, "Select a department"),
  consultationFee: z.number().positive(),
  password: z.string().optional(),
}).refine((data) => {
  // Will be validated in onSubmit
  return true;
});

type DoctorForm = z.infer<typeof doctorSchema>;

export default function DoctorsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [deptSearch, setDeptSearch] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const { data: doctors, isLoading, isError, refetch } = useGetDoctorsQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const [createDoctor, { isLoading: creating }] = useCreateDoctorMutation();
  const [updateDoctor, { isLoading: updating }] = useUpdateDoctorMutation();
  const [deleteDoctor] = useDeleteDoctorMutation();

  const form = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialization: "",
      departmentName: "",
      consultationFee: 0,
      password: "",
    },
  });

  // Filter departments based on search
  const filteredDepts = useMemo(() => {
    if (!departments) return [];
    if (!deptSearch.trim()) return departments;
    return departments.filter(d =>
      d.name.toLowerCase().includes(deptSearch.toLowerCase())
    );
  }, [deptSearch, departments]);

  const openCreate = () => {
    setEditDoctor(null);
    setDeptSearch("");
    setSelectedDeptId(null);
    form.reset({
      name: "",
      email: "",
      phone: "",
      specialization: "",
      departmentName: "",
      consultationFee: 0,
      password: "",
    });
  };

  const openEdit = (doctor: Doctor) => {
    setEditDoctor(doctor);
    setDeptSearch(doctor.departmentName ?? "");
    setSelectedDeptId(doctor.departmentId);
    form.reset({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      departmentName: doctor.departmentName ?? "",
      consultationFee: doctor.consultationFee ?? 0,
      password: "",
    });
  };

  const onSubmit = async (values: DoctorForm) => {
    // Validate that a department was selected from the list
    if (!selectedDeptId) {
      form.setError("departmentName", {
        message: "Please select a department from suggestions",
      });
      return;
    }

    const toastId = toast.loading(editDoctor ? "Updating doctor..." : "Creating doctor...");
    try {
      if (editDoctor) {
        await updateDoctor({
          id: editDoctor.id,
          data: {
            name: values.name,
            email: values.email,
            phone: values.phone,
            specialization: values.specialization,
            departmentId: selectedDeptId,
            consultationFee: values.consultationFee,
          },
        }).unwrap();
        toast.success("Doctor updated", { id: toastId });
      } else {
        await createDoctor({
          name: values.name,
          email: values.email,
          phone: values.phone,
          specialization: values.specialization,
          departmentId: selectedDeptId,
          consultationFee: values.consultationFee,
          password: values.password || undefined,
        }).unwrap();
        toast.success("Doctor created", { id: toastId });
      } console.log("SUBMIT VALUES:", values);
      setDialogOpen(false);
      form.reset();
      setDeptSearch("");
      setSelectedDeptId(null);
    } catch (error: any) {
      const message = error?.data?.message || "Operation failed";
      toast.error(message, { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    const toastId = toast.loading("Deleting doctor...");
    try {
      await deleteDoctor(id).unwrap();
      toast.success("Doctor deleted", { id: toastId });
    } catch {
      toast.error("Failed to delete doctor", { id: toastId });
    }
  };

  const columns = [
    { key: "name", header: "Name", cell: (row: Doctor) => <span className="font-medium">{row.name}</span> },
    { key: "email", header: "Email", cell: (row: Doctor) => row.email },
    { key: "phone", header: "Phone", cell: (row: Doctor) => row.phone },
    { key: "fee", header: "Consultation Fee", cell: (row: Doctor) => row.consultationFee !== null && row.consultationFee !== undefined ? `${row.consultationFee.toString()}/pkr` : "—" }, { key: "spec", header: "Specialization", cell: (row: Doctor) => row.specialization },
    {
      key: "dept",
      header: "Department",
      cell: (row: Doctor) => row.departmentName ?? "—",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: Doctor) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { openEdit(row); setDialogOpen(true) }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete doctor?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove {row.name} from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(row.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Doctors"
        description="Manage clinic doctors"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button className="bg-accent hover:bg-accent/90" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Doctor
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editDoctor ? "Edit Doctor" : "Add Doctor"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="specialization" render={({ field }) => (
                    <FormItem><FormLabel>Specialization</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField
                    control={form.control}
                    name="consultationFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consultation Fee ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="departmentName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Type to search departments..."
                            value={deptSearch}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDeptSearch(val);
                              field.onChange(val);
                              // Clear selection if user modifies input
                              if (val !== (departments?.find(d => d.id === selectedDeptId)?.name ?? "")) {
                                setSelectedDeptId(null);
                              }
                            }}
                          />
                          {deptSearch && filteredDepts.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 border rounded-md bg-white shadow-lg">
                              {filteredDepts.map((dept) => (
                                <button
                                  key={dept.id}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-muted text-sm border-b last:border-b-0"
                                  onClick={() => {
                                    setDeptSearch(dept.name);
                                    setSelectedDeptId(dept.id);
                                    field.onChange(dept.name);
                                  }}
                                >
                                  {dept.name}
                                </button>
                              ))}
                            </div>
                          )}
                          {deptSearch && filteredDepts.length === 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 border rounded-md bg-white shadow-lg p-3 text-sm text-muted-foreground">
                              No departments found
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {!editDoctor && (
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  )}
                  <Button type="submit" className="w-full" disabled={creating || updating}>
                    {editDoctor ? "Update" : "Create"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {isError ? (
        <QueryError onRetry={refetch} />
      ) : isLoading ? (
        <SkeletonTable columns={6} />
      ) : !doctors?.length ? (
        <EmptyState title="No doctors" description="Add your first doctor to get started." />
      ) : (
        <DataTable columns={columns} data={doctors} getRowKey={(r) => r.id} />
      )}
    </div>
  );
}
