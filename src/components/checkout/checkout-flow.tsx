"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createOrderFromCart } from "@/lib/orders/actions";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string | null;
  size: string | null;
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

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 rounded-full transition-all duration-300",
            i <= current - 1 ? "w-5 bg-brand-teal" : "w-2.5 bg-border",
          )}
        />
      ))}
      <span className="ml-auto text-[10px] font-medium text-muted-foreground">
        Langkah {current}/{total}
      </span>
    </div>
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
    <div className="flex flex-col gap-4">
      <StepIndicator current={1} total={2} />

      {/* items list */}
      <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 sm:p-5">
        <header className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-teal/10 text-[10px] font-semibold text-brand-teal">
            1
          </div>
          <h2 className="font-display text-[13px] font-semibold sm:text-[14px]">
            Ringkasan pesanan
          </h2>
        </header>

        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[12px] font-medium text-foreground">
                  {item.name}
                  {item.size ? (
                    <span className="ml-1 inline-flex items-center rounded-full border border-border bg-pearl px-1.5 py-0.5 text-[8px] font-medium text-muted-foreground align-middle">
                      {item.size}
                    </span>
                  ) : null}
                  <span className="text-muted-foreground"> × {item.quantity}</span>
                </span>
                {item.notes ? (
                  <span className="text-[10px] text-muted-foreground">
                    Catatan: {item.notes}
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-foreground">
                {formatRupiah(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* summary — Informasi Pesanan */}
      <section className="flex flex-col gap-3 rounded-3xl border border-border bg-white p-4 sm:p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Informasi Pesanan
        </h3>
        <div className="flex flex-col gap-2">
          {tableNumber ? (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Nomor Meja</span>
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                {tableNumber}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Total Bayar</span>
            <span className="font-display text-[11px] font-semibold tabular-nums text-foreground sm:text-[11px]">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="outline" size="cta">
          <Link href={cartHref} className="text-xs">Kembali ke keranjang</Link>
        </Button>
        <Button
          type="button"
          size="cta"
          variant="primary"
          onClick={onPay}
          className="shadow-subtle hover:-translate-y-0.5 active:translate-y-0 text-xs"
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
    <div className="flex flex-col gap-4">
      <StepIndicator current={2} total={2} />

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-5 text-center sm:p-6">
        <header className="flex flex-col gap-0.5">
          <div className="flex items-center justify-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-teal/10 text-[10px] font-semibold text-brand-teal">
              2
            </div>
            <h2 className="font-display text-[14px] font-semibold sm:text-[15px]">
              Scan QR untuk bayar
            </h2>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Buka aplikasi pembayaran kamu lalu pindai kode di bawah.
          </p>
        </header>

        <div className="rounded-2xl border-2 border-border bg-white p-4 shadow-subtle">
          <Image
            src="/payment-qr.svg"
            alt="QR pembayaran statis"
            width={240}
            height={240}
            priority
            unoptimized
          />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground">
            Jumlah dibayar
          </span>
          <span className="font-display text-[20px] font-semibold tabular-nums text-foreground sm:text-[22px]">
            {formatRupiah(totalAmount)}
          </span>
          {tableNumber ? (
            <span className="rounded-full bg-cream-paper px-3.5 py-1 text-[10px] font-medium text-foreground shadow-subtle">
              Meja {tableNumber}
            </span>
          ) : null}
        </div>

        <div className="rounded-xl bg-muted/50 px-4 py-2.5">
          <p className="text-[10px] text-muted-foreground">
            Setelah pembayaran berhasil, tekan{" "}
            <span className="font-semibold text-foreground">Sudah bayar</span>.
            Tim Cak Kum akan memverifikasi sebelum memasak.
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="cta"
          onClick={onBackToReview}
          disabled={isPending}
          className="text-xs"
        >
          Kembali
        </Button>
        <Button
          type="button"
          size="cta"
          variant="primary"
          onClick={onConfirmPaid}
          disabled={isPending}
          className="shadow-subtle hover:-translate-y-0.5 active:translate-y-0 text-xs"
        >
          {isPending ? "Memproses..." : "Sudah bayar"}
        </Button>
      </div>
    </div>
  );
}
