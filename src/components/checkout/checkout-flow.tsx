"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw, AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { confirmPayment, cancelPendingPayment } from "@/lib/orders/actions";
import { formatRupiah } from "@/lib/format";

type PaymentState = {
  orderId: string;
  orderNumber: number;
  invoiceUrl: string;
  qrImage: string;
  expiryDate: string;
};

export function CheckoutFlow({
  totalAmount,
  tableNumber,
  paymentState,
}: {
  totalAmount: number;
  tableNumber: string | null;
  paymentState: PaymentState;
}) {
  const router = useRouter();
  const [isChecking, startCheck] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const state = paymentState;

    async function checkNow() {
      const result = await confirmPayment(state.orderId);
      if (result.message?.toLowerCase().includes("kedaluwarsa")) {
        router.push(`/order/cancel`);
      } else if (result.ok) {
        router.push(`/order/success?number=${state.orderNumber}`);
      }
    }

    checkNow();

    pollRef.current = setInterval(async () => {
      const result = await confirmPayment(state.orderId);
      if (result.message?.toLowerCase().includes("kedaluwarsa")) {
        if (pollRef.current) clearInterval(pollRef.current);
        router.push(`/order/cancel`);
      } else if (result.ok) {
        if (pollRef.current) clearInterval(pollRef.current);
        router.push(`/order/success?number=${state.orderNumber}`);
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [paymentState, router]);

  const handleConfirmPaid = useCallback(() => {
    startCheck(async () => {
      const result = await confirmPayment(paymentState.orderId);
      if (pollRef.current) clearInterval(pollRef.current);
      if (result.ok) {
        router.push(`/order/success?number=${paymentState.orderNumber}`);
      } else if (result.message?.toLowerCase().includes("kedaluwarsa")) {
        router.push(`/order/cancel`);
      } else {
        toast.error(result.message ?? "Pembayaran belum dikonfirmasi. Coba lagi.");
      }
    });
  }, [paymentState, router]);

  return (
    <PayStep
      totalAmount={totalAmount}
      tableNumber={tableNumber}
      isChecking={isChecking}
      orderId={paymentState.orderId}
      invoiceUrl={paymentState.invoiceUrl}
      qrImage={paymentState.qrImage}
      expiryDate={paymentState.expiryDate}
      onConfirmPaid={handleConfirmPaid}
    />
  );
}

function PayStep({
  totalAmount,
  tableNumber,
  isChecking,
  orderId,
  invoiceUrl,
  qrImage,
  expiryDate,
  onConfirmPaid,
}: {
  totalAmount: number;
  tableNumber: string | null;
  isChecking: boolean;
  orderId: string;
  invoiceUrl: string;
  qrImage: string;
  expiryDate: string;
  onConfirmPaid: () => void;
}) {
  const [diff, setDiff] = useState<number | null>(null);
  const [isCancelling, startCancel] = useTransition();

  async function handleCancel() {
    startCancel(async () => {
      try {
        const result = await cancelPendingPayment(orderId);
        if (result.ok) {
          window.location.href = "/order/cancel?from=checkout";
        } else {
          toast.error(result.message ?? "Gagal membatalkan pesanan");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal membatalkan pesanan");
      }
    });
  }

  useEffect(() => {
    const expiry = new Date(expiryDate).getTime();
    function tick() {
      setDiff(Math.max(0, expiry - Date.now()));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiryDate]);

  const hours = diff !== null ? Math.floor(diff / 3600000) : 0;
  const mins = diff !== null ? Math.floor((diff % 3600000) / 60000) : 0;
  const secs = diff !== null ? Math.floor((diff % 60000) / 1000) : 0;
  const isExpired = diff !== null && diff <= 0;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-5 text-center sm:p-6">
        <header className="flex flex-col gap-0.5">
          <h2 className="font-display text-[14px] font-semibold sm:text-[15px]">
            Scan QR untuk bayar
          </h2>
          <p className="text-[12px] text-muted-foreground">
            Scan QR code di bawah menggunakan GoPay, OVO, DANA, atau Mobile Banking.
          </p>
        </header>

        {/* timer */}
        {diff === null ? (
          <div className="h-14" />
        ) : isExpired ? (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
            <p className="text-[10px] text-destructive">Waktu pembayaran telah habis. Silakan buat pesanan baru dari menu.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5">
            <div className="flex items-baseline gap-1">
              {hours > 0 && (
                <>
                  <span className="font-display text-[30px] font-bold tabular-nums leading-none text-destructive">{String(hours).padStart(2, "0")}</span>
                  <span className="text-[10px] text-destructive">jam</span>
                </>
              )}
              <span className="font-display text-[30px] font-bold tabular-nums leading-none text-destructive ml-1">{String(mins).padStart(2, "0")}</span>
              <span className="text-[10px] text-destructive">menit</span>
              <span className="font-display text-[30px] font-bold tabular-nums leading-none text-destructive ml-1">{String(secs).padStart(2, "0")}</span>
              <span className="text-[10px] text-destructive">detik</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Segera lakukan pembayaran sebelum waktu habis
            </span>
          </div>
        )}

        {qrImage ? (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-2xl border-2 border-border bg-white p-4 shadow-subtle">
              <img
                src={qrImage}
                alt="QR Code Pembayaran"
                width={240}
                height={240}
                className="h-60 w-60"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-border bg-white p-6 shadow-subtle">
            <p className="text-sm text-muted-foreground">
              Gagal memuat QR code.
            </p>
          </div>
        )}

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

        {isExpired ? null : (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-xl bg-muted/50 px-4 py-2.5">
              <p className="text-[10px] text-muted-foreground">
                Setelah bayar, pesanan otomatis terkonfirmasi. Atau tekan{" "}
                <span className="font-semibold text-foreground">Sudah bayar</span>{" "}
                jika tidak redirect otomatis.
              </p>
            </div>
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-brand-teal underline-offset-2 hover:underline"
            >
              Alternatif: buka halaman pembayaran
            </a>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          size="cta"
          variant="primary"
          onClick={onConfirmPaid}
          disabled={isChecking || isExpired}
          className="shadow-subtle hover:-translate-y-0.5 active:translate-y-0 text-xs gap-2 w-full"
        >
          {isChecking ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengecek...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Sudah bayar
            </span>
          )}
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            size="cta"
            variant="outline"
            onClick={handleCancel}
            disabled={isCancelling || isExpired}
            className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5 text-xs gap-2"
          >
            {isCancelling ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Membatalkan...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Batalkan
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
