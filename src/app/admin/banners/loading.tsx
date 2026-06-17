import { Skeleton, AdminTableSkeleton } from "@/components/ui/skeleton";

export default function AdminBannersLoading() {
  return (
    <div className="flex flex-col gap-7 py-12">
      <header className="flex flex-col gap-1">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-64" />
      </header>
      <AdminTableSkeleton rows={2} />
    </div>
  );
}
