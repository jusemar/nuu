ALTER TABLE "product_image" ALTER COLUMN "image_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product_pricing" ADD COLUMN "pricing_modal_description" text;