"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, X, Check, Folder } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

import { DataTable } from "@/components/shared/DataTable";

import { Input } from "@/components/ui/input";

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

const schema = z.object({
  name: z.string().min(2, "Name is required"),
});

type FormType = z.infer<typeof schema>;

export default function DepartmentsPage() {
  const [open, setOpen] = useState(false);

  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: clinic } = useGetClinicInfoQuery();
  const { data: departments, isLoading, isError, refetch } =
    useGetDepartmentsQuery();

  const [createDepartment, { isLoading: creating }] =
    useCreateDepartmentMutation();

  const [deleteDepartment] = useDeleteDepartmentMutation();

  const form = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    initializeSpecializations();
  }, []);

  const suggestions = useMemo(() => {
    if (!input.trim()) return filterSpecializations("");
    return filterSpecializations(input);
  }, [input]);

  const resetAll = () => {
    setInput("");
    setSelected(null);
    setShowSuggestions(false);
    form.reset({ name: "" });
  };

  const selectItem = (value: string) => {
    setSelected(value);
    setInput(value);
    form.setValue("name", value);
    setShowSuggestions(false);
  };

  const onSubmit = async (data: FormType) => {
    const toastId = toast.loading("Creating department...");

    try {
      addSpecialization(data.name);

      await createDepartment({
        name: data.name,
        clinicId: Number(clinic?.id ?? 1),
      }).unwrap();

      toast.success("Department created", { id: toastId });

      setOpen(false);
      resetAll();
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

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Department",
        cell: (row: any) => <span className="font-medium text-foreground">{row.name}</span>,
      },
      {
        key: "actions",
        header: "Actions",
        className: "text-right",
        cell: (row: any) => (
          <div className="flex justify-end gap-1">
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete department?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove {row.name}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(row.id, row.name)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
      },
    ],
    [handleDelete]
  );

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Departments"
        description="Manage clinic departments"
        action={
          <Dialog
            open={open}
            onOpenChange={(state) => {
              setOpen(state);
              if (!state) resetAll();
            }}
          >
            <DialogTrigger>
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Department</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={() => (
                      <FormItem>
                        <FormLabel>Specialization</FormLabel>

                        <FormControl>
                          <div className="relative">
                            <div
                              className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 min-h-[42px] focus-within:ring-2 focus-within:ring-accent"
                              onClick={() => setShowSuggestions(true)}
                            >
                              {selected && (
                                <div className="flex items-center gap-1 rounded-full bg-accent/10 text-accent px-2 py-1 text-xs">
                                  {selected}
                                  <button type="button" onClick={resetAll}>
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              )}

                              <Input
                                value={input}
                                onChange={(e) => {
                                  setInput(e.target.value);
                                  setSelected(null);
                                  form.setValue("name", e.target.value);
                                  setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder={
                                  selected
                                    ? ""
                                    : "Search or add specialization..."
                                }
                                className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 flex-1"
                              />
                            </div>

                            {showSuggestions && (
                              <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-48 overflow-auto">
                                {suggestions.length ? (
                                  suggestions.map((item) => (
                                    <button
                                      key={item}
                                      type="button"
                                      className="w-full flex justify-between px-3 py-2 text-sm hover:bg-muted"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        selectItem(item);
                                      }}
                                    >
                                      {item}
                                      {selected === item && (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-3 text-sm text-muted-foreground">
                                    Press Enter to create "{input}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={creating}
                  >
                    Create Department
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* TABLE */}
      {isError ? (
        <QueryError onRetry={refetch} />
      ) : isLoading ? (
        <SkeletonTable columns={2} />
      ) : !departments?.length ? (
        <EmptyState
          title="No departments yet"
          description="Create your first department to organize clinic workflow."
          icon={Folder}
        />
      ) : (
        <div>
          <DataTable
            columns={columns}
            data={departments}
            getRowKey={(r) => r.id}
          />
        </div>
      )}
    </div>
  );
}