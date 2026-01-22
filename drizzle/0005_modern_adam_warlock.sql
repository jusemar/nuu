ALTER TABLE "product_image" ALTER COLUMN "external_image_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product_pricing" ALTER COLUMN "delivery_days" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "product_pricing" ALTER COLUMN "delivery_days" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "level" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "order_index" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "product_pricing" ADD COLUMN "main_card_price" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product_pricing" ADD COLUMN "promo_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "card_short_text" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "store_product_flags" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "canonical_url" text;--> statement-breakpoint
ALTER TABLE "product_gallery_images" ADD CONSTRAINT "product_gallery_images_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_parent_idx" ON "category" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "category_slug_idx" ON "category" USING btree ("slug");