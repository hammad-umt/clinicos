import { Badge } from "@/components/ui/badge";
import type { TokenStatus, BillStatus } from "@/types";
import { cn } from "@/lib/utils";

type StatusType = TokenStatus | BillStatus | string;

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  InProgress: "bg-sky-100 text-sky-800 border-sky-200",
  Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  NoShow: "bg-red-100 text-red-800 border-red-200",
  Paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Unpaid: "bg-amber-100 text-amber-800 border-amber-200",
};

export function StatusBadge({ status }: { status: StatusType }) {
  const label = status.replace(/([A-Z])/g, " $1").trim();
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusStyles[status] ?? "")}
    >
      {label}
    </Badge>
  );
}
