function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-muted ${className}`}
      style={style}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 rounded-3xl border border-border bg-card p-6">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-1 h-7 w-14" />
      <Skeleton className="mt-1 h-3 w-28" />
    </div>
  );
}

export function MenuRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/3">
      <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}

export function MenuSectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-28" />
      {Array.from({ length: rows }).map((_, i) => (
        <MenuRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryTabSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden py-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-20 shrink-0 rounded-full" />
      ))}
    </div>
  );
}

export function CartItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
      <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4">
        <Skeleton className="h-10 w-1 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
  );
}

export function DashboardChartSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-20" />
      </div>
      <Skeleton className="h-52 w-full rounded-2xl" />
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-14 rounded-lg" />
            <Skeleton className="h-7 w-14 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { Skeleton };
