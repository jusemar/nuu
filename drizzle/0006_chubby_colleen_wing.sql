CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"state_uf" varchar(2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"neighborhoods_count" integer DEFAULT 0 NOT NULL,
	"has_slots_configured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"description" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"price_config" jsonb NOT NULL,
	"min_days" integer DEFAULT 0 NOT NULL,
	"max_days" integer DEFAULT 0 NOT NULL,
	"cutoff_times" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allows_scheduling" boolean DEFAULT false NOT NULL,
	"operating_days" jsonb DEFAULT '[1,2,3,4,5,6]'::jsonb NOT NULL,
	"max_weight" numeric(8, 2),
	"max_dimensions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neighborhoods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"city_id" integer NOT NULL,
	"city_name" varchar(100) NOT NULL,
	"state_uf" varchar(2) NOT NULL,
	"cep_range" jsonb NOT NULL,
	"delivery_slots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"has_active_slots" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"total_deliveries" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_delivery_methods" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_delivery_methods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" uuid NOT NULL,
	"delivery_method_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"custom_price_in_cents" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_suppliers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_suppliers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" uuid NOT NULL,
	"supplier_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"rules" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"uf" varchar(2) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "states_uf_unique" UNIQUE("uf")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"delivery_config" jsonb NOT NULL,
	"served_regions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"linked_products_count" integer DEFAULT 0 NOT NULL,
	"contact_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "allowed_delivery_types" text[] DEFAULT '{"own"}';--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "allows_own_delivery" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "allows_supplier_delivery" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "allows_pickup" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "requires_carrier_only" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "preferred_supplier_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "allowed_delivery_method_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "additional_delivery_days" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_uf_states_uf_fk" FOREIGN KEY ("state_uf") REFERENCES "public"."states"("uf") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neighborhoods" ADD CONSTRAINT "neighborhoods_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_delivery_methods" ADD CONSTRAINT "product_delivery_methods_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_delivery_methods" ADD CONSTRAINT "product_delivery_methods_delivery_method_id_delivery_methods_id_fk" FOREIGN KEY ("delivery_method_id") REFERENCES "public"."delivery_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;