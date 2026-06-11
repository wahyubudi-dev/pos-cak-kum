type FireStackProps = {
  /** Whether this menu is featured/recommended */
  isFeatured: boolean;
};

/**
 * Stacked fire emojis 🔥🔥🔥 for recommended menu items.
 * Positioned as a floating badge on the top-right of a menu card.
 * The emojis overlap slightly for a compact "stacking" look.
 */
export function FireStack({ isFeatured }: FireStackProps) {
  if (!isFeatured) return null;

  return (
    <div
      className="absolute -top-1 -right-1 z-10 flex items-center"
      aria-label="Menu rekomendasi"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm"
          style={{
            marginLeft: i === 0 ? 0 : "-8px",
            zIndex: 3 - i,
            position: "relative",
          }}
        >
          <span className="text-sm leading-none" aria-hidden="true">
            🔥
          </span>
        </span>
      ))}
    </div>
  );
}
