/**
 * Format a numeric value as Indonesian Rupiah (IDR).
 *
 * Uses Intl.NumberFormat with the id-ID locale so output matches local
 * conventions: "Rp 25.000" rather than "Rp25,000". Decimals are dropped
 * by default — Rupiah is rarely shown to two places in a POS context.
 */
export function formatRupiah(amount: number, options?: { withDecimals?: boolean }): string {
  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: options?.withDecimals ? 2 : 0,
    maximumFractionDigits: options?.withDecimals ? 2 : 0,
  });

  return formatter.format(amount);
}
