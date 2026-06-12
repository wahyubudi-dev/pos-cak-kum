import { BannersManager } from "@/components/admin/banners-manager";
import { getAllBannersForAdmin } from "@/lib/banners/queries";

export const metadata = { title: "Banner · Admin Kedai Cak Kum" };

export default async function AdminBannersPage() {
  const banners = await getAllBannersForAdmin();

  const mapped = banners.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    bg_color: b.bgColor,
    image_url: b.imageUrl,
    display_mode: b.displayMode,
    cta_text: b.ctaText,
    cta_href: b.ctaHref,
    is_highlighted: b.isHighlighted,
    is_active: b.isActive,
    sort_order: b.sortOrder,
  }));

  return (
    <div className="py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Banner Carousel
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Kelola banner promosi yang tampil di halaman menu pelanggan.
      </p>

      <div className="mt-7">
        <BannersManager banners={mapped} />
      </div>
    </div>
  );
}
