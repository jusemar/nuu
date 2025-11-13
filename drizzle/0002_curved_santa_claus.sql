CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"meta_title" text,
	"meta_description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_attribute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"values" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_variant_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"alt_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"type" text NOT NULL,
	"price_in_cents" integer NOT NULL,
	"delivery_days" integer NOT NULL,
	"has_promo" boolean DEFAULT false,
	"promo_type" text,
	"promo_price_in_cents" integer,
	"promo_duration" integer,
	"promo_duration_unit" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variant_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "admin_categories" CASCADE;--> statement-breakpoint
ALTER TABLE "product_variant" DROP CONSTRAINT "product_variant_slug_unique";--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variant" ALTER COLUMN "image_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "sku" text DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "product_type" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "product_code" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "ncm_code" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "status" text DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "collection" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "cost_price_in_cents" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "sale_price_in_cents" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "promo_price_in_cents" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "tax_rate" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "weight_in_grams" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "length_in_cm" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "width_in_cm" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "height_in_cm" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "has_free_shipping" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "has_local_pickup" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "warranty_period_in_days" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "warranty_provider" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "seller_code" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "internal_code" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "seller_info" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "sku" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "compare_price_in_cents" integer;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "cost_price_in_cents" integer;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "stock_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "weight_in_grams" integer;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "length_in_cm" integer;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "width_in_cm" integer;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "height_in_cm" integer;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_attribute" ADD CONSTRAINT "product_attribute_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_product_variant_id_product_variant_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_pricing" ADD CONSTRAINT "product_pricing_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_image" ADD CONSTRAINT "product_variant_image_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "product_variant" DROP COLUMN "color";--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_sku_unique" UNIQUE("sku");