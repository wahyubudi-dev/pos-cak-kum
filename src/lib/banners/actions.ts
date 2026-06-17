"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const BANNER_BUCKET = "menu-images";

export type BannerActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

const EMPTY_STATE: BannerActionState = { ok: true };

const bannerSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(120),
  description: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  bg_color: z.string().trim().default("#fff8e5"),
  display_mode: z.enum(["content", "image"]).default("content"),
  cta_text: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  cta_href: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  is_highlighted: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === "on" || v === "true" || v === true),
  is_active: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === "on" || v === "true" || v === true),
  sort_order: z.coerce.number().int().default(0),
});

function parseBannerForm(formData: FormData):
  | { ok: true; value: z.infer<typeof bannerSchema> }
  | { ok: false; state: BannerActionState } {
  const parsed = bannerSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    bg_color: formData.get("bg_color") ?? "#fff8e5",
    display_mode: formData.get("display_mode") ?? "content",
    cta_text: formData.get("cta_text") ?? "",
    cta_href: formData.get("cta_href") ?? "",
    is_highlighted: formData.get("is_highlighted") ?? false,
    is_active: formData.get("is_active") ?? false,
    sort_order: formData.get("sort_order") ?? 0,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, state: { ok: false, message: "Form tidak valid", fieldErrors } };
  }
  return { ok: true, value: parsed.data };
}

async function uploadBannerImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Gambar maksimal 2 MB.");
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    throw new Error("Format gambar harus JPG, PNG, atau WebP.");
  }

  const supabase = await createClient();
  const extension = file.name.split(".").pop() ?? "bin";
  const path = `banners/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BANNER_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error("Gagal upload gambar");

  const { data } = supabase.storage.from(BANNER_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function deleteStoredImage(publicUrl: string | null): Promise<void> {
  if (!publicUrl) return;
  const marker = `/${BANNER_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = publicUrl.slice(index + marker.length);
  const supabase = await createClient();
  await supabase.storage.from(BANNER_BUCKET).remove([path]);
}

export async function createBanner(
  _prev: BannerActionState,
  formData: FormData,
): Promise<BannerActionState> {
  await requireAdmin();
  const parsed = parseBannerForm(formData);
  if (!parsed.ok) return parsed.state;

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadBannerImage(formData.get("image") as File | null);
  } catch (error) {
    console.error("[createBanner] upload", error);
    return { ok: false, message: "Upload gagal" };
  }

  try {
    await db.insert(banners).values({
      title: parsed.value.title,
      description: parsed.value.description,
      bgColor: parsed.value.bg_color,
      imageUrl,
      displayMode: parsed.value.display_mode,
      ctaText: parsed.value.cta_text,
      ctaHref: parsed.value.cta_href,
      isHighlighted: parsed.value.is_highlighted,
      isActive: parsed.value.is_active,
      sortOrder: parsed.value.sort_order,
    });
  } catch (error) {
    if (imageUrl) await deleteStoredImage(imageUrl);
    console.error("[createBanner] db", error);
    return { ok: false, message: "Gagal menyimpan" };
  }

  revalidatePath("/admin/banners");
  revalidatePath("/menu");
  return { ...EMPTY_STATE, message: "Banner berhasil dibuat" };
}

export async function updateBanner(
  id: string,
  _prev: BannerActionState,
  formData: FormData,
): Promise<BannerActionState> {
  await requireAdmin();
  const parsed = parseBannerForm(formData);
  if (!parsed.ok) return parsed.state;

  let imageUrl: string | undefined;
  let oldImageUrl: string | null = null;

  const fileField = formData.get("image") as File | null;
  if (fileField && fileField.size > 0) {
    const existing = await db.query.banners.findFirst({
      columns: { imageUrl: true },
      where: eq(banners.id, id),
    });
    oldImageUrl = existing?.imageUrl ?? null;
    try {
      imageUrl = (await uploadBannerImage(fileField)) ?? undefined;
    } catch (error) {
      console.error("[updateBanner] upload", error);
      return { ok: false, message: "Upload gagal" };
    }
  }

  try {
    await db
      .update(banners)
      .set({
        title: parsed.value.title,
        description: parsed.value.description,
        bgColor: parsed.value.bg_color,
        displayMode: parsed.value.display_mode,
        ctaText: parsed.value.cta_text,
        ctaHref: parsed.value.cta_href,
        isHighlighted: parsed.value.is_highlighted,
        isActive: parsed.value.is_active,
        sortOrder: parsed.value.sort_order,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(banners.id, id));
  } catch (error) {
    if (imageUrl) await deleteStoredImage(imageUrl);
    console.error("[updateBanner] db", error);
    return { ok: false, message: "Gagal menyimpan" };
  }

  if (oldImageUrl) await deleteStoredImage(oldImageUrl);

  revalidatePath("/admin/banners");
  revalidatePath("/menu");
  return { ...EMPTY_STATE, message: "Banner diperbarui" };
}

export async function deleteBanner(id: string): Promise<BannerActionState> {
  await requireAdmin();
  const existing = await db.query.banners.findFirst({
    columns: { imageUrl: true },
    where: eq(banners.id, id),
  });

  try {
    await db.delete(banners).where(eq(banners.id, id));
  } catch (error) {
    console.error("[deleteBanner]", error);
    return { ok: false, message: "Gagal menghapus" };
  }

  if (existing?.imageUrl) await deleteStoredImage(existing.imageUrl);

  revalidatePath("/admin/banners");
  revalidatePath("/menu");
  return { ...EMPTY_STATE, message: "Banner dihapus" };
}

export async function toggleBannerActive(
  id: string,
  nextValue: boolean,
): Promise<BannerActionState> {
  await requireAdmin();
  try {
    await db
      .update(banners)
      .set({ isActive: nextValue, updatedAt: new Date() })
      .where(eq(banners.id, id));
  } catch (error) {
    console.error("[toggleBannerActive]", error);
    return { ok: false, message: "Gagal mengubah status" };
  }
  revalidatePath("/admin/banners");
  revalidatePath("/menu");
  return EMPTY_STATE;
}
