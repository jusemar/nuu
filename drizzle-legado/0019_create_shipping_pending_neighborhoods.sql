CREATE TABLE "shipping_pending_neighborhoods" (
	"id" serial PRIMARY KEY NOT NULL,
	"last_cep" varchar(8) NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"consultation_count" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_consulted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_pending_neighborhoods_neighborhood_city_state_idx" ON "shipping_pending_neighborhoods" USING btree ("neighborhood","city","state");
