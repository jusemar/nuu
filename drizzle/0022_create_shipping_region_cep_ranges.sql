CREATE TABLE "shipping_region_cep_ranges" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" integer NOT NULL,
	"cep_start" varchar(8) NOT NULL,
	"cep_end" varchar(8) NOT NULL,
	"source" varchar(40) DEFAULT 'auto' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "shipping_region_cep_ranges"
ADD CONSTRAINT "shipping_region_cep_ranges_region_id_shipping_regions_id_fk"
FOREIGN KEY ("region_id") REFERENCES "public"."shipping_regions"("id")
ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "shipping_region_cep_ranges_region_start_end_idx"
ON "shipping_region_cep_ranges" ("region_id","cep_start","cep_end");

CREATE INDEX "shipping_region_cep_ranges_start_end_idx"
ON "shipping_region_cep_ranges" ("cep_start","cep_end");
