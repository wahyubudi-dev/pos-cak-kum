import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-background pb-36">
      <header className="border-b border-border bg-card py-5 sm:py-6">
        <div className="mx-auto flex max-w-lg flex-col gap-2 px-5 sm:px-6">
          <Skeleton className="h-3 w-20" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-5 text-center sm:p-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="mx-auto h-5 w-40" />
            <Skeleton className="mx-auto h-4 w-64" />
          </div>
          <Skeleton className="h-60 w-60 rounded-2xl" />
          <Skeleton className="mx-auto h-7 w-36" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="mx-auto h-4 w-40" />
        </div>
      </div>
    </main>
  );
}
