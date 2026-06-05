import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SkeletonPageHeader() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

export function SkeletonSearchBar() {
  return <Skeleton className="h-9 w-full max-w-md rounded-lg" />;
}

export function SkeletonSheetDetail() {
  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonDashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <div className="hidden lg:block w-64 border-r bg-sidebar p-4 space-y-3">
        <Skeleton className="h-10 w-full bg-sidebar-accent/30" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full bg-sidebar-accent/20" />
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="h-16 border-b bg-card px-6 flex items-center gap-4">
          <Skeleton className="h-8 w-8 lg:hidden" />
          <Skeleton className="h-5 w-40" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="hidden sm:block h-4 w-24" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6">
          <SkeletonPageHeader />
          <SkeletonStatCards />
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
