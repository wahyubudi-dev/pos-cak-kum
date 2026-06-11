"use client";

import Image from "next/image";
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
import { BannerForm } from "@/components/admin/banner-form";
import { deleteBanner, toggleBannerActive } from "@/lib/banners/actions";

type AdminBanner = {
  id: string;
  title: string;
  description: string | null;
  bg_color: string;
  image_url: string | null;
  display_mode: "content" | "image";
  cta_text: string | null;
  cta_href: string | null;
  is_highlighted: boolean;
  is_active: boolean;
  sort_order: number;
};

type BannersManagerProps = {
  banners: AdminBanner[];
};

export function BannersManager({ banners }: BannersManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Total {banners.length} banner.
        </p>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="cta" variant="primary">
              Tambah banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto sm:max-h-[90vh] p-5 sm:p-7 gap-5 sm:gap-7 top-[50%] sm:top-[50%]">
            <DialogHeader className="pb-0 pr-0">
              <DialogTitle>Tambah banner baru</DialogTitle>
            </DialogHeader>
            <BannerForm onSaved={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {banners.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-7 text-center text-sm text-muted-foreground">
          Belum ada banner. Klik &quot;Tambah banner&quot; untuk mulai.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {banners.map((banner) => (
            <li key={banner.id}>
              <BannerRow banner={banner} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BannerRow({ banner }: { banner: AdminBanner }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActive, setIsActive] = useState(banner.is_active);
  const [isToggling, startToggle] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleToggle(next: boolean) {
    setIsActive(next);
    startToggle(async () => {
      const result = await toggleBannerActive(banner.id, next);
      if (!result.ok) {
        setIsActive(!next);
        toast.error(result.message ?? "Gagal mengubah status");
      }
    });
  }

  function handleDelete() {
    return new Promise<void>((resolve) => {
      startDelete(async () => {
        const result = await deleteBanner(banner.id);
        if (result.ok) toast.success(result.message ?? "Banner dihapus");
        else toast.error(result.message ?? "Gagal menghapus");
        resolve();
      });
    });
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
      {/* Preview */}
      <div
        className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl"
        style={{ background: banner.bg_color }}
      >
        {banner.image_url ? (
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2">
            <span className="text-[10px] font-medium leading-tight text-foreground/70 text-center line-clamp-2">
              {banner.title}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground truncate">
            {banner.title}
          </span>
          <Badge variant="secondary" className="rounded-full capitalize">
            {banner.display_mode}
          </Badge>
          {banner.is_highlighted ? (
            <Badge className="rounded-full bg-amber-100 text-amber-800">
              Highlight
            </Badge>
          ) : null}
          {banner.cta_text ? (
            <Badge variant="outline" className="rounded-full">
              CTA: {banner.cta_text}
            </Badge>
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground">
          Urutan: {banner.sort_order}
          {banner.description ? ` · ${banner.description.slice(0, 50)}...` : ""}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={isToggling}
            aria-label={isActive ? "Nonaktifkan banner" : "Aktifkan banner"}
          />
          <span className="text-xs text-muted-foreground">
            {isActive ? "Aktif" : "Non-aktif"}
          </span>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="rounded-lg">
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-5 sm:p-7 gap-5 sm:gap-7">
            <DialogHeader>
              <DialogTitle>Edit banner</DialogTitle>
            </DialogHeader>
            <BannerForm
              defaults={{
                id: banner.id,
                title: banner.title,
                description: banner.description,
                bg_color: banner.bg_color,
                image_url: banner.image_url,
                display_mode: banner.display_mode,
                cta_text: banner.cta_text,
                cta_href: banner.cta_href,
                is_highlighted: banner.is_highlighted,
                is_active: banner.is_active,
                sort_order: banner.sort_order,
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
              className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isDeleting}
            >
              {isDeleting ? "..." : "Hapus"}
            </Button>
          }
          title={`Hapus banner "${banner.title}"?`}
          description="Banner yang dihapus tidak bisa dikembalikan."
          confirmLabel="Hapus banner"
          tone="destructive"
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}
