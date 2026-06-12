"use client";

import { cn } from "@/lib/utils";

type CategoryTab = {
  id: string;
  name: string;
};

type CategoryTabsProps = {
  categories: CategoryTab[];
  hasFeatured?: boolean;
  activeId: string;
  onChange: (id: string) => void;
};

const FEATURED_TAB: CategoryTab = { id: "rekomendasi", name: "Rekomendasi" };

/**
 * Sticky horizontal pill strip for category filter.
 * "Rekomendasi" is prepended when hasFeatured=true.
 * Click → smooth-scroll to matching section.
 * Active chip tracks scroll via IntersectionObserver.
 */
export function CategoryTabs({
  categories,
  hasFeatured = false,
  activeId,
  onChange,
}: CategoryTabsProps) {
  const allTabs: CategoryTab[] = hasFeatured
    ? [FEATURED_TAB, ...categories]
    : categories;

  if (allTabs.length === 0) return null;

  return (
    <nav
      aria-label="Kategori menu"
      className="sticky top-[65px] z-20 border-b border-border bg-white/90 px-4 pt-2 pb-4 backdrop-blur-sm"
    >
      <ul
        className="flex gap-2 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {allTabs.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <li key={tab.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[10px] font-medium transition-all duration-200",
                  isActive
                    ? "text-white"
                    : "border border-border bg-card text-muted-foreground hover:bg-pearl hover:text-foreground",
                )}
                style={
                  isActive
                    ? {
                        background: "var(--color-brand-teal)",
                        color: "#fff",
                      }
                    : undefined
                }
              >
                {tab.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
