ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_cart_id_menu_id_notes_unique";
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_cart_id_menu_id_notes_key";
ALTER TABLE "cart_items" ADD COLUMN "size" text;
ALTER TABLE "menus" ADD COLUMN "menu_sizes" json DEFAULT '[]'::json NOT NULL;
ALTER TABLE "order_items" ADD COLUMN "size" text;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_menu_id_size_notes_unique" UNIQUE("cart_id","menu_id","size","notes");
