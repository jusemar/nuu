CREATE TABLE "bairros_avulsos" (
	"id" serial PRIMARY KEY NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"base_shipping_price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ceps_especificos" (
	"id" serial PRIMARY KEY NOT NULL,
	"cep" varchar(8) NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"shipping_price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ceps_especificos_cep_unique" UNIQUE("cep")
);
--> statement-breakpoint
CREATE TABLE "regiao_bairros" (
	"id" serial PRIMARY KEY NOT NULL,
	"regiao_id" integer NOT NULL,
	"neighborhood" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_bairro_avulso_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"bairro_avulso_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_region_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"base_shipping_price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "regiao_bairros" ADD CONSTRAINT "regiao_bairros_regiao_id_shipping_regions_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "public"."shipping_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_bairro_avulso_slots" ADD CONSTRAINT "shipping_bairro_avulso_slots_bairro_avulso_id_bairros_avulsos_id_fk" FOREIGN KEY ("bairro_avulso_id") REFERENCES "public"."bairros_avulsos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_region_slots" ADD CONSTRAINT "shipping_region_slots_region_id_shipping_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."shipping_regions"("id") ON DELETE cascade ON UPDATE no action;