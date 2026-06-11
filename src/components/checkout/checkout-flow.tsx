"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createOrderFromCart } from "@/lib/orders/actions";
import { formatRupiah } from "@/lib/format";

type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string | null;
};

type CheckoutFlowProps = {
  items: CheckoutItem[];
  totalAmount: number;
  tableNumber: string | null;
};

type Step = "review" | "pay";

/**
 * Two-step checkout shell:
 *   1. Review — confirm the items + table, hit "Bayar".
 *   2. Pay   — show static QR. Customer either confirms ("Sudah Bayar") to
 *              create the order, or cancels back to the cart.
 */
export function CheckoutFlow({
  items,
  totalAmount,
  tableNumber,
}: CheckoutFlowProps) {
  const [step, setStep] = useState<Step>("review");
  const [isPending, startTransition] = useTransition();

  const cartHref = tableNumber
    ? `/cart?table=${encodeURIComponent(tableNumber)}`
    : "/cart";

  function handleConfirmPaid() {
    startTransition(async () => {
      const formData = new FormData();
      if (tableNumber) formData.set("table_number", tableNumber);

      const result = await createOrderFromCart(formData);
      if (result && !result.ok) {
        toast.error(result.message ?? "Gagal membuat pesanan");
      }
    });
  }

  if (step === "pay") {
    return (
      <PayStep
        totalAmount={totalAmount}
        tableNumber={tableNumber}
        isPending={isPending}
        onConfirmPaid={handleConfirmPaid}
        onBackToReview={() => setStep("review")}
        cartHref={cartHref}
      />
    );
  }

  return (
    <ReviewStep
      items={items}
      totalAmount={totalAmount}
      tableNumber={tableNumber}
      cartHref={cartHref}
      onPay={() => setStep("pay")}
    />
  );
}

function ReviewStep({
  items,
  totalAmount,
  tableNumber,
  cartHref,
  onPay,
}: {
  items: CheckoutItem[];
  totalAmount: number;
  tableNumber: string | null;
  cartHref: string;
  onPay: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6">
        <header className="flex flex-col gap-1">
          <h2 className="font-display text-lg font-semibold">
            Ringkasan pesanan
          </h2>
          {tableNumber ? (
            <span className="self-start rounded-full bg-cream-paper px-3 py-1 text-xs font-medium text-foreground">
              Meja {tableNumber}
            </span>
          ) : null}
        </header>

        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium text-foreground">
                  {item.name}
                  <span className="text-muted-foreground"> × {item.quantity}</span>
                </span>
                {item.notes ? (
                  <span className="text-xs text-muted-foreground">
                    Catatan: {item.notes}
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-foreground">
                {formatRupiah(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Total bayar</span>
          <span className="font-display text-2xl font-semibold tabular-nums text-foreground">
            {formatRupiah(totalAmount)}
          </span>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost" size="cta">
          <Link href={cartHref}>Kembali ke keranjang</Link>
        </Button>
        <Button
          type="button"
          size="cta"
          variant="primary"
          onClick={onPay}
        >
          Bayar {formatRupiah(totalAmount)}
        </Button>
      </div>
    </div>
  );
}

function PayStep({
  totalAmount,
  tableNumber,
  isPending,
  onConfirmPaid,
  onBackToReview,
  cartHref,
}: {
  totalAmount: number;
  tableNumber: string | null;
  isPending: boolean;
  onConfirmPaid: () => void;
  onBackToReview: () => void;
  cartHref: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card p-6 text-center">
        <header className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-semibold">
            Scan QR untuk bayar
          </h2>
          <p className="text-sm text-muted-foreground">
            Buka aplikasi pembayaran kamu lalu pindai kode di bawah.
          </p>
        </header>

        <div className="rounded-3xl border border-border bg-white p-4">
          <Image
            src="/payment-qr.svg"
            alt="QR pembayaran statis"
            width={256}
            height={256}
            priority
            unoptimized
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Jumlah dibayar
          </span>
          <span className="font-display text-3xl font-semibold tabular-nums">
            {formatRupiah(totalAmount)}
          </span>
          {tableNumber ? (
            <span className="rounded-full bg-cream-paper px-3 py-1 text-xs font-medium text-foreground">
              Meja {tableNumber}
            </span>
          ) : null}
        </div>

        <p className="max-w-xs text-xs text-muted-foreground">
          Setelah pembayaran berhasil, tekan{" "}
          <span className="font-semibold">Sudah bayar</span>. Tim Cak Kum akan
          memverifikasi sebelum memasak.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="cta"
          onClick={onBackToReview}
          disabled={isPending}
        >
          Ubah pesanan
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            variant="ghost"
            size="cta"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Link href={`/order/cancel?from=${encodeURIComponent(cartHref)}`}>
              Batal
            </Link>
          </Button>
          <Button
            type="button"
            size="cta"
            variant="primary"
            onClick={onConfirmPaid}
            disabled={isPending}
          >
            {isPending ? "Memproses..." : "Sudah bayar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
