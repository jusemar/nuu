CREATE TABLE "product_own_delivery_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"destination_type" varchar(20) NOT NULL,
	"region_id" integer,
	"bairro_avulso_id" integer,
	"cep_especifico_id" integer,
	"shipping_price" integer NOT NULL,
	"delivery_deadline" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD CONSTRAINT "product_own_delivery_prices_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD CONSTRAINT "product_own_delivery_prices_region_id_shipping_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."shipping_regions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD CONSTRAINT "product_own_delivery_prices_bairro_avulso_id_bairros_avulsos_id_fk" FOREIGN KEY ("bairro_avulso_id") REFERENCES "public"."bairros_avulsos"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD CONSTRAINT "product_own_delivery_prices_cep_especifico_id_ceps_especificos_id_fk" FOREIGN KEY ("cep_especifico_id") REFERENCES "public"."ceps_especificos"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "product_own_delivery_prices_product_region_idx" ON "product_own_delivery_prices" ("product_id","region_id") WHERE "destination_type" = 'region' AND "region_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "product_own_delivery_prices_product_bairro_idx" ON "product_own_delivery_prices" ("product_id","bairro_avulso_id") WHERE "destination_type" = 'bairro-avulso' AND "bairro_avulso_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "product_own_delivery_prices_product_cep_idx" ON "product_own_delivery_prices" ("product_id","cep_especifico_id") WHERE "destination_type" = 'cep-especifico' AND "cep_especifico_id" IS NOT NULL;
