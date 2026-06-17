import { Skeleton, OrderCardSkeleton } from "@/components/ui/skeleton";

export default function OrderHistoryLoading() {
  return (
    <main className="relative min-h-screen bg-background pb-10">
      <div className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4 sm:px-6">
          <Skeleton className="h-5 w-36" />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 pt-2 pb-7 sm:px-6">
        <div className="mb-6 grid grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-white px-4 py-3.5 shadow-sm">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="mt-1 h-6 w-20" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
