"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { CategoryTabs } from "@/components/menu/category-tabs";
import { MenuSections } from "@/components/menu/menu-sections";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/db/schema";
import type { MenuWithPopularity } from "@/lib/menus/queries";

type CategoryWithPopularMenus = Category & {
  menus: MenuWithPopularity[];
};

type MenuBrowserProps = {
  categories: CategoryWithPopularMenus[];
  featuredMenus: MenuWithPopularity[];
  tableNumber: string | null;
};

export function MenuBrowser({
  categories,
  featuredMenus,
  tableNumber,
}: MenuBrowserProps) {
  const [activeTab, setActiveTab] = useState<string>(
    featuredMenus.length > 0 ? "rekomendasi" : (categories[0]?.id ?? ""),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const categoryTabs = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const activeCategoryId = activeTab === "rekomendasi" ? undefined : activeTab;

  return (
    <div>
      <CategoryTabs
        categories={categoryTabs}
        hasFeatured={featuredMenus.length > 0}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      <div className="px-5 pt-4 sm:px-6">
        <label htmlFor="menu-search" className="sr-only">
          Cari menu
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="menu-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari menu atau deskripsi"
            className="h-9 rounded-full border-border bg-card pl-9 text-[12px] placeholder:text-[12px]"
          />
        </div>
      </div>

      <div className="pt-4">
        <MenuSections
          categories={categories}
          featuredMenus={featuredMenus}
          tableNumber={tableNumber}
          activeCategoryId={activeCategoryId}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
