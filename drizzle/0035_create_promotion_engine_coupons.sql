CREATE TABLE IF NOT EXISTS "cupons_promocao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"tipo_desconto" "promocao_tipo_desconto" NOT NULL,
	"valor_desconto" integer NOT NULL,
	"frete_gratis" boolean DEFAULT false NOT NULL,
	"prioridade" integer DEFAULT 0 NOT NULL,
	"acumulativo" boolean DEFAULT false NOT NULL,
	"subtotal_minimo" integer DEFAULT 0 NOT NULL,
	"limite_uso_total" integer,
	"limite_uso_por_cliente" integer,
	"total_usos" integer DEFAULT 0 NOT NULL,
	"data_inicio" timestamp NOT NULL,
	"data_fim" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usos_cupons_promocao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cupom_promocao_id" uuid NOT NULL,
	"cliente_id" uuid,
	"pedido_id" uuid,
	"codigo_cupom" text NOT NULL,
	"usado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'usos_cupons_promocao_cupom_promocao_id_cupons_promocao_id_fk'
	) THEN
		ALTER TABLE "usos_cupons_promocao"
		ADD CONSTRAINT "usos_cupons_promocao_cupom_promocao_id_cupons_promocao_id_fk"
		FOREIGN KEY ("cupom_promocao_id") REFERENCES "public"."cupons_promocao"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cupons_promocao_valores_validos') THEN
		ALTER TABLE "cupons_promocao"
		ADD CONSTRAINT "cupons_promocao_valores_validos" CHECK (
			"valor_desconto" >= 0
			AND "subtotal_minimo" >= 0
			AND ("limite_uso_total" IS NULL OR "limite_uso_total" > 0)
			AND ("limite_uso_por_cliente" IS NULL OR "limite_uso_por_cliente" > 0)
			AND "total_usos" >= 0
			AND ("data_fim" IS NULL OR "data_fim" > "data_inicio")
		);
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cupons_promocao_codigo_unique"
ON "cupons_promocao" ("codigo");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cupons_promocao_ativo_idx"
ON "cupons_promocao" ("ativo");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cupons_promocao_periodo_idx"
ON "cupons_promocao" ("data_inicio","data_fim");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cupons_promocao_prioridade_idx"
ON "cupons_promocao" ("prioridade");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usos_cupons_promocao_cupom_id_idx"
ON "usos_cupons_promocao" ("cupom_promocao_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usos_cupons_promocao_cliente_id_idx"
ON "usos_cupons_promocao" ("cliente_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usos_cupons_promocao_codigo_idx"
ON "usos_cupons_promocao" ("codigo_cupom");
