import { MenusManager } from "@/components/admin/menus-manager";
import { getAllMenusForAdmin } from "@/lib/menus/queries";
import { getCategories } from "@/lib/menus/queries";

export const metadata = {
  title: "Menu · Admin Cak Kum",
};

export default async function AdminMenusPage() {
  const [menus, categories] = await Promise.all([
    getAllMenusForAdmin(),
    getCategories(),
  ]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-7 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Menu
        </h1>
        <p className="text-sm text-muted-foreground">
          Tambah, ubah, atau nonaktifkan menu yang muncul di halaman pelanggan.
        </p>
      </header>

      <MenusManager
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        menus={menus.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          price: Number(m.price),
          image_url: m.imageUrl,
          is_active: m.isActive,
          is_featured: m.isFeatured,
          category_id: m.categoryId,
          category_name: m.category?.name ?? null,
        }))}
      />
    </main>
  );
}
