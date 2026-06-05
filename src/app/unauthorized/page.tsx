"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { getDefaultRouteForRole } from "@/lib/navigation";

export default function UnauthorizedPage() {
  const { role, isAuthenticated } = useAuth();
  const homeHref =
    role && isAuthenticated
      ? getDefaultRouteForRole(role) ?? "/login"
      : "/login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to view this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href={homeHref} />} className="w-full">
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
