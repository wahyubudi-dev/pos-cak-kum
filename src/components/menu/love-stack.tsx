import { Heart } from "lucide-react";

import { popularityToLoveTier } from "@/lib/menus/popularity";

type LoveStackProps = {
  popularity: number;
};

/**
 * Stacked overlapping heart icons indicating menu popularity.
 * Tier 0 = nothing, Tier 1 = 1 heart, Tier 2 = 2 hearts, Tier 3 = 3 hearts.
 * Hearts overlap via negative margin for a stacked-chip effect.
 */
export function LoveStack({ popularity }: LoveStackProps) {
  const tier = popularityToLoveTier(popularity);
  if (tier === 0) return null;

  const hearts = Array.from({ length: tier });

  return (
    <div className="flex items-center" aria-label={`Popularitas: ${tier} dari 3`}>
      {hearts.map((_, i) => (
        <span
          key={i}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-card shadow-subtle"
          style={{
            marginLeft: i === 0 ? 0 : "-6px",
            zIndex: tier - i,
            position: "relative",
          }}
        >
          <Heart
            className="h-3 w-3"
            style={{ color: "var(--color-brand-teal)" }}
            fill="var(--color-brand-teal)"
            aria-hidden="true"
          />
        </span>
      ))}
    </div>
  );
}
