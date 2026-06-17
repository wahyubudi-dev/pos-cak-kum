import { Skeleton, CategoryTabSkeleton, MenuSectionSkeleton } from "@/components/ui/skeleton";

export default function MenuLoading() {
  return (
    <main className="min-h-screen bg-background pb-36">
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 py-4 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7h-7 rounded-full" />
              <Skeleton className="h-7 w-7h-7 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <div className="py-3.5">
        <div className="mx-auto max-w-lg px-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4">
        <CategoryTabSkeleton />

        <div className="mt-6 flex flex-col gap-7">
          <MenuSectionSkeleton rows={4} />
          <MenuSectionSkeleton rows={3} />
          <MenuSectionSkeleton rows={5} />
        </div>
      </div>
    </main>
  );
}
