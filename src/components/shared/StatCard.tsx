import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, subtext, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold mt-1 tabular-nums truncate">{value}</p>
            {subtext && (
              <p className="text-sm text-muted-foreground mt-1 tabular-nums">{subtext}</p>
            )}
          </div>
          <Icon className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
