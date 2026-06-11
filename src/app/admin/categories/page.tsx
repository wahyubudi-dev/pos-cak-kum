import { CategoriesManager } from "@/components/admin/categories-manager";
import { getCategories } from "@/lib/menus/queries";

export const metadata = {
  title: "Kategori · Admin Cak Kum",
};

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Kategori
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelompokkan menu agar pelanggan mudah menemukannya. Urutan kecil
          tampil lebih dulu.
        </p>
      </header>
      <CategoriesManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          sort_order: c.sortOrder,
        }))}
      />
    </main>
  );
}
