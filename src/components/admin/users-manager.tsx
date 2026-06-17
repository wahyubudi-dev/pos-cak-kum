"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { updateUserRole } from "@/lib/users/admin-actions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/db/schema";

type UserView = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
};

type UsersManagerProps = {
  users: UserView[];
  currentUserId: string;
  masterAdminEmail?: string;
};

type RoleFilter = UserRole | "all";

const FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "customer", label: "Pelanggan" },
  { value: "admin", label: "Admin" },
];

const DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function UsersManager({
  users,
  currentUserId,
  masterAdminEmail,
}: UsersManagerProps) {
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return users.filter((user) => {
      if (filter !== "all" && user.role !== filter) return false;
      if (!normalizedSearch) return true;
      const haystack = `${user.email} ${user.fullName ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [users, filter, search]);

  const counts = useMemo(() => {
    let admin = 0;
    let customer = 0;
    for (const user of users) {
      if (user.role === "admin") admin += 1;
      else customer += 1;
    }
    return { admin, customer, total: users.length };
  }, [users]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryStat label="Total pengguna" value={counts.total} />
        <SummaryStat label="Pelanggan" value={counts.customer} />
        <SummaryStat label="Admin" value={counts.admin} accent="bg-cream-paper" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:max-w-sm"
        />
        <div className="flex gap-2">
          {FILTER_OPTIONS.map((option) => {
            const isActive = option.value === filter;
            return (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={isActive ? "default" : "ghost"}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "rounded-full",
                  isActive
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "",
                )}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState search={search} filter={filter} />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((user) => (
            <li key={user.id}>
              <UserRow
                user={user}
                isSelf={user.id === currentUserId}
                masterAdminEmail={masterAdminEmail}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-3xl border border-border bg-card p-5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={
          accent
            ? `inline-flex w-fit rounded-2xl px-3 py-1 font-display text-2xl font-semibold tabular-nums ${accent}`
            : "font-display text-2xl font-semibold tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  masterAdminEmail,
}: {
  user: UserView;
  isSelf: boolean;
  masterAdminEmail?: string;
}) {
  const [role, setRole] = useState(user.role);
  const [isPending, startTransition] = useTransition();

  const isAdmin = role === "admin";

  const isMasterAdmin =
    user.email === masterAdminEmail;

  function handleToggleRole() {
    if (isSelf) {
      toast.error("Tidak bisa mengubah role akunmu sendiri");
      return;
    }

    if (isMasterAdmin) {
      toast.error("Master admin tidak bisa diturunkan role-nya");
      return;
    }

    const nextRole: UserRole = isAdmin ? "customer" : "admin";
    setRole(nextRole);

    startTransition(async () => {
      const result = await updateUserRole(user.id, nextRole);
      if (result.ok) {
        toast.success(result.message ?? "Role diperbarui");
      } else {
        setRole(role);
        toast.error(result.message ?? "Gagal mengubah role");
      }
    });
  }

  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.fullName ?? user.email}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {(user.fullName ?? user.email).charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">
              {user.fullName ?? user.email}
            </span>
            {isSelf ? (
              <Badge variant="outline" className="rounded-full text-xs">
                Kamu
              </Badge>
            ) : null}
            {isAdmin ? (
              <Badge className="rounded-full bg-brand-teal text-white hover:bg-brand-teal">
                Admin
              </Badge>
            ) : (
              <Badge variant="secondary" className="rounded-full">
                Pelanggan
              </Badge>
            )}
            {isMasterAdmin ? (
              <Badge className="rounded-full bg-amber-500 text-white hover:bg-amber-500">
                Master
              </Badge>
            ) : null}
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {user.email} · Bergabung {DATE_FORMAT.format(new Date(user.createdAt))}
          </span>
        </div>
      </div>

      {isMasterAdmin ? null : (
        <ConfirmDialog
          trigger={
            <Button
              type="button"
              size="sm"
              variant={isAdmin ? "ghost" : "default"}
              disabled={isPending || isSelf}
              className={cn(
                "rounded-lg whitespace-nowrap",
                isAdmin
                  ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                  : "bg-brand-teal text-white hover:bg-brand-teal/90",
              )}
              title={
                isSelf
                  ? "Tidak bisa mengubah role akun sendiri"
                  : undefined
              }
            >
              {isPending
                ? "..."
                : isAdmin
                  ? "Turunkan ke Pelanggan"
                  : "Jadikan Admin"}
            </Button>
          }
          title={isAdmin ? "Turunkan pengguna?" : "Jadikan admin?"}
          description={
            isAdmin
              ? `${user.fullName ?? user.email} akan kehilangan akses admin dan menjadi pelanggan biasa.`
              : `${user.fullName ?? user.email} akan mendapatkan akses penuh ke panel admin.`
          }
          confirmLabel={isAdmin ? "Turunkan" : "Jadikan Admin"}
          tone={isAdmin ? "destructive" : "default"}
          onConfirm={handleToggleRole}
        />
      )}
    </article>
  );
}

function EmptyState({
  search,
  filter,
}: {
  search: string;
  filter: RoleFilter;
}) {
  const message = search
    ? `Tidak ada pengguna yang cocok dengan "${search}".`
    : filter !== "all"
      ? "Belum ada pengguna pada kategori ini."
      : "Belum ada pengguna terdaftar.";

  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold">Tidak ada pengguna</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
