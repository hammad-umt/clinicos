"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { QueryError } from "@/components/shared/QueryError";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
} from "@/store/api/departmentApi";
import { useGetClinicInfoQuery } from "@/store/api/clinicApi";
import {
  initializeSpecializations,
  filterSpecializations,
  addSpecialization,
} from "@/lib/specializations";

const deptSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
});

type DeptForm = z.infer<typeof deptSchema>;

export default function DepartmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameSearch, setNameSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [allSpecializations, setAllSpecializations] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: clinic } = useGetClinicInfoQuery();
  const { data: departments, isLoading, isError, refetch } = useGetDepartmentsQuery();
  const [createDepartment, { isLoading: creating }] = useCreateDepartmentMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();

  const form = useForm<DeptForm>({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: "", description: "" },
  });

  // Initialize specializations on mount
  useEffect(() => {
    initializeSpecializations();
    const specs = filterSpecializations("");
    setAllSpecializations(specs);
  }, []);

  // Show all specializations or filter based on search
  const filteredDepts = useMemo(() => {
    return filterSpecializations(nameSearch);
  }, [nameSearch]);

  const onSubmit = async (values: DeptForm) => {
    const toastId = toast.loading("Creating department...");
    try {
      // Add specialization to LocalStorage if it's new
      addSpecialization(values.name);

      await createDepartment({
        name: values.name,
        description: values.description,
        clinicId: Number(clinic?.id ?? 1),
      }).unwrap();

      toast.success("Department created", { id: toastId });
      setDialogOpen(false);
      form.reset();
      setNameSearch("");
      setSelectedName("");
      setShowSuggestions(false);

      // Refresh specializations list
      const updated = filterSpecializations("");
      setAllSpecializations(updated);
    } catch {
      toast.error("Failed to create department", { id: toastId });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const toastId = toast.loading("Deleting department...");
    try {
      await deleteDepartment(id).unwrap();
      toast.success(`${name} deleted`, { id: toastId });
    } catch {
      toast.error("Failed to delete department", { id: toastId });
    }
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Manage clinic departments"
        action={
          <Dialog 
            open={dialogOpen} 
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                form.reset();
                setNameSearch("");
                setSelectedName("");
                setShowSuggestions(false);
              }
            }}
          >
            <DialogTrigger
              render={
                <Button className="bg-accent hover:bg-accent/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Department</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Search or enter specialization..."
                              value={nameSearch}
                              onFocus={() => setShowSuggestions(true)}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNameSearch(val);
                                field.onChange(val);
                              }}
                              onBlur={() => {
                                setTimeout(() => setShowSuggestions(false), 200);
                              }}
                              autoComplete="off"
                            />
                            {selectedName && (
                              <div className="flex items-center gap-1 px-3 py-1 bg-accent text-accent-foreground rounded-md whitespace-nowrap text-sm font-medium">
                                <Check className="h-4 w-4" />
                                {selectedName}
                              </div>
                            )}
                          </div>
                          {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
                              {filteredDepts.length > 0 ? (
                                <>
                                  <div className="sticky top-0 p-2 text-xs font-semibold text-muted-foreground border-b bg-muted">
                                    Suggestions ({filteredDepts.length})
                                  </div>
                                  {filteredDepts.map((spec, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      className={`w-full px-3 py-2 text-left text-sm border-b last:border-b-0 transition-colors flex items-center justify-between ${
                                        selectedName === spec
                                          ? "bg-accent text-accent-foreground font-medium"
                                          : "hover:bg-accent/50"
                                      }`}
                                      onClick={() => {
                                        setNameSearch(spec);
                                        setSelectedName(spec);
                                        field.onChange(spec);
                                        setShowSuggestions(false);
                                      }}
                                    >
                                      <span>{spec}</span>
                                      {selectedName === spec && <Check className="h-4 w-4" />}
                                    </button>
                                  ))}
                                </>
                              ) : (
                                <div className="p-3 text-sm text-muted-foreground">
                                  No matching specializations. Type to create a new one.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={creating}>
                    Create
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
        <SkeletonTable columns={3} />
      ) : !departments?.length ? (
        <EmptyState title="No departments" description="Add departments to organize doctors." />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {dept.description ?? "—"}
                  </TableCell>
                  <TableCell>
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
                          <AlertDialogTitle>Delete department?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove {dept.name}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(dept.id, dept.name)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
