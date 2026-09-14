CREATE TYPE "public"."modo_disponibilidade_entrega_propria" AS ENUM('herdar', 'ativado', 'desativado');--> statement-breakpoint
CREATE TABLE "category_own_delivery_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" uuid NOT NULL,
	"destination_type" varchar(20) NOT NULL,
	"region_id" integer,
	"bairro_id" integer,
	"cep_especifico_id" integer,
	"city_id" integer,
	"shipping_price" integer NOT NULL,
	"rapid_delivery_active" boolean DEFAULT true NOT NULL,
	"delivery_deadline" text,
	"scheduled_delivery_active" boolean DEFAULT false NOT NULL,
	"scheduled_delivery_min_days" integer,
	"scheduled_delivery_price" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_own_delivery_prices_destino_check" CHECK (("category_own_delivery_prices"."destination_type" = 'region' AND "category_own_delivery_prices"."region_id" IS NOT NULL AND "category_own_delivery_prices"."bairro_id" IS NULL AND "category_own_delivery_prices"."cep_especifico_id" IS NULL AND "category_own_delivery_prices"."city_id" IS NULL) OR ("category_own_delivery_prices"."destination_type" = 'bairro' AND "category_own_delivery_prices"."region_id" IS NULL AND "category_own_delivery_prices"."bairro_id" IS NOT NULL AND "category_own_delivery_prices"."cep_especifico_id" IS NULL AND "category_own_delivery_prices"."city_id" IS NULL) OR ("category_own_delivery_prices"."destination_type" = 'cep-especifico' AND "category_own_delivery_prices"."region_id" IS NULL AND "category_own_delivery_prices"."bairro_id" IS NULL AND "category_own_delivery_prices"."cep_especifico_id" IS NOT NULL AND "category_own_delivery_prices"."city_id" IS NULL) OR ("category_own_delivery_prices"."destination_type" = 'cidade' AND "category_own_delivery_prices"."region_id" IS NULL AND "category_own_delivery_prices"."bairro_id" IS NULL AND "category_own_delivery_prices"."cep_especifico_id" IS NULL AND "category_own_delivery_prices"."city_id" IS NOT NULL)),
	CONSTRAINT "category_own_delivery_prices_valores_check" CHECK ("category_own_delivery_prices"."shipping_price" >= 0 AND ("category_own_delivery_prices"."scheduled_delivery_price" IS NULL OR "category_own_delivery_prices"."scheduled_delivery_price" >= 0) AND ("category_own_delivery_prices"."scheduled_delivery_min_days" IS NULL OR "category_own_delivery_prices"."scheduled_delivery_min_days" >= 0) AND (NOT "category_own_delivery_prices"."scheduled_delivery_active" OR ("category_own_delivery_prices"."scheduled_delivery_price" IS NOT NULL AND "category_own_delivery_prices"."scheduled_delivery_min_days" IS NOT NULL)))
);
--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "disponibilidade_entrega_propria" "modo_disponibilidade_entrega_propria" DEFAULT 'herdar' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "disponibilidade_entrega_propria" "modo_disponibilidade_entrega_propria";--> statement-breakpoint
ALTER TABLE "category_own_delivery_prices" ADD CONSTRAINT "category_own_delivery_prices_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_own_delivery_prices" ADD CONSTRAINT "category_own_delivery_prices_region_id_shipping_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."shipping_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_own_delivery_prices" ADD CONSTRAINT "category_own_delivery_prices_bairro_id_bairros_entrega_propria_id_fk" FOREIGN KEY ("bairro_id") REFERENCES "public"."bairros_entrega_propria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_own_delivery_prices" ADD CONSTRAINT "category_own_delivery_prices_cep_especifico_id_ceps_especificos_id_fk" FOREIGN KEY ("cep_especifico_id") REFERENCES "public"."ceps_especificos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_own_delivery_prices" ADD CONSTRAINT "category_own_delivery_prices_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_own_delivery_prices_category_idx" ON "category_own_delivery_prices" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "category_own_delivery_prices_category_region_uidx" ON "category_own_delivery_prices" USING btree ("category_id","region_id") WHERE "category_own_delivery_prices"."destination_type" = 'region';--> statement-breakpoint
CREATE UNIQUE INDEX "category_own_delivery_prices_category_bairro_uidx" ON "category_own_delivery_prices" USING btree ("category_id","bairro_id") WHERE "category_own_delivery_prices"."destination_type" = 'bairro';--> statement-breakpoint
CREATE UNIQUE INDEX "category_own_delivery_prices_category_cep_uidx" ON "category_own_delivery_prices" USING btree ("category_id","cep_especifico_id") WHERE "category_own_delivery_prices"."destination_type" = 'cep-especifico';--> statement-breakpoint
CREATE UNIQUE INDEX "category_own_delivery_prices_category_cidade_uidx" ON "category_own_delivery_prices" USING btree ("category_id","city_id") WHERE "category_own_delivery_prices"."destination_type" = 'cidade';