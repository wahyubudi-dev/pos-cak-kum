"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(50),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type CategoryActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

const EMPTY_STATE: CategoryActionState = { ok: true };

function parseCategoryForm(formData: FormData):
  | { ok: true; value: z.infer<typeof categorySchema> }
  | { ok: false; state: CategoryActionState } {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    sort_order: formData.get("sort_order") ?? 0,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      state: { ok: false, message: "Form tidak valid", fieldErrors },
    };
  }

  return { ok: true, value: parsed.data };
}

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();
  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return parsed.state;

  try {
    await db.insert(categories).values({
      name: parsed.value.name,
      sortOrder: parsed.value.sort_order,
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal membuat kategori",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ...EMPTY_STATE, message: "Kategori berhasil dibuat" };
}

export async function updateCategory(
  id: string,
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();
  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return parsed.state;

  try {
    await db
      .update(categories)
      .set({
        name: parsed.value.name,
        sortOrder: parsed.value.sort_order,
      })
      .where(eq(categories.id, id));
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menyimpan",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ...EMPTY_STATE, message: "Kategori diperbarui" };
}

export async function deleteCategory(id: string): Promise<CategoryActionState> {
  await requireAdmin();

  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus";
    if (message.includes("23503") || message.includes("foreign key")) {
      return {
        ok: false,
        message:
          "Kategori masih dipakai oleh menu. Hapus atau pindahkan menu dulu.",
      };
    }
    return { ok: false, message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ...EMPTY_STATE, message: "Kategori dihapus" };
}
