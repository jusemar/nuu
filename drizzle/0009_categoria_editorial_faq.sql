ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "description_bottom" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category_faq" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "order_index" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "category_faq_order_index_nao_negativo" CHECK ("order_index" >= 0),
  CONSTRAINT "category_faq_category_id_category_id_fk"
    FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_faq_category_id_idx" ON "category_faq" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_faq_category_order_idx" ON "category_faq" USING btree ("category_id", "order_index", "id");
