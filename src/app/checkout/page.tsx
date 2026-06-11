import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { getCurrentUserCart } from "@/lib/cart/queries";

type SearchParams = Promise<{ table?: string }>;

export const metadata = {
  title: "Checkout · Kedai Cak Kum",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ table }, cart] = await Promise.all([
    searchParams,
    getCurrentUserCart(),
  ]);

  const tableNumber = table?.trim() || null;
  const cartHref = tableNumber
    ? `/cart?table=${encodeURIComponent(tableNumber)}`
    : "/cart";
  const menuHref = tableNumber
    ? `/menu?table=${encodeURIComponent(tableNumber)}`
    : "/menu";

  // Empty cart or any inactive item: route the customer back to /cart so they
  // can fix things. /checkout never shows an "empty" state of its own.
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
          <Button
            asChild
            size="cta"
            variant="primary"
          >
            <Link href={menuHref}>Lihat menu</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (cart.hasInactiveItem) {
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
          <Button
            asChild
            size="cta"
            variant="primary"
          >
            <Link href={cartHref}>Kembali ke keranjang</Link>
          </Button>
        </div>
      </main>
    );
  }

  const checkoutItems = cart.items
    .filter((item) => item.menu)
    .map((item) => ({
      id: item.id,
      name: item.menu!.name,
      price: Number(item.menu!.price),
      quantity: item.quantity,
      notes: item.notes,
    }));

  return (
    <main className="min-h-screen bg-background pb-32">
      <header className="border-b border-border bg-card py-5 sm:py-6">
        <div className="mx-auto flex max-w-lg flex-col gap-2 px-5 sm:px-6">
          <Link
            href={cartHref}
            className="self-start text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Kembali ke keranjang
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[18px] font-semibold tracking-tight sm:text-[22px]">
              Checkout
            </h1>
            {tableNumber ? (
              <span className="rounded-full bg-cream-paper px-3 py-0.5 text-[10px] font-medium text-foreground shadow-subtle">
                Meja {tableNumber}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 py-6 sm:px-6 sm:py-7">
        <CheckoutFlow
          items={checkoutItems}
          totalAmount={cart.totalAmount}
          tableNumber={tableNumber}
        />
      </div>
    </main>
  );
}
