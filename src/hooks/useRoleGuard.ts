"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import type { UserRole } from "@/types";

export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, role } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (role && !allowedRoles.includes(role)) {
      router.replace("/unauthorized");
    }
  }, [isAuthenticated, isHydrated, role, allowedRoles, router]);

  return { isReady: isHydrated && isAuthenticated && role !== null && allowedRoles.includes(role!) };
}
