"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getAllowedRolesForPath } from "@/lib/navigation";
import { SkeletonDashboardLayout } from "@/components/shared/PageSkeletons";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isHydrated } = useAuth();
  const allowedRoles = getAllowedRolesForPath(pathname) ?? [];

  const { isReady } = useRoleGuard(allowedRoles);

  if (!isHydrated || !isReady) {
    return <SkeletonDashboardLayout />;
  }

  return <>{children}</>;
}
