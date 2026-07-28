ALTER TABLE "product_own_delivery_prices"
ADD COLUMN IF NOT EXISTS "city_id" integer;
--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices"
ADD CONSTRAINT "product_own_delivery_prices_city_id_cities_id_fk"
FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id")
ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_own_delivery_prices_product_city_idx"
ON "product_own_delivery_prices" ("product_id", "city_id")
WHERE "destination_type" = 'cidade' AND "city_id" IS NOT NULL;
