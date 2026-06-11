"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tables } from "@/lib/db/schema";

export type TableActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

const EMPTY_STATE: TableActionState = { ok: true };

const tableSchema = z.object({
  label: z.string().trim().min(1, "Label meja wajib diisi").max(20),
  is_active: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === "on" || v === "true" || v === true),
});

function parseForm(formData: FormData):
  | { ok: true; value: z.infer<typeof tableSchema> }
  | { ok: false; state: TableActionState } {
  const parsed = tableSchema.safeParse({
    label: formData.get("label"),
    is_active: formData.get("is_active") ?? false,
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

export async function createTable(
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.ok) return parsed.state;

  try {
    await db.insert(tables).values({
      label: parsed.value.label,
      isActive: parsed.value.is_active,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("unique")
        ? `Label "${parsed.value.label}" sudah ada`
        : error instanceof Error
          ? error.message
          : "Gagal menyimpan";
    return { ok: false, message };
  }

  revalidatePath("/admin/tables");
  return { ...EMPTY_STATE, message: `Meja "${parsed.value.label}" berhasil ditambahkan` };
}

export async function updateTable(
  id: string,
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.ok) return parsed.state;

  try {
    await db
      .update(tables)
      .set({
        label: parsed.value.label,
        isActive: parsed.value.is_active,
        updatedAt: new Date(),
      })
      .where(eq(tables.id, id));
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("unique")
        ? `Label "${parsed.value.label}" sudah ada`
        : error instanceof Error
          ? error.message
          : "Gagal menyimpan";
    return { ok: false, message };
  }

  revalidatePath("/admin/tables");
  return { ...EMPTY_STATE, message: "Meja diperbarui" };
}

export async function deleteTable(id: string): Promise<TableActionState> {
  await requireAdmin();
  try {
    await db.delete(tables).where(eq(tables.id, id));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Gagal menghapus" };
  }
  revalidatePath("/admin/tables");
  return { ...EMPTY_STATE, message: "Meja dihapus" };
}

export async function toggleTableActive(
  id: string,
  nextValue: boolean,
): Promise<TableActionState> {
  await requireAdmin();
  try {
    await db
      .update(tables)
      .set({ isActive: nextValue, updatedAt: new Date() })
      .where(eq(tables.id, id));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Gagal mengubah status" };
  }
  revalidatePath("/admin/tables");
  return EMPTY_STATE;
}
