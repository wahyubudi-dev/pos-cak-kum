import Link from "next/link";

import { CartItemRow } from "@/components/cart/cart-item-row";
import { CartSummary } from "@/components/cart/cart-summary";
import { Button } from "@/components/ui/button";
import { getCurrentUserCart } from "@/lib/cart/queries";

type SearchParams = Promise<{ table?: string }>;

export const metadata = {
  title: "Keranjang · Kedai Cak Kum",
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ table }, cart] = await Promise.all([
    searchParams,
    getCurrentUserCart(),
  ]);

  const tableNumber = table?.trim() || null;
  const backToMenuHref = tableNumber
    ? `/menu?table=${encodeURIComponent(tableNumber)}`
    : "/menu";

  return (
    <main className="min-h-screen bg-background pb-32">
      <header className="border-b border-border bg-card px-6 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          <Link
            href={backToMenuHref}
            className="self-start text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Kembali ke menu
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Keranjang
          </h1>
          {tableNumber ? (
            <span className="self-start rounded-full bg-cream-paper px-3 py-1 text-xs font-medium text-foreground">
              Meja {tableNumber}
            </span>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
        {cart.items.length === 0 ? (
          <EmptyCart backToMenuHref={backToMenuHref} />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {cart.items.map((item) => (
                <li key={item.id}>
                  <CartItemRow
                    item={{
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
                    }}
                  />
                </li>
              ))}
            </ul>

            <CartSummary
              totalAmount={cart.totalAmount}
              totalQuantity={cart.totalQuantity}
              hasInactiveItem={cart.hasInactiveItem}
              tableNumber={tableNumber}
            />
          </>
        )}
      </div>
    </main>
  );
}

function EmptyCart({ backToMenuHref }: { backToMenuHref: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <p className="font-display text-xl font-semibold text-foreground">
        Keranjang masih kosong
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Pilih menu dulu untuk menambahkannya ke keranjang.
      </p>
      <Button asChild size="cta" variant="primary">
        <Link href={backToMenuHref}>Lihat menu</Link>
      </Button>
    </div>
  );
}
