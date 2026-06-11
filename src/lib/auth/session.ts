import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/db/schema";

export type AppUser = {
  auth: User;
  role: UserRole;
  fullName: string | null;
  avatarUrl: string | null;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return null;
  }

  const profile = await db.query.users.findFirst({
    columns: {
      role: true,
      fullName: true,
      avatarUrl: true,
    },
    where: eq(users.id, userData.user.id),
  });

  if (!profile) {
    // Auth session exists but the public.users row hasn't been mirrored
    // by the trigger yet. Treat as anonymous rather than crashing.
    return null;
  }

  return {
    auth: userData.user,
    role: profile.role,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
  };
}

export async function getCurrentRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

export async function requireAuth(redirectTo?: string): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = redirectTo
      ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
      : "/login";
    redirect(target);
  }
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/admin");
  }
  if (user.role !== "admin") {
    redirect("/menu");
  }
  return user;
}
