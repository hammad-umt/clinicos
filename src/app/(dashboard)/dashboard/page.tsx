"use client";

import { useMemo } from "react";
import { Users, Stethoscope, Ticket, Banknote, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkeletonStatCards } from "@/components/shared/PageSkeletons";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryError } from "@/components/shared/QueryError";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { useGetDashboardStatsQuery } from "@/store/api/dashboardApi";
import { useGetAllBillsQuery } from "@/store/api/billApi";
import { formatCurrency, formatDate, getLastMonthRange, isInLastMonth } from "@/lib/utils";
import { useGetAllTokensQuery } from "@/store/api/tokenApi";
import type { Bill, Token } from "@/types";
import type { LucideIcon } from "lucide-react";

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

const stats: {
  key: keyof Pick<
    import("@/types").DashboardStats,
    "todayPatients" | "pendingTokens" | "totalPatients" | "totalDoctors" | "todayRevenue"
  >;
  label: string;
  icon: LucideIcon;
  format?: (n: number) => string;
}[] = [
  { key: "todayPatients", label: "Visits today", icon: Ticket },
  { key: "pendingTokens", label: "Waiting tokens", icon: Clock },
  { key: "totalPatients", label: "Total patients", icon: Users },
  { key: "totalDoctors", label: "Doctors", icon: Stethoscope },
  { key: "todayRevenue", label: "Revenue today", icon: Banknote, format: formatCurrency },
];

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useGetDashboardStatsQuery();
  const { data: bills = [], isLoading: billsLoading } = useGetAllBillsQuery();
  const {
    data: tokensData,
    isLoading: tokensLoading,
    isError: tokensError,
    refetch: refetchTokens,
  } = useGetAllTokensQuery();

  const lastMonthLabel = getLastMonthRange().label;

  const lastMonthBills = useMemo(() => {
    if (!bills.length) return [];
    return bills
      .filter((bill) => isInLastMonth(bill.createdAt))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [bills]);

  const todayTokens = useMemo(() => {
    if (!tokensData?.length) return [];
    return tokensData
      .filter((token) => isToday(token.createdAt))
      .sort((a, b) => b.tokenNumber - a.tokenNumber);
  }, [tokensData]);

  if (isError) {
    return <QueryError onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-6">
        <PageHeader title="Dashboard" description="Today's clinic overview" />
        <SkeletonStatCards />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardContent className="h-[300px]" /></Card>
          <Card><CardContent className="h-[300px]" /></Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s queue</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonTable columns={5} rows={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeader title="Dashboard" description="Today's clinic overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ key, label, icon, format }) => {
          const raw = data?.[key] ?? 0;
          const value = format ? format(raw as number) : String(raw);

          return (
            <StatCard key={key} label={label} value={value} icon={icon} />
          );
        })}
      </div>

      {!billsLoading && (
        <DashboardCharts
          todayTokens={todayTokens}
          bills={lastMonthBills}
          lastMonthLabel={lastMonthLabel}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bills — {lastMonthLabel}</CardTitle>
          <CardDescription>
            {lastMonthBills.length
              ? `${lastMonthBills.length} bill${lastMonthBills.length === 1 ? "" : "s"} from last month`
              : "No bills from last month"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billsLoading ? (
            <SkeletonTable columns={5} rows={4} />
          ) : !lastMonthBills.length ? (
            <EmptyState
              title="No bills last month"
              description={`No billing records for ${lastMonthLabel}.`}
              icon={Banknote}
            />
          ) : (
            <DataTable
              columns={[
                {
                  key: "patient",
                  header: "Patient",
                  cell: (row: Bill) => row.patientName,
                },
                {
                  key: "doctor",
                  header: "Doctor",
                  cell: (row: Bill) => row.doctorName ?? "—",
                },
                {
                  key: "amount",
                  header: "Amount",
                  cell: (row: Bill) => (
                    <span className="font-medium tabular-nums">
                      {formatCurrency(row.totalAmount)}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (row: Bill) => (
                    <StatusBadge status={row.isPaid ? "Paid" : "Unpaid"} />
                  ),
                },
                {
                  key: "date",
                  header: "Date",
                  cell: (row: Bill) => (
                    <span className="text-muted-foreground text-sm">
                      {formatDate(row.createdAt)}
                    </span>
                  ),
                },
              ]}
              data={lastMonthBills}
              getRowKey={(row) => row.id}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s queue</CardTitle>
          <CardDescription>
            {todayTokens.length
              ? `${todayTokens.length} token${todayTokens.length === 1 ? "" : "s"} issued today`
              : "No tokens issued yet today"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokensError ? (
            <QueryError onRetry={refetchTokens} />
          ) : tokensLoading ? (
            <SkeletonTable columns={5} rows={4} />
          ) : !todayTokens.length ? (
            <EmptyState
              title="No tokens today"
              description="Issued tokens will show up here."
              icon={Ticket}
            />
          ) : (
            <DataTable
              columns={[
                {
                  key: "tokenNumber",
                  header: "Token",
                  cell: (row: Token) => (
                    <span className="font-semibold">#{row.tokenNumber}</span>
                  ),
                },
                { key: "patient", header: "Patient", cell: (row: Token) => row.patientName },
                {
                  key: "doctor",
                  header: "Doctor",
                  cell: (row: Token) => row.doctorName ?? "—",
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (row: Token) => <StatusBadge status={row.status} />,
                },
                {
                  key: "time",
                  header: "Issued",
                  cell: (row: Token) => (
                    <span className="text-muted-foreground text-sm">
                      {formatDate(row.createdAt)}
                    </span>
                  ),
                },
              ]}
              data={todayTokens}
              getRowKey={(row) => row.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
