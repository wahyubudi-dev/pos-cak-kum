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
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold text-foreground">
            Tidak ada pesanan
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
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
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-destructive/40 bg-card px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold text-foreground">
            Ada menu yang tidak tersedia
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
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
    <main className="min-h-screen bg-background pb-16">
      <header className="border-b border-border bg-card px-6 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          <Link
            href={cartHref}
            className="self-start text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Kembali ke keranjang
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Checkout
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <CheckoutFlow
          items={checkoutItems}
          totalAmount={cart.totalAmount}
          tableNumber={tableNumber}
        />
      </div>
    </main>
  );
}
