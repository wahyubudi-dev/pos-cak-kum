import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { getCurrentUserCart } from "@/lib/cart/queries";
import { getPendingPaymentOrder, createOrderFromCartServer } from "@/lib/orders/pending";

type SearchParams = Promise<{ table?: string }>;

export const metadata = {
  title: "Checkout · Kedai Cak Kum",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { table } = await searchParams;

  const tableNumber = table?.trim() || null;
  const menuHref = tableNumber
    ? `/menu?table=${encodeURIComponent(tableNumber)}`
    : "/menu";

  // 1) Check for existing unpaid order
  const pendingOrder = await getPendingPaymentOrder();

  if (pendingOrder) {
    return (
      <CheckoutPageShell tableNumber={pendingOrder.tableNumber} isRetry>
        <CheckoutFlow
          totalAmount={pendingOrder.totalAmount}
          tableNumber={pendingOrder.tableNumber}
          paymentState={{
            orderId: pendingOrder.orderId,
            orderNumber: pendingOrder.orderNumber,
            invoiceUrl: pendingOrder.invoiceUrl,
            qrImage: pendingOrder.qrImage,
            expiryDate: pendingOrder.expiryDate,
          }}
        />
      </CheckoutPageShell>
    );
  }

  // 2) No pending order — create one from cart
  const cart = await getCurrentUserCart();

  if (cart.items.length === 0) {
    return (
      <main className="min-h-screen bg-background px-5 py-14 sm:px-6">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="font-display text-[18px] font-semibold text-foreground sm:text-[22px]">
            Tidak ada pesanan
          </p>
          <p className="max-w-sm text-[13px] text-muted-foreground">
            Keranjang kamu masih kosong. Pilih menu dulu untuk lanjut ke
            pembayaran.
          </p>
          <Button asChild size="cta" variant="primary">
            <Link href={menuHref}>Lihat menu</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (cart.hasInactiveItem) {
    const cartHref = tableNumber
      ? `/cart?table=${encodeURIComponent(tableNumber)}`
      : "/cart";

    return (
      <main className="min-h-screen bg-background px-5 py-14 sm:px-6">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-3xl border border-destructive/40 bg-card px-6 py-14 text-center">
          <p className="font-display text-[18px] font-semibold text-foreground sm:text-[22px]">
            Ada menu yang tidak tersedia
          </p>
          <p className="max-w-sm text-[13px] text-muted-foreground">
            Hapus atau ganti item yang sudah tidak tersedia di keranjang
            sebelum kamu lanjut ke pembayaran.
          </p>
          <Button asChild size="cta" variant="primary">
            <Link href={cartHref}>Kembali ke keranjang</Link>
          </Button>
        </div>
      </main>
    );
  }

  // Create order immediately
  const orderData = await createOrderFromCartServer(tableNumber);

  return (
    <CheckoutPageShell tableNumber={orderData.tableNumber}>
      <CheckoutFlow
        totalAmount={orderData.totalAmount}
        tableNumber={orderData.tableNumber}
        paymentState={{
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          invoiceUrl: orderData.invoiceUrl,
          qrImage: orderData.qrImage,
          expiryDate: orderData.expiryDate,
        }}
      />
    </CheckoutPageShell>
  );
}

function CheckoutPageShell({
  tableNumber,
  isRetry,
  children,
}: {
  tableNumber: string | null;
  isRetry?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background pb-32">
      <header className="border-b border-border bg-card py-5 sm:py-6">
        <div className="mx-auto flex max-w-lg flex-col gap-2 px-5 sm:px-6">
          <Link
            href="/menu"
            className="self-start text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Kembali ke menu
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[18px] font-semibold tracking-tight sm:text-[22px]">
              Checkout
            </h1>
            {isRetry ? (
              <span className="rounded-full bg-amber-50 px-3 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                Pembayaran tertunda
              </span>
            ) : tableNumber ? (
              <span className="rounded-full bg-cream-paper px-3 py-0.5 text-[10px] font-medium text-foreground shadow-subtle">
                Meja {tableNumber}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 py-6 sm:px-6 sm:py-7">
        {children}
      </div>
    </main>
  );
}
