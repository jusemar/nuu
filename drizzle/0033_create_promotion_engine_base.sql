DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promocao_tipo_desconto') THEN
		CREATE TYPE "promocao_tipo_desconto" AS ENUM ('percentual', 'valor_fixo');
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promocao_status') THEN
		CREATE TYPE "promocao_status" AS ENUM ('ativa', 'inativa', 'agendada', 'encerrada');
	END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regras_promocao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"status" "promocao_status" DEFAULT 'inativa' NOT NULL,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"prioridade" integer DEFAULT 0 NOT NULL,
	"acumulativa" boolean DEFAULT false NOT NULL,
	"data_inicio" timestamp NOT NULL,
	"data_fim" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regras_promocao_produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regra_promocao_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"valor_desconto" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'regras_promocao_produtos_regra_promocao_id_regras_promocao_id_fk'
	) THEN
		ALTER TABLE "regras_promocao_produtos"
		ADD CONSTRAINT "regras_promocao_produtos_regra_promocao_id_regras_promocao_id_fk"
		FOREIGN KEY ("regra_promocao_id") REFERENCES "public"."regras_promocao"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'regras_promocao_produtos_produto_id_product_id_fk'
	) THEN
		ALTER TABLE "regras_promocao_produtos"
		ADD CONSTRAINT "regras_promocao_produtos_produto_id_product_id_fk"
		FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'regras_promocao_valor_desconto_nao_negativo'
	) THEN
		ALTER TABLE "regras_promocao_produtos"
		ADD CONSTRAINT "regras_promocao_valor_desconto_nao_negativo"
		CHECK ("valor_desconto" >= 0);
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "regras_promocao_slug_unique"
ON "regras_promocao" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regras_promocao_status_idx"
ON "regras_promocao" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regras_promocao_periodo_idx"
ON "regras_promocao" ("data_inicio","data_fim");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regras_promocao_prioridade_idx"
ON "regras_promocao" ("prioridade");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "regras_promocao_produtos_regra_produto_unique"
ON "regras_promocao_produtos" ("regra_promocao_id","produto_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regras_promocao_produtos_regra_promocao_id_idx"
ON "regras_promocao_produtos" ("regra_promocao_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regras_promocao_produtos_produto_id_idx"
ON "regras_promocao_produtos" ("produto_id");
