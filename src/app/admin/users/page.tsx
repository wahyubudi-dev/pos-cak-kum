import { UsersManager } from "@/components/admin/users-manager";
import { requireAdmin } from "@/lib/auth/session";
import { getAllUsers } from "@/lib/users/queries";

export const metadata = {
  title: "Pengguna · Admin Cak Kum",
};

export default async function AdminUsersPage() {
  const [admin, users] = await Promise.all([requireAdmin(), getAllUsers()]);

  const userViews = users.map((user) => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-7 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Pengguna
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola pelanggan dan admin. Toggle role untuk memberi atau mencabut
          akses admin.
        </p>
      </header>

      <UsersManager
        users={userViews}
        currentUserId={admin.auth.id}
        masterAdminEmail={process.env.MASTER_ADMIN_EMAIL}
      />
    </div>
  );
}
