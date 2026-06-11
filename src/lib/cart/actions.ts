"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { carts, cartItems, menus } from "@/lib/db/schema";

export type CartActionState = {
  ok: boolean;
  message?: string;
};

const EMPTY_STATE: CartActionState = { ok: true };

const addToCartSchema = z.object({
  menu_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  notes: z
    .string()
    .trim()
    .max(100, "Catatan maksimal 100 karakter")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
  notes: z
    .string()
    .trim()
    .max(100, "Catatan maksimal 100 karakter")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

async function getOrCreateCartId(userId: string): Promise<string> {
  const existing = await db.query.carts.findFirst({
    columns: { id: true },
    where: eq(carts.userId, userId),
  });
  if (existing) return existing.id;

  const [created] = await db
    .insert(carts)
    .values({ userId })
    .returning({ id: carts.id });

  if (!created) throw new Error("Failed to create cart");
  return created.id;
}

export async function addToCart(formData: FormData): Promise<CartActionState> {
  const user = await requireAuth("/menu");

  const parsed = addToCartSchema.safeParse({
    menu_id: formData.get("menu_id"),
    quantity: formData.get("quantity") ?? 1,
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Permintaan tidak valid",
    };
  }

  const menu = await db.query.menus.findFirst({
    columns: { id: true, isActive: true },
    where: eq(menus.id, parsed.data.menu_id),
  });

  if (!menu) return { ok: false, message: "Menu tidak ditemukan" };
  if (!menu.isActive) return { ok: false, message: "Menu sedang tidak tersedia" };

  const cartId = await getOrCreateCartId(user.auth.id);

  // Match existing line by (cart, menu, notes). Postgres treats NULL as
  // distinct in normal equality so we branch on whether notes is null.
  const notesCondition =
    parsed.data.notes === null
      ? isNull(cartItems.notes)
      : eq(cartItems.notes, parsed.data.notes);

  const existing = await db.query.cartItems.findFirst({
    columns: { id: true, quantity: true },
    where: and(
      eq(cartItems.cartId, cartId),
      eq(cartItems.menuId, parsed.data.menu_id),
      notesCondition,
    ),
  });

  try {
    if (existing) {
      const nextQuantity = Math.min(existing.quantity + parsed.data.quantity, 99);
      await db
        .update(cartItems)
        .set({ quantity: nextQuantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        cartId,
        menuId: parsed.data.menu_id,
        quantity: parsed.data.quantity,
        notes: parsed.data.notes,
      });
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menambah ke keranjang",
    };
  }

  // Bump cart's updated_at so it sorts correctly in any future queries.
  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));

  revalidatePath("/menu");
  revalidatePath("/cart");
  return { ...EMPTY_STATE, message: "Ditambahkan ke keranjang" };
}

export async function updateCartItem(
  itemId: string,
  formData: FormData,
): Promise<CartActionState> {
  const user = await requireAuth("/cart");

  const parsed = updateCartItemSchema.safeParse({
    quantity: formData.get("quantity"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Form tidak valid",
    };
  }

  // Verify ownership before mutating. Drizzle bypasses RLS, so we enforce
  // the ownership check at the app layer using a join through carts.
  const owned = await db
    .select({ id: cartItems.id })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .where(and(eq(cartItems.id, itemId), eq(carts.userId, user.auth.id)));

  if (owned.length === 0) {
    return { ok: false, message: "Item tidak ditemukan" };
  }

  try {
    await db
      .update(cartItems)
      .set({
        quantity: parsed.data.quantity,
        notes: parsed.data.notes,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, itemId));
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal memperbarui",
    };
  }

  revalidatePath("/cart");
  return EMPTY_STATE;
}

export async function removeCartItem(
  itemId: string,
): Promise<CartActionState> {
  const user = await requireAuth("/cart");

  const owned = await db
    .select({ id: cartItems.id })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .where(and(eq(cartItems.id, itemId), eq(carts.userId, user.auth.id)));

  if (owned.length === 0) {
    return { ok: false, message: "Item tidak ditemukan" };
  }

  try {
    await db.delete(cartItems).where(eq(cartItems.id, itemId));
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menghapus",
    };
  }

  revalidatePath("/cart");
  revalidatePath("/menu");
  return { ...EMPTY_STATE, message: "Item dihapus dari keranjang" };
}

export async function clearCart(): Promise<CartActionState> {
  const user = await requireAuth("/cart");

  const cart = await db.query.carts.findFirst({
    columns: { id: true },
    where: eq(carts.userId, user.auth.id),
  });

  if (!cart) return EMPTY_STATE;

  try {
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal mengosongkan keranjang",
    };
  }

  revalidatePath("/cart");
  revalidatePath("/menu");
  return EMPTY_STATE;
}
