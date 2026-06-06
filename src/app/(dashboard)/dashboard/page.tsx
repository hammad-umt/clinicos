"use client";

import { Users, Stethoscope, Ticket, Banknote } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkeletonStatCards } from "@/components/shared/PageSkeletons";
import { SkeletonTable } from "@/components/shared/SkeletonTable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryError } from "@/components/shared/QueryError";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useGetDashboardStatsQuery } from "@/store/api/dashboardApi";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useGetAllTokensQuery } from "@/store/api/tokenApi";

const statCards: {
  key: "todayPatients" | "totalPatients" | "totalDoctors" | "todayRevenue";
  label: string;
  icon: typeof Ticket;
  format?: (n: number) => string;
}[] = [
    { key: "todayPatients", label: "Today's Patients", icon: Ticket },
    { key: "totalPatients", label: "Total Patients", icon: Users },
    { key: "totalDoctors", label: "Total Doctors", icon: Stethoscope },
    { key: "todayRevenue", label: "Revenue Today", icon: Banknote, format: formatCurrency },
  ];

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useGetDashboardStatsQuery();
  const { data: tokensData, isLoading: tokensLoading, isError: tokensError, } = useGetAllTokensQuery();
  console.log("Dashboard stats:", data);
  if (isError) {
    return <QueryError onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description="Overview of today's clinic activity"
        />
        <SkeletonStatCards />
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Tokens</CardTitle>
            <CardDescription>Latest queue activity today</CardDescription>
          </CardHeader>
          <CardContent>
            <SkeletonTable columns={5} rows={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of today's clinic activity"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {statCards.map(({ key, label, icon: Icon, format }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {format && data
                  ? format(data[key] as number)
                  : String(data?.[key] ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tokens</CardTitle>
          <CardDescription>Latest queue activity today</CardDescription>
        </CardHeader>
        <CardContent>
          {!tokensData?.length ? (
            <EmptyState title="No tokens today" description="Tokens issued today will appear here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokensData.map((token) => (
                  <TableRow key={token.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">#{token.tokenNumber}</TableCell>
                    <TableCell>{token.patientName}</TableCell>
                    <TableCell>{token.doctorName ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={token.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(token.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
