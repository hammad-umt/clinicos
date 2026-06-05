"use client";

import { Activity, LogOut } from "lucide-react";
import { getNavItemsForRole } from "@/lib/navigation";
import { useAuth } from "@/hooks/useAuth";
import { NavItem } from "./NavItem";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/store/authSlice";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { role } = useAuth();
  const items = role ? getNavItemsForRole(role) : [];
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
    } catch {}
    dispatch(logout());
    router.push("/login");
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
          <Activity className="h-6 w-6 text-accent-foreground" />
        </div>
        <div>
          <p className="text-lg font-bold text-white leading-none">ClinicOS</p>
          <p className="text-sm text-sidebar-foreground/60 mt-0.5">Lahore, PK</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {items.map((item) => (
          <NavItem key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3">
        <Button variant="ghost" size="default" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
