"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  removeCartItem,
  updateCartItem,
} from "@/lib/cart/actions";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

type CartItem = {
  id: string;
  quantity: number;
  notes: string | null;
  menu: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    is_active: boolean;
  } | null;
};

type CartItemRowProps = {
  item: CartItem;
};

const MAX_QUANTITY = 99;
const MAX_NOTES = 100;

/**
 * Single line in the cart with quantity controls, per-item notes editor,
 * and a remove button. All mutations go through the server actions; we
 * keep optimistic state for quantity so the UI feels instant, then roll
 * back if the action returns an error.
 */
export function CartItemRow({ item }: CartItemRowProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isPending, startTransition] = useTransition();

  const menu = item.menu;
  const isInactive = !menu || !menu.is_active;
  const subtotal = menu ? menu.price * quantity : 0;

  function persist(nextQuantity: number, nextNotes: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("quantity", String(nextQuantity));
      formData.set("notes", nextNotes);

      const result = await updateCartItem(item.id, formData);
      if (!result.ok) {
        // Roll back optimistic state.
        setQuantity(item.quantity);
        setNotes(item.notes ?? "");
        toast.error(result.message ?? "Gagal memperbarui");
      }
    });
  }

  function handleIncrement() {
    if (quantity >= MAX_QUANTITY) return;
    const next = quantity + 1;
    setQuantity(next);
    persist(next, notes);
  }

  function handleDecrement() {
    if (quantity <= 1) return;
    const next = quantity - 1;
    setQuantity(next);
    persist(next, notes);
  }

  function handleSaveNotes() {
    persist(quantity, notes);
    setIsEditingNotes(false);
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeCartItem(item.id);
      if (result.ok) toast.success(result.message ?? "Item dihapus");
      else toast.error(result.message ?? "Gagal menghapus");
    });
  }

  return (
    <article
      className={cn(
        "flex gap-4 rounded-2xl border bg-card p-4",
        isInactive ? "border-destructive/40" : "border-border",
      )}
    >
      <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        {menu?.image_url ? (
          <Image
            src={menu.image_url}
            alt={menu.name}
            fill
            sizes="80px"
            className={cn("object-cover", isInactive && "opacity-50")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wide text-muted-foreground">
            Tanpa
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">
                {menu?.name ?? "Menu tidak tersedia"}
              </span>
              {isInactive ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-destructive text-destructive"
                >
                  Tidak tersedia
                </Badge>
              ) : null}
            </div>
            {menu ? (
              <span className="text-sm text-muted-foreground">
                {formatRupiah(menu.price)}
                {quantity > 1 ? ` × ${quantity}` : ""}
              </span>
            ) : null}
          </div>
          <span className="shrink-0 font-semibold tabular-nums text-foreground">
            {formatRupiah(subtotal)}
          </span>
        </div>

        <NotesEditor
          value={notes}
          isEditing={isEditingNotes}
          isPending={isPending}
          onChange={setNotes}
          onStart={() => setIsEditingNotes(true)}
          onSave={handleSaveNotes}
          onCancel={() => {
            setNotes(item.notes ?? "");
            setIsEditingNotes(false);
          }}
        />

        <div className="flex items-center justify-between gap-3 pt-1">
          <QuantityStepper
            quantity={quantity}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            disabled={isPending || isInactive}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleRemove}
            disabled={isPending}
          >
            Hapus
          </Button>
        </div>
      </div>
    </article>
  );
}

function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  disabled,
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 rounded-full p-0"
        onClick={onDecrement}
        disabled={disabled || quantity <= 1}
        aria-label="Kurangi jumlah"
      >
        −
      </Button>
      <span className="min-w-[2ch] text-center text-sm font-semibold tabular-nums">
        {quantity}
      </span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-8 rounded-full p-0"
        onClick={onIncrement}
        disabled={disabled || quantity >= MAX_QUANTITY}
        aria-label="Tambah jumlah"
      >
        +
      </Button>
    </div>
  );
}

function NotesEditor({
  value,
  isEditing,
  isPending,
  onChange,
  onStart,
  onSave,
  onCancel,
}: {
  value: string;
  isEditing: boolean;
  isPending: boolean;
  onChange: (next: string) => void;
  onStart: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (isEditing) {
    return (
      <div className="flex flex-col gap-2">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, MAX_NOTES))}
          rows={2}
          maxLength={MAX_NOTES}
          placeholder='Misal: "tanpa bawang", "ekstra sambel"'
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {value.length}/{MAX_NOTES}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-lg"
              onClick={onCancel}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-lg bg-brand-teal text-white hover:bg-brand-teal/90"
              onClick={onSave}
              disabled={isPending}
            >
              Simpan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!value) {
    return (
      <button
        type="button"
        className="self-start text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={onStart}
      >
        + Tambah catatan
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onStart}
      className="flex items-start gap-2 rounded-xl bg-cream-paper px-3 py-2 text-left text-xs text-foreground hover:bg-cream-paper/70"
    >
      <span className="font-medium uppercase tracking-wide text-muted-foreground">
        Catatan:
      </span>
      <span className="flex-1">{value}</span>
    </button>
  );
}
