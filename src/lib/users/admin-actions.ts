"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { UserRole } from "@/lib/db/schema";

const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL;

export type UserActionState = {
  ok: boolean;
  message?: string;
};

const ROLE_ADMIN = "admin" as const;
const ROLE_CUSTOMER = "customer" as const;

const ROLE_LABELS: Record<UserRole, string> = {
  [ROLE_CUSTOMER]: "Pelanggan",
  [ROLE_ADMIN]: "Admin",
};

export async function updateUserRole(
  userId: string,
  nextRole: UserRole,
): Promise<UserActionState> {
  const currentAdmin = await requireAdmin();

  if (userId === currentAdmin.auth.id && nextRole !== ROLE_ADMIN) {
    return {
      ok: false,
      message: "Tidak bisa menurunkan role akunmu sendiri.",
    };
  }

  if (MASTER_ADMIN_EMAIL && nextRole !== ROLE_ADMIN) {
    const targetUser = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .then((rows) => rows[0]);

    if (targetUser && targetUser.email === MASTER_ADMIN_EMAIL) {
      return {
        ok: false,
        message: "Master admin tidak bisa diturunkan role-nya.",
      };
    }
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
