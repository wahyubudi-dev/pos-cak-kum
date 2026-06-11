import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { carts, cartItems } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import type { Cart, CartItem, Menu } from "@/lib/db/schema";

export type CartItemWithMenu = CartItem & {
  menu: Pick<
    Menu,
    "id" | "name" | "price" | "imageUrl" | "isActive" | "categoryId"
  > | null;
};

export type CartWithItems = {
  cart: Cart | null;
  items: CartItemWithMenu[];
  totalAmount: number;
  totalQuantity: number;
  hasInactiveItem: boolean;
};

const EMPTY_CART: CartWithItems = {
  cart: null,
  items: [],
  totalAmount: 0,
  totalQuantity: 0,
  hasInactiveItem: false,
};

/**
 * Fetch the authenticated user's cart with all items joined to their menu
 * snapshot. Inactive items stay in the result so the UI can warn the user
 * (PRD CART-04) — we do NOT filter by is_active here.
 */
export async function getCurrentUserCart(): Promise<CartWithItems> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return EMPTY_CART;

  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userData.user.id),
    with: {
      items: {
        orderBy: [asc(cartItems.createdAt)],
        with: {
          menu: {
            columns: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              isActive: true,
              categoryId: true,
            },
          },
        },
      },
    },
  });

  if (!cart) return EMPTY_CART;

  let totalAmount = 0;
  let totalQuantity = 0;
  let hasInactiveItem = false;

  for (const item of cart.items) {
    totalQuantity += item.quantity;
    if (!item.menu) {
      hasInactiveItem = true;
      continue;
    }
    if (!item.menu.isActive) hasInactiveItem = true;
    if (item.menu.isActive) {
      totalAmount += Number(item.menu.price) * item.quantity;
    }
  }

  return {
    cart: {
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    },
    items: cart.items,
    totalAmount,
    totalQuantity,
    hasInactiveItem,
  };
}

export async function getCurrentUserCartCount(): Promise<number> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;

  const rows = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .where(eq(carts.userId, userData.user.id));

  return rows.reduce((sum, row) => sum + row.quantity, 0);
}
