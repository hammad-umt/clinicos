import { DashboardShell } from "@/components/layout/DashboardShell";
import { RoleGuard } from "@/components/layout/RoleGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard>
      <DashboardShell>{children}</DashboardShell>
    </RoleGuard>
  );
}
