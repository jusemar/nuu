CREATE TABLE IF NOT EXISTS "regras_promocao_categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regra_promocao_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"valor_desconto" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regras_promocao_marcas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regra_promocao_id" uuid NOT NULL,
	"marca_id" uuid NOT NULL,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"valor_desconto" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regras_promocao_subtotais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regra_promocao_id" uuid NOT NULL,
	"subtotal_minimo" integer NOT NULL,
	"subtotal_maximo" integer,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"valor_desconto" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'regras_promocao_categorias_regra_promocao_id_regras_promocao_id_fk'
	) THEN
		ALTER TABLE "regras_promocao_categorias"
		ADD CONSTRAINT "regras_promocao_categorias_regra_promocao_id_regras_promocao_id_fk"
		FOREIGN KEY ("regra_promocao_id") REFERENCES "public"."regras_promocao"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'regras_promocao_categorias_categoria_id_category_id_fk'
	) THEN
		ALTER TABLE "regras_promocao_categorias"
		ADD CONSTRAINT "regras_promocao_categorias_categoria_id_category_id_fk"
		FOREIGN KEY ("categoria_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'regras_promocao_marcas_regra_promocao_id_regras_promocao_id_fk'
	) THEN
		ALTER TABLE "regras_promocao_marcas"
		ADD CONSTRAINT "regras_promocao_marcas_regra_promocao_id_regras_promocao_id_fk"
		FOREIGN KEY ("regra_promocao_id") REFERENCES "public"."regras_promocao"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'regras_promocao_marcas_marca_id_marca_id_fk'
	) THEN
		ALTER TABLE "regras_promocao_marcas"
		ADD CONSTRAINT "regras_promocao_marcas_marca_id_marca_id_fk"
		FOREIGN KEY ("marca_id") REFERENCES "public"."marca"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'regras_promocao_subtotais_regra_promocao_id_regras_promocao_id_fk'
	) THEN
		ALTER TABLE "regras_promocao_subtotais"
		ADD CONSTRAINT "regras_promocao_subtotais_regra_promocao_id_regras_promocao_id_fk"
		FOREIGN KEY ("regra_promocao_id") REFERENCES "public"."regras_promocao"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regras_promocao_categorias_valor_desconto_nao_negativo') THEN
		ALTER TABLE "regras_promocao_categorias"
		ADD CONSTRAINT "regras_promocao_categorias_valor_desconto_nao_negativo" CHECK ("valor_desconto" >= 0);
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regras_promocao_marcas_valor_desconto_nao_negativo') THEN
		ALTER TABLE "regras_promocao_marcas"
		ADD CONSTRAINT "regras_promocao_marcas_valor_desconto_nao_negativo" CHECK ("valor_desconto" >= 0);
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regras_promocao_subtotais_valores_validos') THEN
		ALTER TABLE "regras_promocao_subtotais"
		ADD CONSTRAINT "regras_promocao_subtotais_valores_validos" CHECK (
			"valor_desconto" >= 0
			AND "subtotal_minimo" >= 0
			AND ("subtotal_maximo" IS NULL OR "subtotal_maximo" > "subtotal_minimo")
		);
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "regras_promocao_categorias_regra_categoria_unique"
ON "regras_promocao_categorias" ("regra_promocao_id","categoria_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regras_promocao_categorias_regra_promocao_id_idx"
ON "regras_promocao_categorias" ("regra_promocao_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regras_promocao_categorias_categoria_id_idx"
ON "regras_promocao_categorias" ("categoria_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "regras_promocao_marcas_regra_marca_unique"
ON "regras_promocao_marcas" ("regra_promocao_id","marca_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regras_promocao_marcas_regra_promocao_id_idx"
ON "regras_promocao_marcas" ("regra_promocao_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regras_promocao_marcas_marca_id_idx"
ON "regras_promocao_marcas" ("marca_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regras_promocao_subtotais_regra_promocao_id_idx"
ON "regras_promocao_subtotais" ("regra_promocao_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regras_promocao_subtotais_faixa_idx"
ON "regras_promocao_subtotais" ("subtotal_minimo","subtotal_maximo");
