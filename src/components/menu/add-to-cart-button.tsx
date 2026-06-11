"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { addToCart } from "@/lib/cart/actions";

type AddToCartButtonProps = {
  menuId: string;
  menuName: string;
  /** True when the viewer is signed in. Anon users get bounced to /login. */
  isAuthenticated: boolean;
  /** Path to return to after login, including the table query param. */
  returnPath: string;
};

/**
 * Add-to-cart button on each menu card.
 * 44px min tap target. Filled teal circle with "+" at rest.
 * Shows checkmark briefly after success.
 */
export function AddToCartButton({
  menuId,
  menuName,
  isAuthenticated,
  returnPath,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${encodeURIComponent(returnPath)}`);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("menu_id", menuId);
      formData.set("quantity", "1");

      const result = await addToCart(formData);
      if (result.ok) {
        toast.success(`${menuName} ditambahkan`);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1500);
      } else {
        toast.error(result.message ?? "Gagal menambahkan");
      }
    });
  }

  const isSuccess = justAdded && !isPending;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={`Tambahkan ${menuName} ke keranjang`}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 text-white transition-all duration-200 active:scale-95 disabled:opacity-60"
      style={{
        background: isSuccess
          ? "var(--color-leaf-soft)"
          : "var(--color-brand-teal)",
        minWidth: "44px",
        minHeight: "44px",
      }}
    >
      {isPending ? (
        /* Spinner */
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
          />
        </svg>
      ) : isSuccess ? (
        /* Checkmark */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        /* Plus */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
        </svg>
      )}
    </button>
  );
}
