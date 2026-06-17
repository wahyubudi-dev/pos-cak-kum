import { Skeleton, CartItemSkeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <main className="min-h-screen bg-background pb-36">
      <header className="border-b border-border bg-card py-5 sm:py-6">
        <div className="mx-auto flex max-w-lg flex-col gap-2 px-5 sm:px-6">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </header>

      <div className="mx-auto flex max-w-lg flex-col gap-5 px-5 py-6 sm:gap-6 sm:px-6">
        <div className="flex flex-col gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <CartItemSkeleton key={i} />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="mt-4 h-12 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
