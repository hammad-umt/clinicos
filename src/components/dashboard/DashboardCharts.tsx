"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Bill, Token, TokenStatus } from "@/types";

const STATUS_COLORS: Record<TokenStatus, string> = {
  Pending: "#f59e0b",
  InProgress: "#0ea5e9",
  Completed: "#10b981",
  NoShow: "#ef4444",
};

const STATUS_LABELS: Record<TokenStatus, string> = {
  Pending: "Waiting",
  InProgress: "In progress",
  Completed: "Done",
  NoShow: "Skipped",
};

interface DashboardChartsProps {
  todayTokens: Token[];
  bills: Bill[];
  lastMonthLabel: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; payload?: { fill?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{payload[0].value}</p>
    </div>
  );
}

export function DashboardCharts({ todayTokens, bills, lastMonthLabel }: DashboardChartsProps) {
  const tokenStatusData = useMemo(() => {
    const counts: Record<TokenStatus, number> = {
      Pending: 0,
      InProgress: 0,
      Completed: 0,
      NoShow: 0,
    };

    todayTokens.forEach((token) => {
      counts[token.status] += 1;
    });

    return (Object.keys(counts) as TokenStatus[])
      .map((status) => ({
        name: STATUS_LABELS[status],
        value: counts[status],
        fill: STATUS_COLORS[status],
      }))
      .filter((item) => item.value > 0);
  }, [todayTokens]);

  const billingData = useMemo(() => {
    const paid = bills.filter((bill) => bill.isPaid);
    const unpaid = bills.filter((bill) => !bill.isPaid);

    return [
      {
        name: "Paid",
        count: paid.length,
        amount: paid.reduce((sum, bill) => sum + bill.totalAmount, 0),
        fill: "#10b981",
      },
      {
        name: "Unpaid",
        count: unpaid.length,
        amount: unpaid.reduce((sum, bill) => sum + bill.totalAmount, 0),
        fill: "#f59e0b",
      },
    ];
  }, [bills]);

  const hasTokenData = tokenStatusData.length > 0;
  const hasBillingData = bills.length > 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Token status</CardTitle>
          <CardDescription>Today&apos;s queue breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {hasTokenData ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tokenStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {tokenStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm">
                {tokenStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-muted-foreground">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-16 text-center">
              No token data for today yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing overview</CardTitle>
          <CardDescription>{lastMonthLabel} — paid vs unpaid</CardDescription>
        </CardHeader>
        <CardContent>
          {hasBillingData ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={billingData} barGap={8}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Bills" radius={[4, 4, 0, 0]}>
                    {billingData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {billingData.map((item) => (
                  <div key={item.name} className="rounded-md border px-3 py-2">
                    <p className="text-muted-foreground">{item.name} amount</p>
                    <p className="font-medium tabular-nums">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-16 text-center">
              No bills for {lastMonthLabel}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
