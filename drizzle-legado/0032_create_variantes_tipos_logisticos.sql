CREATE TABLE IF NOT EXISTS "variantes_tipos_logisticos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variante_id" uuid NOT NULL,
	"tipo_logistico_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint c
		JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
		WHERE c.conrelid = 'public.variantes_tipos_logisticos'::regclass
			AND c.contype = 'f'
			AND a.attname = 'variante_id'
	) THEN
		ALTER TABLE "variantes_tipos_logisticos"
		ADD CONSTRAINT "variantes_tipos_logisticos_variante_id_product_variant_id_fk"
		FOREIGN KEY ("variante_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint c
		JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
		WHERE c.conrelid = 'public.variantes_tipos_logisticos'::regclass
			AND c.contype = 'f'
			AND a.attname = 'tipo_logistico_id'
	) THEN
		ALTER TABLE "variantes_tipos_logisticos"
		ADD CONSTRAINT "variantes_tipos_logisticos_tipo_logistico_id_tipos_logisticos_id_fk"
		FOREIGN KEY ("tipo_logistico_id") REFERENCES "public"."tipos_logisticos"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "variantes_tipos_logisticos_variante_tipo_unique"
ON "variantes_tipos_logisticos" ("variante_id","tipo_logistico_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variantes_tipos_logisticos_variante_id_idx"
ON "variantes_tipos_logisticos" ("variante_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variantes_tipos_logisticos_tipo_logistico_id_idx"
ON "variantes_tipos_logisticos" ("tipo_logistico_id");
