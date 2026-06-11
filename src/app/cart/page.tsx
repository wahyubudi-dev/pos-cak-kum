import Link from "next/link";

import { CartClient } from "@/components/cart/cart-client";
import { Button } from "@/components/ui/button";
import { getCurrentUserCart } from "@/lib/cart/queries";
import { getActiveTables } from "@/lib/tables/queries";

type SearchParams = Promise<{ table?: string }>;

export const metadata = {
  title: "Keranjang · Kedai Cak Kum",
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ table }, cart, activeTables] = await Promise.all([
    searchParams,
    getCurrentUserCart(),
    getActiveTables(),
  ]);

  const tableNumber = table?.trim() || null;
  const backToMenuHref = tableNumber
    ? `/menu?table=${encodeURIComponent(tableNumber)}`
    : "/menu";

  const mappedTables = activeTables.map((t) => ({ label: t.label }));

  return (
    <>
      <main className="min-h-screen bg-background pb-32">
        <header className="border-b border-border bg-card py-5 sm:py-6">
          <div className="mx-auto flex max-w-lg flex-col gap-2 px-5 sm:px-6">
            <Link
              href={backToMenuHref}
              className="self-start text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              ← Kembali ke menu
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-[18px] font-semibold tracking-tight sm:text-[22px]">
                Keranjang
              </h1>
              {tableNumber ? (
                <span className="rounded-full bg-cream-paper px-3 py-0.5 text-[10px] font-medium text-foreground shadow-subtle">
                  Meja {tableNumber}
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-lg flex-col gap-5 px-5 py-6 sm:gap-6 sm:px-6 sm:py-7">
          {cart.items.length === 0 ? (
            <EmptyCart backToMenuHref={backToMenuHref} />
          ) : (
            <CartClient
              items={cart.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                notes: item.notes,
                menu: item.menu
                  ? {
                      id: item.menu.id,
                      name: item.menu.name,
                      price: Number(item.menu.price),
                      image_url: item.menu.imageUrl,
                      is_active: item.menu.isActive,
                    }
                  : null,
              }))}
              totalAmount={cart.totalAmount}
              totalQuantity={cart.totalQuantity}
              hasInactiveItem={cart.hasInactiveItem}
              tableNumber={tableNumber}
              tables={mappedTables}
            />
          )}
        </div>
      </main>
    </>
  );
}

function EmptyCart({ backToMenuHref }: { backToMenuHref: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <p className="font-display text-[18px] font-semibold text-foreground sm:text-[22px]">
        Keranjang masih kosong
      </p>
      <p className="max-w-sm text-[13px] text-muted-foreground">
        Pilih menu dulu untuk menambahkannya ke keranjang.
      </p>
      <Button asChild size="cta" variant="primary">
        <Link href={backToMenuHref}>Lihat menu</Link>
      </Button>
    </div>
  );
}
