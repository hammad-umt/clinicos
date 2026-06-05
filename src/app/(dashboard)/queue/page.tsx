"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Badge, FileDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { QueryError } from "@/components/shared/QueryError";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetTodayTokensQuery,
  useUpdateTokenStatusMutation,
} from "@/store/api/tokenApi";
import { useCreateVisitMutation, useUpdateVisitMutation } from "@/store/api/visitApi";
import {
  useCreatePrescriptionMutation,
  useLazyGetPrescriptionPdfQuery,
} from "@/store/api/prescriptionApi";
import type { Token, TokenStatus } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const visitSchema = z.object({
  chiefComplaint: z.string().min(2, "Chief complaint required"),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
});

const prescriptionSchema = z.object({
  items: z
    .array(
      z.object({
        medicine: z.string().min(1, "Required"),
        dosage: z.string().min(1, "Required"),
        frequency: z.string().min(1, "Required"),
        duration: z.string().min(1, "Required"),
        instructions: z.string().optional(),
      })
    )
    .min(1),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
});

type VisitForm = z.infer<typeof visitSchema>;
type PrescriptionForm = z.infer<typeof prescriptionSchema>;

const tokenStatuses: TokenStatus[] = [
  "Pending",
  "InProgress",
  "Completed",
  "NoShow",
];

export default function QueuePage() {
  const { doctorId } = useAuth();
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);

  const { data: tokens, isLoading, isError, refetch } = useGetTodayTokensQuery(
    doctorId!,
    { skip: !doctorId }
  );
  const [updateStatus] = useUpdateTokenStatusMutation();
  const [createVisit, { isLoading: creatingVisit }] = useCreateVisitMutation();
  const [updateVisit] = useUpdateVisitMutation();
  const [createPrescription, { isLoading: creatingRx }] =
    useCreatePrescriptionMutation();
  const [fetchPdf] = useLazyGetPrescriptionPdfQuery();
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);

  const visitForm = useForm<VisitForm>({
    resolver: zodResolver(visitSchema),
    defaultValues: { chiefComplaint: "", diagnosis: "", notes: "" },
  });

  const rxForm = useForm<PrescriptionForm>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      items: [{ medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }],
      notes: "",
      followUpDate: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: rxForm.control,
    name: "items",
  });

  const startConsultation = (token: Token) => {
    setActiveToken(token);
    setVisitId(null);
    setPrescriptionId(null);
    setShowPrescriptionDialog(false);
    visitForm.reset();
    rxForm.reset({
      items: [{ medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }],
      notes: "",
      followUpDate: "",
    });
  };

  const handleStatusChange = async (id: string, status: TokenStatus) => {
    const token = tokens?.find(t => t.id === id);
    
    // Prevent marking token as Completed without a visit
    if (status === "Completed" && activeToken?.id === id && !visitId) {
      toast.error("Create a visit before marking as completed");
      return;
    }

    const toastId = toast.loading("Updating status...");
    try {
      await updateStatus({ id, status }).unwrap();
      
      // If marked as Completed and there's a visit, update visit status
      if (status === "Completed" && visitId) {
        await updateVisit({
          id: visitId,
          diagnosis: "",
          notes: "Completed",
        }).unwrap();
      }
      
      await refetch();
      toast.success("Status updated", { id: toastId });
    } catch {
      toast.error("Failed to update", { id: toastId });
    }
  };

  const onCreateVisit = async (values: VisitForm) => {
    if (!activeToken || !doctorId) return;
    const toastId = toast.loading("Creating visit...");
    try {
      const visit = await createVisit({
        patientId: activeToken.patientId,
        doctorId,
        tokenId: activeToken.id,
        ...values,
      }).unwrap();
      setVisitId(visit.id);
      setShowPrescriptionDialog(true);
      await updateStatus({ id: activeToken.id, status: "InProgress" }).unwrap();
      toast.success("Visit created", { id: toastId });
      refetch();
    } catch {
      toast.error("Failed to create visit", { id: toastId });
    }
  };

  const onCreatePrescription = async (values: PrescriptionForm) => {
    if (!visitId) return;
    const toastId = toast.loading("Saving prescription...");
    try {
      // Provide default follow-up date (7 days from now) if not specified
      let followUpDate = values.followUpDate;
      if (!followUpDate) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        followUpDate = futureDate.getFullYear() + "-" +
          String(futureDate.getMonth() + 1).padStart(2, "0") + "-" +
          String(futureDate.getDate()).padStart(2, "0");
      }
      
      const rx = await createPrescription({ 
        visitId, 
        ...values,
        followUpDate,
      }).unwrap();
      setPrescriptionId(rx.id);
      toast.success("Prescription saved", { id: toastId });
    } catch (error: any) {
      const message = error?.data?.message || "Failed to save prescription";
      toast.error(message, { id: toastId });
    }
  };

  const exportPdf = async () => {
    if (!prescriptionId) return;
    const toastId = toast.loading("Generating PDF...");
    try {
      const blob = await fetchPdf(prescriptionId).unwrap();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.success("PDF opened", { id: toastId });
    } catch {
      toast.error("Failed to export PDF", { id: toastId });
    }
  };

  if (!doctorId) {
    return (
      <EmptyState
        title="Doctor profile not linked"
        description="Your account is not linked to a doctor profile."
      />
    );
  }

  return (
    <div>
      <PageHeader title="My Queue" description="Today's patient queue" />

      {isError ? (
        <QueryError onRetry={refetch} />
      ) : isLoading ? (
        <SkeletonTable columns={4} />
      ) : !tokens?.length ? (
        <EmptyState title="Queue is empty" description="No patients waiting today." />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Token #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id} className="hover:bg-muted/50">
                  <TableCell className="text-2xl font-bold text-accent">
                    #{token.tokenNumber}
                  </TableCell>
                  <TableCell className="text-lg font-medium">
                    {token.patientName}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={token.status} />
                  </TableCell>
                  <TableCell className="flex gap-2 items-center">
                    <Button
                      size="sm"
                      disabled={token.status === "Completed"}
                      className="bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (activeToken?.id === token.id && visitId) {
                          setShowPrescriptionDialog(true);
                        } else {
                          startConsultation(token);
                        }
                      }}
                    >
                      <Play className="mr-1 h-4 w-4" />
                      {activeToken?.id === token.id && token.status === "InProgress" && visitId ? "Prescription" : "Start"}
                    </Button>
                    <Select
                      value={token.status}
                      onValueChange={(v) =>
                        handleStatusChange(token.id, v as TokenStatus)
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8">
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

      <Sheet
  open={!!activeToken}
  onOpenChange={(open) => !open && setActiveToken(null)}
>
  <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
    {/* Header */}
    <div className="border-b bg-muted/30 px-6 py-5">
      <SheetHeader>
        <SheetTitle className="text-xl font-bold">
          Consultation
        </SheetTitle>

        <div className="mt-3 flex items-center gap-2">
          <Badge >
            Token #{activeToken?.tokenNumber}
          </Badge>

          <Badge >
            {activeToken?.patientName}
          </Badge>
        </div>
      </SheetHeader>
    </div>

    <div className="p-6 space-y-6">
      {/* Patient Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Patient Information
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Patient Name</p>
            <p className="font-medium">
              {activeToken?.patientName}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Token Number</p>
            <p className="font-medium">
              #{activeToken?.tokenNumber}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Visit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Visit Record</CardTitle>
          <CardDescription>
            Record consultation details and diagnosis.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...visitForm}>
            <form
              onSubmit={visitForm.handleSubmit(onCreateVisit)}
              className="space-y-5"
            >
              <FormField
                control={visitForm.control}
                name="chiefComplaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chief Complaint</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Enter patient's symptoms..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={visitForm.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter diagnosis"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={visitForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinical Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="Additional notes, observations, recommendations..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={creatingVisit || !!visitId}
              >
                {visitId
                  ? "Visit Successfully Created"
                  : "Create Visit"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>  
  </SheetContent>
</Sheet>
      <Dialog open={showPrescriptionDialog} onOpenChange={(open) => {
        if (!open) {
          setShowPrescriptionDialog(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Prescription — #{activeToken?.tokenNumber} {activeToken?.patientName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Form {...rxForm}>
              <form onSubmit={rxForm.handleSubmit(onCreatePrescription)} className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Medicine {index + 1}</span>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                          Remove
                        </Button>
                      )}
                    </div>
                    <Input placeholder="Medicine" {...rxForm.register(`items.${index}.medicine`)} />
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Dosage" {...rxForm.register(`items.${index}.dosage`)} />
                      <Input placeholder="Frequency" {...rxForm.register(`items.${index}.frequency`)} />
                      <Input placeholder="Duration" {...rxForm.register(`items.${index}.duration`)} />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ medicine: "", dosage: "", frequency: "", duration: "", instructions: "" })}>
                  Add Medicine
                </Button>
                <FormField control={rxForm.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions/Notes (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Add any special instructions or notes..."
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={rxForm.control} name="followUpDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Select follow-up date..."
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">If not specified, will default to 7 days from now</p>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={creatingRx || !!prescriptionId} className="w-full">
                  {prescriptionId ? "Prescription Saved" : "Save Prescription"}
                </Button>
              </form>
            </Form>
            {prescriptionId && (
              <Button variant="outline" className="w-full" onClick={exportPdf}>
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
