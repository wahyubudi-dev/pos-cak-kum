"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { UserRole } from "@/lib/db/schema";

export type UserActionState = {
  ok: boolean;
  message?: string;
};

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Pelanggan",
  admin: "Admin",
};

export async function updateUserRole(
  userId: string,
  nextRole: UserRole,
): Promise<UserActionState> {
  const currentAdmin = await requireAdmin();

  if (userId === currentAdmin.auth.id && nextRole !== "admin") {
    return {
      ok: false,
      message: "Tidak bisa menurunkan role akunmu sendiri.",
    };
  }

  try {
    await db
      .update(users)
      .set({ role: nextRole, updatedAt: new Date() })
      .where(eq(users.id, userId));
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menyimpan",
    };
  }

  revalidatePath("/admin/users");
  return {
    ok: true,
    message: `Role diubah ke ${ROLE_LABELS[nextRole]}`,
  };
}
