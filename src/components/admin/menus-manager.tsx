"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { MenuForm } from "@/components/admin/menu-form";
import { deleteMenu, toggleMenuActive } from "@/lib/menus/actions";
import { formatRupiah } from "@/lib/format";

type Category = {
  id: string;
  name: string;
};

type AdminMenu = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  category_id: string;
  category_name: string | null;
};

type MenusManagerProps = {
  menus: AdminMenu[];
  categories: Category[];
};

/**
 * Top-level admin menu UI: a "create" CTA, a count summary, and the list.
 * Each row is its own component with local mutation state so we don't
 * re-render the whole table on every toggle.
 */
export function MenusManager({ menus, categories }: MenusManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const hasNoCategories = categories.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Total {menus.length} menu
          {menus.length === 1 ? "" : "s"}.
        </p>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="cta"
              variant="primary"
              disabled={hasNoCategories}
            >
              Tambah menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-5 sm:p-7 gap-5 sm:gap-7">
            <DialogHeader className="pb-0 pr-0">
              <DialogTitle>Tambah menu baru</DialogTitle>
            </DialogHeader>
            <MenuForm
              categories={categories}
              onSaved={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {hasNoCategories ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-7 text-center text-sm text-muted-foreground">
          Buat kategori dulu di{" "}
          <Link
            href="/admin/categories"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            halaman Kategori
          </Link>{" "}
          sebelum menambahkan menu.
        </div>
      ) : null}

      {menus.length === 0 && !hasNoCategories ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-7 text-center text-sm text-muted-foreground">
          Belum ada menu. Klik &quot;Tambah menu&quot; untuk mulai.
        </div>
      ) : null}

      {menus.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {menus.map((menu) => (
            <li key={menu.id}>
              <MenuRow menu={menu} categories={categories} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MenuRow({
  menu,
  categories,
}: {
  menu: AdminMenu;
  categories: Category[];
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActive, setIsActive] = useState(menu.is_active);
  const [isToggling, startToggle] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleToggle(next: boolean) {
    setIsActive(next);
    startToggle(async () => {
      const result = await toggleMenuActive(menu.id, next);
      if (!result.ok) {
        setIsActive(!next);
        toast.error(result.message ?? "Gagal mengubah status");
      }
    });
  }

  function handleDelete() {
    return new Promise<void>((resolve) => {
      startDelete(async () => {
        const result = await deleteMenu(menu.id);
        if (result.ok) toast.success(result.message ?? "Menu dihapus");
        else toast.error(result.message ?? "Gagal menghapus");
        resolve();
      });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
      {/* Top row on mobile: image + info */}
      <div className="flex items-start gap-3 sm:flex-1 sm:items-center sm:gap-4">
        <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
          {menu.image_url ? (
            <Image
              src={menu.image_url}
              alt={menu.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wide text-muted-foreground">
              Tanpa
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <span className="font-medium text-teal text-xs sm:text-sm">{menu.name}</span>
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {menu.category_name ? (
              <Badge variant="outline" className="rounded-full text-[9px] sm:text-[11px]">
                {menu.category_name}
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground font-semibold sm:text-sm">{formatRupiah(menu.price)}</span>
          </div>
          {menu.description ? (
            <span className="line-clamp-1 text-[10px] text-muted-foreground">{menu.description}</span>
          ) : null}
        </div>
      </div>

      {/* Bottom row on mobile: controls */}
      <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3 sm:border-0 sm:pt-0 sm:gap-3">
        <div className="flex items-center gap-1.5">
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={isToggling}
            aria-label={isActive ? "Nonaktifkan menu" : "Aktifkan menu"}
          />
          <span className="text-xs text-muted-foreground">
            {isActive ? "Aktif" : "Off"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-lg text-xs px-2.5"
              >
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-5 sm:p-7">
              <DialogHeader>
                <DialogTitle>Edit menu</DialogTitle>
              </DialogHeader>
              <MenuForm
                categories={categories}
                defaults={{
                  id: menu.id,
                  name: menu.name,
                  description: menu.description,
                  price: menu.price,
                  image_url: menu.image_url,
                  category_id: menu.category_id,
                  is_active: menu.is_active,
                  is_featured: menu.is_featured,
                }}
                onSaved={() => setIsEditOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <ConfirmDialog
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-lg text-xs px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={isDeleting}
              >
                {isDeleting ? "..." : "Hapus"}
              </Button>
            }
            title={`Hapus menu "${menu.name}"?`}
            description="Menu yang dihapus akan hilang dari halaman pelanggan dan tidak bisa dikembalikan. Pertimbangkan untuk menonaktifkan saja jika menunya sedang habis."
            confirmLabel="Hapus menu"
            tone="destructive"
            onConfirm={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
