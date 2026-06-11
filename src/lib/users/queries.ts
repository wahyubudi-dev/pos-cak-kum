import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { User, UserRole } from "@/lib/db/schema";

export type AdminUser = User;

export async function getAllUsers(options?: {
  role?: UserRole | "all";
}): Promise<AdminUser[]> {
  const role = options?.role;

  return db
    .select()
    .from(users)
    .where(role && role !== "all" ? eq(users.role, role) : undefined)
    .orderBy(desc(users.createdAt));
}
