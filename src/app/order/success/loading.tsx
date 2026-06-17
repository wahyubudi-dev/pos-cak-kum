import { Skeleton } from "@/components/ui/skeleton";

export default function OrderSuccessLoading() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-5 py-14 sm:px-6">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-border bg-card px-6 py-10 text-center sm:px-7 sm:py-12">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="mx-auto h-7 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
        <div className="flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-border bg-cream-paper/50 px-5 py-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-36" />
        </div>
        <div className="flex w-full flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </main>
  );
}
