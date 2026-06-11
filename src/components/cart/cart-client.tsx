"use client";

import { useState } from "react";

import { CartItemRow } from "@/components/cart/cart-item-row";
import { CartSummary } from "@/components/cart/cart-summary";
import { TablePickerDialog } from "@/components/cart/table-picker-dialog";

type ClientCartItem = {
  id: string;
  quantity: number;
  unitPrice: string | null;
  notes: string | null;
  size: string | null;
  menu: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    is_active: boolean;
  } | null;
};

type CartClientProps = {
  items: ClientCartItem[];
  totalAmount: number;
  totalQuantity: number;
  hasInactiveItem: boolean;
  tableNumber: string | null;
  tables: { label: string }[];
};

export function CartClient({
  items,
  totalAmount,
  totalQuantity,
  hasInactiveItem,
  tableNumber,
  tables,
}: CartClientProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <TablePickerDialog
        tables={tables}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <CartItemRow item={item} />
          </li>
        ))}
      </ul>

      <hr className="border-t border-dashed border-border" />

      <CartSummary
        totalAmount={totalAmount}
        totalQuantity={totalQuantity}
        hasInactiveItem={hasInactiveItem}
        tableNumber={tableNumber}
        onCheckout={tableNumber ? undefined : () => setIsDialogOpen(true)}
      />
    </>
  );
}
