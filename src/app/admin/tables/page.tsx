import { TablesManager } from "@/components/admin/tables-manager";
import { getAllTables } from "@/lib/tables/queries";

export const metadata = { title: "Meja · Admin Kedai Cak Kum" };

export default async function AdminTablesPage() {
  const allTables = await getAllTables();

  const mapped = allTables.map((t) => ({
    id: t.id,
    label: t.label,
    is_active: t.isActive,
  }));

  return (
    <div className="py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Meja
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Kelola daftar nomor meja yang bisa dipilih pelanggan.
      </p>

      <div className="mt-7">
        <TablesManager tables={mapped} />
      </div>
    </div>
  );
}
