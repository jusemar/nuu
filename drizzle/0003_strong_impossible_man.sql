ALTER TABLE "product_image" RENAME COLUMN "cloudinary_public_id" TO "external_image_id";--> statement-breakpoint
ALTER TABLE "product_image" ALTER COLUMN "sort_order" DROP DEFAULT;