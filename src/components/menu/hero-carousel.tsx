"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { Banner } from "@/lib/db/schema";

type HeroCarouselProps = {
  banners: Banner[];
};

/**
 * Hero carousel — native scroll-snap for reliable mobile responsiveness.
 * Supports two display modes:
 *   - "content": bg color + headline + description + optional CTA
 *   - "image": full-bleed image
 * Highlight adds a teal ring glow effect.
 */
export function HeroCarousel({ banners }: HeroCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function onScroll() {
      if (!track) return;
      const scrollLeft = track.scrollLeft;
      const itemWidth = track.firstElementChild?.clientWidth ?? 1;
      const gap = 12;
      const index = Math.round(scrollLeft / (itemWidth + gap));
      setActiveIndex(index);
    }

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  if (banners.length === 0) return null;

  return (
    <div className="mx-auto max-w-lg">
      {/* Scrollable track */}
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          scrollPaddingLeft: "16px",
          scrollPaddingRight: "16px",
        }}
        aria-label="Promo hari ini"
      >
        {banners.map((banner, index) => (
          <BannerSlide
            key={banner.id}
            banner={banner}
            eager={index === 0}
          />
        ))}
      </div>

      {/* Pagination dots */}
      {banners.length > 1 ? (
        <div
          className="mt-3 flex items-center justify-center gap-1.5"
          role="tablist"
          aria-label="Navigasi banner"
        >
          {banners.map((banner, i) => (
            <span
              key={banner.id}
              role="tab"
              aria-selected={activeIndex === i}
              aria-label={`Banner ${i + 1}`}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: activeIndex === i ? "18px" : "6px",
                background:
                  activeIndex === i
                    ? "var(--color-brand-teal)"
                    : "var(--color-mist)",
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BannerSlide({
  banner,
  eager = false,
}: {
  banner: Banner;
  eager?: boolean;
}) {
  const isImage = banner.displayMode === "image" && banner.imageUrl;
  const hasCta = banner.ctaText && banner.ctaHref;

  const highlightClass = banner.isHighlighted
    ? "ring-2 ring-[var(--color-brand-teal)] ring-offset-2"
    : "";

  // Image mode — full bleed
  if (isImage) {
    const content = (
      <div
        className={`relative flex w-[calc(100%-48px)] min-w-[260px] max-w-[380px] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[72%] sm:rounded-3xl ${highlightClass}`}
        style={{ minHeight: "150px", aspectRatio: "16/8" }}
      >
        <Image
          src={banner.imageUrl!}
          alt={banner.title}
          fill
          loading={eager ? "eager" : undefined}
          sizes="(min-width: 640px) 380px, 80vw"
          className="object-cover"
        />
      </div>
    );

    if (hasCta) {
      return (
        <Link href={banner.ctaHref!} className="contents">
          {content}
        </Link>
      );
    }
    return content;
  }

  // Content mode — text + bg color + optional image
  const content = (
    <div
      className={`relative flex w-[calc(100%-48px)] min-w-[260px] max-w-[380px] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[72%] sm:rounded-3xl ${highlightClass} pr-6`}
      style={{
        background: banner.bgColor,
        minHeight: "170px",
      }}
    >
      {/* Text content */}
      <div className="flex flex-1 flex-col justify-between px-6 py-6 sm:py-7">
        <div className="flex flex-col gap-2 pr-2">
          <h2 className="font-display text-[18px] font-semibold text-foreground sm:text-xl">
            {banner.title}
          </h2>
          {banner.description ? (
            <p className="text-[12px] text-muted-foreground sm:text-[13px]">
              {banner.description}
            </p>
          ) : null}
        </div>

        {/* CTA button */}
        {hasCta ? (
          <div className="mt-3">
            <span
              className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold text-white"
              style={{ background: "var(--color-brand-teal)" }}
            >
              {banner.ctaText}
            </span>
          </div>
        ) : null}
      </div>

      {/* Optional image on the right side */}
      {banner.imageUrl ? (
        <div className="relative w-[130px] shrink-0 self-stretch sm:w-[150px]">
          <Image
            src={banner.imageUrl}
            alt=""
            fill
            loading={eager ? "eager" : undefined}
            sizes="150px"
            className="object-contain object-center"
          />
        </div>
      ) : null}
    </div>
  );

  if (hasCta) {
    return (
      <Link href={banner.ctaHref!} className="contents">
        {content}
      </Link>
    );
  }
  return content;
}
