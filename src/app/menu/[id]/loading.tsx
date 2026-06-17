import { Skeleton } from "@/components/ui/skeleton";

export default function MenuDetailLoading() {
  return (
    <main className="min-h-screen bg-background pb-44">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-5 sm:px-6">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-5 w-28" />
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 pt-5 sm:px-6">
        <Skeleton className="aspect-[1/1] w-full rounded-[28px] border border-border/60" />

        <div className="flex flex-col gap-5 pt-5 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full max-w-[34ch]" />
            <Skeleton className="h-4 w-2/3 max-w-[34ch]" />
          </div>

          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
