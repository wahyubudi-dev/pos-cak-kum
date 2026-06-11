-- Banners table for promotional carousel management
DO $$ BEGIN
  CREATE TYPE "public"."banner_display" AS ENUM('content', 'image');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "banners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "bg_color" text NOT NULL DEFAULT '#fff8e5',
  "image_url" text,
  "display_mode" "banner_display" NOT NULL DEFAULT 'content',
  "cta_text" text,
  "cta_href" text,
  "is_highlighted" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "banners_active_sort_idx" ON "banners" ("is_active", "sort_order");
