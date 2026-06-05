import type { UserRole } from "@/types";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Ticket,
  ListOrdered,
  FileText,
  CreditCard,
  Building2,
  Settings,
  ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["Admin"],
  },
  {
    title: "Patients",
    href: "/patients",
    icon: Users,
    roles: ["Admin", "Receptionist"],
  },
  {
    title: "Tokens",
    href: "/tokens",
    icon: Ticket,
    roles: ["Admin", "Receptionist"],
  },
  {
    title: "Queue",
    href: "/queue",
    icon: ListOrdered,
    roles: ["Doctor"],
  },
  {
    title: "Visits",
    href: "/visits",
    icon: ClipboardList,
    roles: ["Admin", "Doctor", "Receptionist"],
  },
  {
    title: "Billing",
    href: "/billing",
    icon: CreditCard,
    roles: ["Admin", "Receptionist"],
  },
  {
    title: "Doctors",
    href: "/doctors",
    icon: Stethoscope,
    roles: ["Admin"],
  },
  {
    title: "Departments",
    href: "/departments",
    icon: Building2,
    roles: ["Admin"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["Admin"],
  },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}

export function getDefaultRouteForRole(role: UserRole | null): string | null {
  if (!role) return null;
  const items = getNavItemsForRole(role);
  return items[0]?.href ?? null;
}

export function getAllowedRolesForPath(pathname: string): UserRole[] | null {
  const item = navItems.find((n) => pathname.startsWith(n.href));
  return item?.roles ?? null;
}
