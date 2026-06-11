"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  type BannerActionState,
  createBanner,
  updateBanner,
} from "@/lib/banners/actions";

const INITIAL_STATE: BannerActionState = { ok: true };

type BannerDefaults = {
  id?: string;
  title?: string;
  description?: string | null;
  bg_color?: string;
  image_url?: string | null;
  display_mode?: "content" | "image";
  cta_text?: string | null;
  cta_href?: string | null;
  is_highlighted?: boolean;
  is_active?: boolean;
  sort_order?: number;
};

type BannerFormProps = {
  defaults?: BannerDefaults;
  onSaved?: () => void;
};

const BG_PRESETS = [
  { label: "Cream", value: "#fff8e5" },
  { label: "Mint", value: "#b7ffe7" },
  { label: "Teal Glow", value: "#61f7cf" },
  { label: "Lavender", value: "#ede9fe" },
  { label: "Peach", value: "#fed7aa" },
  { label: "White", value: "#ffffff" },
];

export function BannerForm({ defaults, onSaved }: BannerFormProps) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit ? updateBanner.bind(null, defaults!.id!) : createBanner;

  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const [displayMode, setDisplayMode] = useState<"content" | "image">(
    defaults?.display_mode ?? "content",
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaults?.image_url ?? null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.ok) {
        toast.success(state.message);
        onSaved?.();
      } else {
        toast.error(state.message);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:gap-5">
      {/* Display mode */}
      <FormField label="Tipe tampilan" htmlFor="display_mode">
        <Select
          name="display_mode"
          defaultValue={displayMode}
          onValueChange={(v) => setDisplayMode(v as "content" | "image")}
        >
          <SelectTrigger id="display_mode" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="content">Konten (teks + warna latar)</SelectItem>
            <SelectItem value="image">Gambar penuh (full image)</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {/* Title */}
      <FormField label="Judul" htmlFor="title" error={state.fieldErrors?.title}>
        <Input
          id="title"
          name="title"
          defaultValue={defaults?.title ?? ""}
          placeholder="Contoh: Diskon Mie Ayam 20%"
          required
        />
      </FormField>

      {/* Description — only for content mode */}
      {displayMode === "content" ? (
        <FormField label="Deskripsi" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={defaults?.description ?? ""}
            placeholder="Keterangan singkat promo (opsional)"
          />
        </FormField>
      ) : null}

      {/* Background color — only for content mode */}
      {displayMode === "content" ? (
        <FormField label="Warna latar" htmlFor="bg_color">
          <div className="flex flex-wrap gap-2">
            {BG_PRESETS.map((preset) => (
              <label
                key={preset.value}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs has-checked:ring-2 has-checked:ring-brand-teal"
              >
                <input
                  type="radio"
                  name="bg_color"
                  value={preset.value}
                  defaultChecked={
                    (defaults?.bg_color ?? "#fff8e5") === preset.value
                  }
                  className="sr-only"
                />
                <span
                  className="h-4 w-4 rounded-full border"
                  style={{ background: preset.value }}
                />
                {preset.label}
              </label>
            ))}
          </div>
        </FormField>
      ) : (
        <input type="hidden" name="bg_color" value="#ffffff" />
      )}

      {/* Image upload */}
      <div className="flex flex-col gap-3">
        <Label>
          {displayMode === "image" ? "Gambar banner (wajib)" : "Gambar (opsional)"}
        </Label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {previewUrl ? (
            <div className="relative shrink-0 overflow-hidden rounded-xl border border-border" style={{ width: "200px", height: "100px" }}>
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
                sizes="200px"
                unoptimized={previewUrl.startsWith("blob:")}
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? "Ganti gambar" : "Pilih gambar"}
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, atau WebP. Maks 2 MB. Rasio 16:9 direkomendasikan.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Teks CTA (opsional)" htmlFor="cta_text">
          <Input
            id="cta_text"
            name="cta_text"
            defaultValue={defaults?.cta_text ?? ""}
            placeholder="Contoh: Pesan Sekarang"
          />
        </FormField>
        <FormField label="Link CTA (opsional)" htmlFor="cta_href">
          <Input
            id="cta_href"
            name="cta_href"
            defaultValue={defaults?.cta_href ?? ""}
            placeholder="Contoh: /menu?table=1"
          />
        </FormField>
      </div>

      {/* Toggles + Sort order */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-pearl px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="is_active" className="cursor-pointer">Aktif</Label>
            <span className="text-xs text-muted-foreground">
              Tampil di pelanggan.
            </span>
          </div>
          <Switch
            id="is_active"
            name="is_active"
            defaultChecked={defaults?.is_active ?? true}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-cream-paper px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="is_highlighted" className="cursor-pointer">Highlight</Label>
            <span className="text-xs text-muted-foreground">
              Border glow effect.
            </span>
          </div>
          <Switch
            id="is_highlighted"
            name="is_highlighted"
            defaultChecked={defaults?.is_highlighted ?? false}
          />
        </div>

        <div className="flex flex-col gap-1.5 rounded-2xl border border-border px-4 py-3">
          <Label htmlFor="sort_order">Urutan</Label>
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            min={0}
            defaultValue={defaults?.sort_order ?? 0}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="cta" variant="primary" disabled={isPending}>
          {isPending ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Buat banner"}
        </Button>
      </div>
    </form>
  );
}

function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
