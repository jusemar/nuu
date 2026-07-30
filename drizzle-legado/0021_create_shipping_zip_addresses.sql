CREATE TABLE "shipping_zip_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"cep" varchar(8) NOT NULL,
	"street" text DEFAULT '' NOT NULL,
	"complement" text,
	"neighborhood" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"ibge_code" varchar(20),
	"source" varchar(40) DEFAULT 'external' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "shipping_zip_addresses_cep_idx" ON "shipping_zip_addresses" ("cep");
CREATE INDEX "shipping_zip_addresses_city_state_idx" ON "shipping_zip_addresses" ("state","city");
CREATE INDEX "shipping_zip_addresses_neighborhood_idx" ON "shipping_zip_addresses" ("neighborhood");
