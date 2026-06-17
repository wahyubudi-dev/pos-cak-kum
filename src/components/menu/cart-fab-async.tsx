import { getCurrentUserCart } from "@/lib/cart/queries";
import { CartFab } from "@/components/menu/cart-fab";

export async function CartFabAsync({
  tableNumber,
}: {
  tableNumber: string | null;
}) {
  const cart = await getCurrentUserCart();
  if (!cart || cart.totalQuantity === 0) return null;

  const href = tableNumber
    ? `/cart?table=${encodeURIComponent(tableNumber)}`
    : "/cart";

  return (
    <CartFab
      itemCount={cart.totalQuantity}
      totalAmount={cart.totalAmount}
      href={href}
    />
  );
}
