"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetClinicInfoQuery } from "@/store/api/clinicApi";
import { logout } from "@/store/authSlice";
import { baseApi } from "@/store/api/baseApi";
import { useAuth } from "@/hooks/useAuth";
import { MobileSidebar } from "./MobileSidebar";

export function Header() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userName, userEmail, role } = useAuth();
  const { data: clinic, isLoading } = useGetClinicInfoQuery();

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <MobileSidebar />
      <div className="flex-1">
        {isLoading ? (
          <Skeleton className="h-5 w-40" />
        ) : (
          <h2 className="text-sm font-semibold text-foreground truncate">
            {clinic?.name ?? "ClinicOS"}
          </h2>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{role}</p>
              </div>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground font-normal">{userEmail}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
