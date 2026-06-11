"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

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
import {
  type MenuActionState,
  createMenu,
  updateMenu,
} from "@/lib/menus/actions";

const INITIAL_STATE: MenuActionState = { ok: true };

type Category = {
  id: string;
  name: string;
};

type MenuSize = { label: string; price: number };

type MenuDefaults = {
  id?: string;
  category_id?: string;
  name?: string;
  description?: string | null;
  price?: number;
  image_url?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  menu_sizes?: MenuSize[];
};

type MenuFormProps = {
  categories: Category[];
  defaults?: MenuDefaults;
  onSaved?: () => void;
};

export function MenuForm({ categories, defaults, onSaved }: MenuFormProps) {
  const isEdit = Boolean(defaults?.id);
  const action = isEdit ? updateMenu.bind(null, defaults!.id!) : createMenu;

  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    defaults?.image_url ?? null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sizes, setSizes] = useState<MenuSize[]>(defaults?.menu_sizes ?? []);

  function addSize() {
    setSizes((prev) => [...prev, { label: "", price: 0 }]);
  }

  function updateSize(index: number, field: keyof MenuSize, value: string | number) {
    setSizes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeSize(index: number) {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  }

  // Handle action result in useEffect to avoid setState-during-render
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
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  function handleResetImage() {
    setPreviewUrl(defaults?.image_url ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  const hasImageChanged = previewUrl !== (defaults?.image_url ?? null);

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:gap-5">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <FormField
          label="Nama menu"
          htmlFor="name"
          error={state.fieldErrors?.name}
        >
          <Input
            id="name"
            name="name"
            defaultValue={defaults?.name ?? ""}
            placeholder="Misal: Mie Ayam Spesial"
            required
          />
        </FormField>

        <FormField
          label="Kategori"
          htmlFor="category_id"
          error={state.fieldErrors?.category_id}
        >
          <Select
            name="category_id"
            defaultValue={defaults?.category_id}
            required
          >
            <SelectTrigger id="category_id" className="w-full">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label="Harga (Rp)"
          htmlFor="price"
          error={state.fieldErrors?.price}
        >
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step={500}
            defaultValue={defaults?.price ?? 0}
            required
          />
        </FormField>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-pearl px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="is_active" className="cursor-pointer text-sm">
              Aktif
            </Label>
            <span className="text-[11px] text-muted-foreground sm:text-xs">
              Menu non-aktif tidak tampil di pelanggan.
            </span>
          </div>
          <Switch
            id="is_active"
            name="is_active"
            defaultChecked={defaults?.is_active ?? true}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-cream-paper px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="is_featured" className="cursor-pointer text-sm">
            Tampilkan di Rekomendasi
          </Label>
          <span className="text-[11px] text-muted-foreground sm:text-xs">
            Menu yang ditandai akan muncul di section Rekomendasi pelanggan.
          </span>
        </div>
        <Switch
          id="is_featured"
          name="is_featured"
          defaultChecked={defaults?.is_featured ?? false}
        />
      </div>

      <FormField label="Deskripsi" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaults?.description ?? ""}
          placeholder="Ceritakan singkat porsi atau bahan utama (opsional)"
        />
      </FormField>

      {/* Ukuran */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-pearl/50 px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Ukuran</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addSize}
            className="rounded-xl text-xs gap-1"
          >
            <Plus className="h-3 w-3" />
            Tambah ukuran
          </Button>
        </div>
        {sizes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Menu ini tidak punya variasi ukuran. Pelanggan akan melihat harga
            tunggal.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sizes.map((size, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2"
              >
                <Input
                  type="text"
                  value={size.label}
                  onChange={(e) => updateSize(index, "label", e.target.value)}
                  placeholder="Misal: Reguler"
                  className="h-7 min-w-0 flex-1 rounded-lg border-border text-xs px-2.5"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-muted-foreground">Rp</span>
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    value={size.price}
                    onChange={(e) => updateSize(index, "price", Number(e.target.value))}
                    className="h-7 w-20 rounded-lg border-border text-xs px-2"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSize(index)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Hapus ukuran"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input type="hidden" name="menu_sizes" value={JSON.stringify(sizes)} />
      </div>

      <div className="flex flex-col gap-3">
        <Label>Gambar menu</Label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {previewUrl ? (
            <div
              className="relative shrink-0 overflow-hidden border border-border bg-pearl"
              style={{
                width: "180px",
                height: "180px",
                borderRadius: "16px",
              }}
            >
              <Image
                src={previewUrl}
                alt="Pratinjau gambar menu"
                fill
                className="object-cover"
                sizes="180px"
                unoptimized={previewUrl.startsWith("blob:")}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openFilePicker}
              >
                {previewUrl ? "Ganti gambar" : "Pilih gambar"}
              </Button>
              {hasImageChanged ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleResetImage}
                >
                  Batal
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, atau WebP. Maksimal 2 MB.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="cta" variant="primary" disabled={isPending}>
          {isPending
            ? "Menyimpan..."
            : isEdit
              ? "Simpan perubahan"
              : "Buat menu"}
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
