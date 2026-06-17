import { Skeleton } from "@/components/ui/skeleton";

export default function OrderCancelLoading() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-5 py-14 sm:px-6">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-border bg-card px-6 py-10 text-center sm:px-7 sm:py-12">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="mx-auto h-7 w-48" />
          <Skeleton className="mx-auto h-4 w-56" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </main>
  );
}
