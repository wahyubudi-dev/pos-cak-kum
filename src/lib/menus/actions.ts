"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { menus, type MenuSize } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MENU_BUCKET = "menu-images";

const menuSchema = z.object({
  category_id: z.string().uuid("Pilih kategori"),
  name: z.string().trim().min(1, "Nama menu wajib diisi").max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  price: z.coerce.number().int().nonnegative("Harga harus 0 atau lebih"),
  is_active: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === "on" || value === "true" || value === true),
  is_featured: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === "on" || value === "true" || value === true),
  menu_sizes: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return [];
      try {
        return JSON.parse(value) as MenuSize[];
      } catch {
        return [];
      }
    }),
});

export type MenuActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

const EMPTY_STATE: MenuActionState = { ok: true };

function parseMenuForm(formData: FormData):
  | { ok: true; value: z.infer<typeof menuSchema> }
  | { ok: false; state: MenuActionState } {
  const parsed = menuSchema.safeParse({
    category_id: formData.get("category_id"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price") ?? 0,
    is_active: formData.get("is_active") ?? false,
    is_featured: formData.get("is_featured") ?? false,
    menu_sizes: formData.get("menu_sizes") ?? "[]",
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

/**
 * Storage operations stay on supabase-js because Drizzle has no equivalent.
 * Schema mutations go through Drizzle; image bytes go through Supabase.
 */
async function uploadMenuImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Gambar maksimal 2 MB.");
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    throw new Error("Format gambar harus JPG, PNG, atau WebP.");
  }

  const supabase = await createClient();
  const extension = file.name.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(MENU_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    throw new Error(`Gagal upload gambar: ${error.message}`);
  }

  const { data } = supabase.storage.from(MENU_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/${MENU_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return publicUrl.slice(index + marker.length);
}

async function deleteStoredImage(publicUrl: string | null): Promise<void> {
  if (!publicUrl) return;
  const path = extractStoragePath(publicUrl);
  if (!path) return;

  const supabase = await createClient();
  await supabase.storage.from(MENU_BUCKET).remove([path]);
}

export async function createMenu(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  await requireAdmin();
  const parsed = parseMenuForm(formData);
  if (!parsed.ok) return parsed.state;

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadMenuImage(formData.get("image") as File | null);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Upload gagal",
    };
  }

  try {
    await db.insert(menus).values({
      categoryId: parsed.value.category_id,
      name: parsed.value.name,
      description: parsed.value.description,
      price: parsed.value.price.toString(),
      imageUrl,
      isActive: parsed.value.is_active,
      isFeatured: parsed.value.is_featured,
      menuSizes: parsed.value.menu_sizes,
    });
  } catch (error) {
    if (imageUrl) await deleteStoredImage(imageUrl);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menyimpan menu",
    };
  }

  revalidatePath("/admin/menus");
  revalidatePath("/menu");
  return { ...EMPTY_STATE, message: "Menu berhasil dibuat" };
}

export async function updateMenu(
  id: string,
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  await requireAdmin();
  const parsed = parseMenuForm(formData);
  if (!parsed.ok) return parsed.state;

  let imageUrl: string | undefined;
  let oldImageUrl: string | null = null;

  const fileField = formData.get("image") as File | null;
  if (fileField && fileField.size > 0) {
    const existing = await db.query.menus.findFirst({
      columns: { imageUrl: true },
      where: eq(menus.id, id),
    });
    oldImageUrl = existing?.imageUrl ?? null;

    try {
      imageUrl = (await uploadMenuImage(fileField)) ?? undefined;
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Upload gagal",
      };
    }
  }

  try {
    await db
      .update(menus)
      .set({
        categoryId: parsed.value.category_id,
        name: parsed.value.name,
        description: parsed.value.description,
        price: parsed.value.price.toString(),
        isActive: parsed.value.is_active,
        isFeatured: parsed.value.is_featured,
        menuSizes: parsed.value.menu_sizes,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(menus.id, id));
  } catch (error) {
    if (imageUrl) await deleteStoredImage(imageUrl);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menyimpan menu",
    };
  }

  if (oldImageUrl) await deleteStoredImage(oldImageUrl);

  revalidatePath("/admin/menus");
  revalidatePath("/menu");
  return { ...EMPTY_STATE, message: "Menu diperbarui" };
}

export async function deleteMenu(id: string): Promise<MenuActionState> {
  await requireAdmin();

  const existing = await db.query.menus.findFirst({
    columns: { imageUrl: true },
    where: eq(menus.id, id),
  });

  try {
    await db.delete(menus).where(eq(menus.id, id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus";
    // Postgres FK violation code is 23503; surface a friendlier hint.
    if (message.includes("23503") || message.includes("foreign key")) {
      return {
        ok: false,
        message:
          "Menu masih dipakai di pesanan. Nonaktifkan saja agar tetap muncul di histori.",
      };
    }
    return { ok: false, message };
  }

  if (existing?.imageUrl) await deleteStoredImage(existing.imageUrl);

  revalidatePath("/admin/menus");
  revalidatePath("/menu");
  return { ...EMPTY_STATE, message: "Menu dihapus" };
}

export async function toggleMenuActive(
  id: string,
  nextValue: boolean,
): Promise<MenuActionState> {
  await requireAdmin();

  try {
    await db
      .update(menus)
      .set({ isActive: nextValue, updatedAt: new Date() })
      .where(eq(menus.id, id));
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal mengubah status",
    };
  }

  revalidatePath("/admin/menus");
  revalidatePath("/menu");
  return EMPTY_STATE;
}
