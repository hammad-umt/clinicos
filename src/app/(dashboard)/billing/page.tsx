"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Search,
  Printer,
  CheckCircle,
  Clock,
  Banknote,
  Receipt,
  User,
  Stethoscope,
  CalendarDays,
  FileSearch,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/shared/DataTable";
import { SkeletonTable } from "@/components/shared/SkeletonTable";

import {
  useGetAllBillsQuery,
  useUpdateBillChargesMutation,
  useMarkBillPaidMutation,
} from "@/store/api/billApi";
import { useGetClinicInfoQuery } from "@/store/api/clinicApi";

import { formatCurrency, formatDate } from "@/lib/utils";
import type { Bill } from "@/types";

/* ──────────────────────────── Schema ──────────────────────────── */
const schema = z.object({
  extraCharges: z.number().min(0, "Charges must be 0 or greater"),
});
type FormType = z.infer<typeof schema>;

/* ────────────────────── Print‑friendly HTML ───────────────────── */
function buildPrintHtml(bill: Bill, clinic: { name: string; address: string; phone: string } | null) {
  const clinicName = clinic?.name || "Clinic";
  const clinicAddress = clinic?.address || "";
  const clinicPhone = clinic?.phone || "";

  const discount = bill.discount ?? 0;
  const extraCharges = bill.extraCharges ?? 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Bill - ${bill.patientName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: #fff; padding: 0; }
    .bill-page { max-width: 800px; margin: 0 auto; padding: 40px 48px; }
    .bill-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0ea5e9; padding-bottom: 24px; margin-bottom: 32px; }
    .clinic-info h1 { font-size: 28px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
    .clinic-info p { font-size: 13px; color: #64748b; margin-top: 4px; }
    .bill-meta { text-align: right; }
    .bill-meta .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; }
    .bill-meta .value { font-size: 14px; color: #0f172a; font-weight: 500; margin-top: 2px; }
    .bill-meta .status { display: inline-block; margin-top: 8px; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-unpaid { background: #fef3c7; color: #92400e; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 36px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; }
    .info-box .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 8px; }
    .info-box .info-name { font-size: 18px; font-weight: 600; color: #0f172a; }
    .bill-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    .bill-table th { background: #f1f5f9; text-align: left; padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    .bill-table th:last-child { text-align: right; }
    .bill-table td { padding: 14px 16px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .bill-table td:last-child { text-align: right; font-weight: 500; font-variant-numeric: tabular-nums; }
    .total-section { display: flex; justify-content: flex-end; }
    .total-box { width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #475569; }
    .total-row.grand { border-top: 2px solid #0ea5e9; margin-top: 8px; padding-top: 14px; font-size: 20px; font-weight: 700; color: #0f172a; }
    .bill-footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
    @media print { body { padding: 0; } .bill-page { padding: 20px 24px; } @page { margin: 0.5in; size: A4; } }
  </style>
</head>
<body>
  <div class="bill-page">
    <div class="bill-header">
      <div class="clinic-info">
        <h1>${clinicName}</h1>
        ${clinicAddress ? `<p>${clinicAddress}</p>` : ""}
        ${clinicPhone ? `<p>Phone: ${clinicPhone}</p>` : ""}
      </div>
      <div class="bill-meta">
        <div class="label">Bill Date</div>
        <div class="value">${new Date(bill.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}</div>
        <div class="status ${bill.isPaid ? "status-paid" : "status-unpaid"}">${bill.isPaid ? "Paid" : "Unpaid"}</div>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-box">
        <div class="section-title">Patient</div>
        <div class="info-name">${bill.patientName || "—"}</div>
      </div>
      <div class="info-box">
        <div class="section-title">Doctor</div>
        <div class="info-name">${bill.doctorName || "—"}</div>
      </div>
    </div>
    <table class="bill-table">
      <thead>
        <tr><th>Description</th><th>Amount</th></tr>
      </thead>
      <tbody>
        <tr><td>Consultation Fee</td><td>Rs ${bill.consultationFee.toLocaleString()}</td></tr>
        ${extraCharges > 0 ? `<tr><td>Extra Charges</td><td>Rs ${extraCharges.toLocaleString()}</td></tr>` : ""}
        ${discount > 0 ? `<tr><td>Discount</td><td style="color:#dc2626">- Rs ${discount.toLocaleString()}</td></tr>` : ""}
      </tbody>
    </table>
    <div class="total-section">
      <div class="total-box">
        <div class="total-row"><span>Subtotal</span><span>Rs ${(bill.consultationFee + extraCharges).toLocaleString()}</span></div>
        ${discount > 0 ? `<div class="total-row"><span>Discount</span><span style="color:#dc2626">- Rs ${discount.toLocaleString()}</span></div>` : ""}
        <div class="total-row grand"><span>Total</span><span>Rs ${bill.totalAmount.toLocaleString()}</span></div>
      </div>
    </div>
    <div class="bill-footer">
      <p>Thank you for visiting ${clinicName}.</p>
      <p style="margin-top:4px">This is a computer-generated bill.</p>
    </div>
  </div>
</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════════════
   BILLING PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(0); // 0 = unpaid, 1 = paid
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [billToUpdate, setBillToUpdate] = useState<Bill | null>(null);
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  /* ── RTK Queries / Mutations ── */
  const { data: bills = [], isLoading } = useGetAllBillsQuery();
  const { data: clinic } = useGetClinicInfoQuery();
  const [updateCharges, { isLoading: updating }] = useUpdateBillChargesMutation();
  const [markPaid, { isLoading: marking }] = useMarkBillPaidMutation();
  const [markingId, setMarkingId] = useState<string | null>(null);

  /* ── Derived lists ── */
  const unpaidBills = useMemo(() => bills.filter((b) => !b.isPaid), [bills]);
  const paidBills = useMemo(() => bills.filter((b) => b.isPaid), [bills]);

  const displayedBills = activeTab === 0 ? unpaidBills : paidBills;

  const filteredBills = useMemo(() => {
    if (!searchQuery.trim()) return displayedBills;
    const q = searchQuery.toLowerCase();
    return displayedBills.filter(
      (b) =>
        b.patientName.toLowerCase().includes(q) ||
        (b.doctorName && b.doctorName.toLowerCase().includes(q))
    );
  }, [displayedBills, searchQuery]);

  /* ── Form ── */
  const form = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: { extraCharges: 0 },
  });

  /* ── Handlers ── */
  const onSubmitUpdate = async (values: FormType) => {
    if (!billToUpdate) return;
    const toastId = toast.loading("Updating charges...");
    try {
      const updated = await updateCharges({
        id: billToUpdate.id,
        extraCharges: values.extraCharges,
      }).unwrap();
      toast.success("Charges updated", { id: toastId });
      if (selectedBill?.id === updated.id) {
        setSelectedBill(updated);
      }
      setUpdateDialogOpen(false);
      setBillToUpdate(null);
    } catch {
      toast.error("Failed to update charges", { id: toastId });
    }
  };

  const handleMarkPaid = async (id: string) => {
    setMarkingId(id);
    const toastId = toast.loading("Marking as paid...");
    try {
      await markPaid(id).unwrap();
      toast.success("Bill marked as paid — today's income updated!", { id: toastId });
      if (selectedBill?.id === id) {
        setSelectedBill({ ...selectedBill, isPaid: true, status: "Paid" });
      }
    } catch {
      toast.error("Failed to mark as paid", { id: toastId });
    } finally {
      setMarkingId(null);
    }
  };

  /* ── Print as PDF ── */
  const handlePrint = useCallback(
    (bill: Bill) => {
      const html = buildPrintHtml(
        bill,
        clinic ? { name: clinic.name, address: clinic.address, phone: clinic.phone } : null
      );
      let frame = printFrameRef.current;
      if (!frame) {
        frame = document.createElement("iframe");
        frame.style.position = "fixed";
        frame.style.right = "0";
        frame.style.bottom = "0";
        frame.style.width = "0";
        frame.style.height = "0";
        frame.style.border = "none";
        document.body.appendChild(frame);
        printFrameRef.current = frame;
      }
      const doc = frame.contentDocument || frame.contentWindow?.document;
      if (!doc) return;
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        frame!.contentWindow?.focus();
        frame!.contentWindow?.print();
      }, 400);
    },
    [clinic]
  );

  /* ── Summary Stats ── */
  const totalUnpaidAmount = useMemo(() => unpaidBills.reduce((sum, b) => sum + b.totalAmount, 0), [unpaidBills]);
  const totalPaidAmount = useMemo(() => paidBills.reduce((sum, b) => sum + b.totalAmount, 0), [paidBills]);

  /* ── Table Columns ── */
  const columns = useMemo(
    () => [
      {
        key: "patient",
        header: "Patient",
        cell: (row: Bill) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-foreground">{row.patientName}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {formatDate(row.createdAt)}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "doctor",
        header: "Doctor",
        cell: (row: Bill) => (
          row.doctorName ? (
            <div className="flex items-center gap-1.5 text-sm">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              {row.doctorName}
            </div>
          ) : "—"
        ),
      },
      {
        key: "amount",
        header: "Total Amount",
        cell: (row: Bill) => (
          <span className="font-semibold tabular-nums">{formatCurrency(row.totalAmount)}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row: Bill) => <StatusBadge status={row.isPaid ? "Paid" : "Unpaid"} />,
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        cell: (row: Bill) => (
          <div className="flex items-center justify-end gap-2">
            {!row.isPaid && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setBillToUpdate(row);
                  setUpdateDialogOpen(true);
                  form.reset({ extraCharges: row.extraCharges ?? 0 });
                }}
              >
                Update
              </Button>
            )}
            {!row.isPaid && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkPaid(row.id);
                }}
                disabled={markingId === row.id}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Mark Paid
              </Button>
            )}
            {row.isPaid && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrint(row);
                }}
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Receipt
              </Button>
            )}
          </div>
        ),
      },
    ],
    [handleMarkPaid, handlePrint, form, markingId]
  );

  const isSearching = !!searchQuery.trim() && !filteredBills.length;
  const isEmptySearch = !isLoading && !filteredBills.length && !!searchQuery.trim();
  const isEmptySystem = !isLoading && !filteredBills.length && !searchQuery.trim();

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Billing"
        description="Manage patient bills, print receipts, and track payments"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Unpaid bills"
          value={String(unpaidBills.length)}
          subtext={formatCurrency(totalUnpaidAmount)}
          icon={Clock}
        />
        <StatCard
          label="Paid bills"
          value={String(paidBills.length)}
          subtext={formatCurrency(totalPaidAmount)}
          icon={CheckCircle}
        />
        <StatCard
          label="Total bills"
          value={String(bills.length)}
          subtext={formatCurrency(totalUnpaidAmount + totalPaidAmount)}
          icon={Receipt}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(Number(val))}>
          <TabsList>
            <TabsTrigger value={0}>
              <Clock className="h-4 w-4 mr-1.5" />
              Unpaid
            </TabsTrigger>
            <TabsTrigger value={1}>
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Paid
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient or doctor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading || isSearching ? (
        <SkeletonTable columns={5} />
      ) : isEmptySearch ? (
        <div className="rounded-3xl border border-dashed border-border bg-background p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileSearch className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">No matching bills.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try another search term.
          </p>
        </div>
      ) : isEmptySystem ? (
        <div className="rounded-3xl border border-dashed border-border bg-background p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">No {activeTab === 0 ? "unpaid" : "paid"} bills found.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeTab === 0 ? "All bills are cleared 🎉" : "No payments recorded yet."}
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredBills}
          getRowKey={(row) => row.id}
          onRowClick={(row) => setSelectedBill(row)}
        />
      )}

      {/* ── Bill Sheet Details ── */}
      <Sheet open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
          {selectedBill && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-accent" />
                      Bill Details
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedBill.patientName} {selectedBill.doctorName ? ` • Dr. ${selectedBill.doctorName}` : ""}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Amount</p>
                    <p className="text-3xl font-bold text-foreground mt-0.5 tabular-nums">
                      {formatCurrency(selectedBill.totalAmount)}
                    </p>
                  </div>
                  <StatusBadge status={selectedBill.isPaid ? "Paid" : "Unpaid"} />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Breakdown</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                      <span className="text-foreground">Consultation Fee</span>
                      <span className="font-medium tabular-nums">{formatCurrency(selectedBill.consultationFee)}</span>
                    </div>
                    {(selectedBill.extraCharges ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-dashed">
                        <span className="text-foreground">Extra Charges</span>
                        <span className="font-medium tabular-nums">{formatCurrency(selectedBill.extraCharges!)}</span>
                      </div>
                    )}
                    {(selectedBill.discount ?? 0) > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-dashed">
                        <span className="text-foreground">Discount</span>
                        <span className="font-medium text-red-500 tabular-nums">-{formatCurrency(selectedBill.discount!)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 text-xs text-muted-foreground mt-4">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Date Generated</span>
                      <span>{formatDate(selectedBill.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-muted/20">
                <div className="flex flex-col gap-3">
                  {!selectedBill.isPaid && (
                    <>
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleMarkPaid(selectedBill.id)}
                        disabled={markingId === selectedBill.id}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Paid
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setBillToUpdate(selectedBill);
                          setUpdateDialogOpen(true);
                          form.reset({ extraCharges: selectedBill.extraCharges ?? 0 });
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Update Charges
                      </Button>
                    </>
                  )}
                  <Button
                    variant={selectedBill.isPaid ? "default" : "secondary"}
                    className="w-full"
                    onClick={() => handlePrint(selectedBill)}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Bill
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Update Charges Dialog ── */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Bill Charges</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="extraCharges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extra Charges (Rs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  Save Charges
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}