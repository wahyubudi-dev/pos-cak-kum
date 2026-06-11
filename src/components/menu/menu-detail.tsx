"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";

import { addToCart } from "@/lib/cart/actions";

type MenuSize = { label: string; price: number };

type MenuDetailProps = {
  menuId: string;
  menuName: string;
  price: number;
  menuSizes: MenuSize[] | null;
  isActive: boolean;
  isAuthenticated: boolean;
  returnPath: string;
};

export function MenuDetail({
  menuId,
  menuName,
  price,
  menuSizes,
  isActive,
  isAuthenticated,
  returnPath,
}: MenuDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedSize, setSelectedSize] = useState<MenuSize | null>(
    menuSizes && menuSizes.length > 0 ? menuSizes[0] : null,
  );

  const unitPrice = selectedSize ? selectedSize.price : price;
  const totalPrice = unitPrice * quantity;

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function increment() {
    setQuantity((q) => Math.min(99, q + 1));
  }

  function handleAddToCart() {
    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${encodeURIComponent(returnPath)}`);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("menu_id", menuId);
      formData.set("quantity", String(quantity));
      if (notes.trim()) formData.set("notes", notes.trim());
      if (selectedSize) formData.set("size", selectedSize.label);

      const result = await addToCart(formData);
      if (result.ok) {
        toast.success(`${menuName} ditambahkan ke keranjang`);
        router.back();
      } else {
        toast.error(result.message ?? "Gagal menambahkan ke keranjang");
      }
    });
  }

  return (
    <>
      {/* Size selector */}
      {menuSizes && menuSizes.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-foreground sm:text-[15px]">
            Ukuran
          </span>
          <div className="flex flex-wrap gap-2">
            {menuSizes.map((size) => {
              const isSelected = selectedSize?.label === size.label;
              return (
                <button
                  key={size.label}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  disabled={!isActive || isPending}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-medium transition-all sm:text-[13px] ${
                    isSelected
                      ? "border-brand-teal bg-brand-teal/10 text-brand-teal shadow-sm"
                      : "border-border bg-white text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                  style={
                    isSelected
                      ? { borderColor: "var(--color-brand-teal)" }
                      : undefined
                  }
                >
                  {size.label}
                  <span className="font-semibold">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(size.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Notes textarea */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="notes"
          className="text-[13px] font-medium text-foreground sm:text-[15px]"
        >
          Catatan <span className="font-normal text-muted-foreground">(opsional)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={100}
          rows={4}
          placeholder="Contoh: tanpa bawang, level pedas sedang..."
          disabled={!isActive || isPending}
          className="min-h-28 w-full resize-none rounded-[24px] border border-border bg-card px-4 py-3.5 text-[13px] leading-5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-50 sm:min-h-32 sm:px-5 sm:py-4 sm:text-[15px] sm:leading-6"
          style={{ focusRingColor: "var(--color-brand-teal)" } as React.CSSProperties}
        />
        <p className="text-right text-xs text-muted-foreground sm:text-sm">
          {notes.length}/100
        </p>
      </div>

      {/* Spacer to clear fixed purchase card */}
      <div className="h-0 sm:h-44" aria-hidden="true" />

      {/* Sticky purchase card */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-4">
        <div className="mx-auto max-w-lg">
          <div className="rounded-[28px] border border-border bg-card p-4 shadow-subtle sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Total harga
                </p>
                <p className="font-display text-[17px] font-semibold text-foreground sm:text-[20px]">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(totalPrice)}
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-full border border-border bg-background px-3 py-2 sm:gap-4 sm:px-4">
                <button
                  type="button"
                  onClick={decrement}
                  disabled={quantity <= 1 || !isActive || isPending}
                  aria-label="Kurangi jumlah"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-pearl disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span
                  className="w-7 text-center text-[17px] font-semibold tabular-nums leading-none text-foreground sm:text-[20px]"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={increment}
                  disabled={quantity >= 99 || !isActive || isPending}
                  aria-label="Tambah jumlah"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-white transition-colors disabled:opacity-40"
                  style={{ background: "var(--color-brand-teal)" }}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isActive || isPending}
              className="mt-4 w-full rounded-[22px] px-5 py-3.5 text-[13px] font-semibold text-white transition-all duration-200 disabled:opacity-50 active:scale-[0.99] sm:mt-5 sm:rounded-[24px] sm:text-[15px]"
              style={{ background: "var(--color-brand-teal)" }}
            >
              {isPending
                ? "Menambahkan..."
                : !isActive
                  ? "Sedang tidak tersedia"
                  : "Tambah ke keranjang"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
