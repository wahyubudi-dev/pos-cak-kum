import { CategoriesManager } from "@/components/admin/categories-manager";
import { requireAdmin } from "@/lib/auth/session";
import { getCategories } from "@/lib/menus/queries";

export const metadata = {
  title: "Kategori · Admin Cak Kum",
};

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-7 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Kategori
        </h1>
        <p className="text-sm text-muted-foreground">
          Atur nama dan urutan kategori menu.
        </p>
      </header>

      <CategoriesManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          sort_order: c.sortOrder,
        }))}
      />
    </div>
  );
}
