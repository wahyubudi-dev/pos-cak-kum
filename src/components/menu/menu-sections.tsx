import { MenuRow } from "@/components/menu/menu-row";
import type { MenuWithPopularity } from "@/lib/menus/queries";
import type { Category } from "@/lib/db/schema";

type CategoryWithPopularMenus = Category & {
  menus: MenuWithPopularity[];
};

type MenuSectionsProps = {
  categories: CategoryWithPopularMenus[];
  featuredMenus: MenuWithPopularity[];
  tableNumber: string | null;
  activeCategoryId?: string;
  searchQuery?: string;
};

/**
 * Vertical stack of filtered menu sections.
 * Supports category-level filtering plus client-side text search.
 */
export function MenuSections({
  categories,
  featuredMenus,
  tableNumber,
  activeCategoryId,
  searchQuery = "",
}: MenuSectionsProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesQuery = (value: string | null | undefined) =>
    !normalizedQuery || value?.toLowerCase().includes(normalizedQuery);

  const filteredFeaturedMenus = featuredMenus.filter(
    (menu) => matchesQuery(menu.name) || matchesQuery(menu.description),
  );

  const filteredCategories = categories
    .filter((category) => !activeCategoryId || category.id === activeCategoryId)
    .map((category) => ({
      ...category,
      menus: category.menus.filter(
        (menu) => matchesQuery(menu.name) || matchesQuery(menu.description),
      ),
    }))
    .filter((category) => category.menus.length > 0);

  const showFeaturedSection =
    !activeCategoryId && filteredFeaturedMenus.length > 0;

  if (!showFeaturedSection && filteredCategories.length === 0) {
    return <EmptyResults searchQuery={searchQuery} />;
  }

  return (
    <div className="flex flex-col gap-7 px-4">
      {/* Rekomendasi section — has a visible header */}
      {showFeaturedSection ? (
        <section
          id="category-rekomendasi"
          className="scroll-mt-32"
          aria-labelledby="heading-rekomendasi"
        >
          <SectionHeader
            id="heading-rekomendasi"
            title="Rekomendasi"
            caption="Pilihan terlaris di Kedai Cak Kum"
          />
          <div className="flex flex-col gap-3">
            {filteredFeaturedMenus.map((menu) => (
              <MenuRow
                key={menu.id}
                menu={menu}
                tableNumber={tableNumber}
                showFire
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Per-category sections */}
      {filteredCategories.map((category) => (
        <section
          key={category.id}
          id={`category-${category.id}`}
          className="scroll-mt-32"
          aria-labelledby={`heading-${category.id}`}
        >
          <SectionHeader id={`heading-${category.id}`} title={category.name} />
          <div className="flex flex-col gap-3">
            {category.menus.map((menu) => (
              <MenuRow key={menu.id} menu={menu} tableNumber={tableNumber} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyResults({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold text-foreground">
        Menu tidak ditemukan
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {searchQuery.trim()
          ? `Tidak ada hasil untuk \"${searchQuery.trim()}\".`
          : "Belum ada menu di kategori ini."}
      </p>
    </div>
  );
}

type SectionHeaderProps = {
  id: string;
  title: string;
  caption?: string;
};

function SectionHeader({ id, title, caption }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-0">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-5 w-1 shrink-0 rounded-full"
          style={{ background: "var(--color-brand-teal)" }}
        />
        <h2
          id={id}
          className="font-display text-[15px] font-semibold text-foreground"
          style={{ letterSpacing: "-0.02em" }}
        >
          {title}
        </h2>
      </div>
      {caption ? (
        <p className="pl-3 text-[11px] text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}
