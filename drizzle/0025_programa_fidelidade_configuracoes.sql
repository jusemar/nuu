CREATE TABLE "programa_fidelidade_configuracoes" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"nome_publico" text NOT NULL,
	"pontos_por_real" numeric(12, 4) NOT NULL,
	"pontos_conversao" numeric(18, 4) NOT NULL,
	"valor_credito_em_centavos" integer NOT NULL,
	"minimo_pontos_resgate" numeric(18, 4) NOT NULL,
	"meses_validade" integer,
	"versao" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programa_fidelidade_config_id_global" CHECK ("programa_fidelidade_configuracoes"."id" = 'global'),
	CONSTRAINT "programa_fidelidade_nome_publico_preenchido" CHECK (length(trim("programa_fidelidade_configuracoes"."nome_publico")) BETWEEN 1 AND 80),
	CONSTRAINT "programa_fidelidade_pontos_por_real_positivo" CHECK ("programa_fidelidade_configuracoes"."pontos_por_real" > 0),
	CONSTRAINT "programa_fidelidade_conversao_positiva" CHECK ("programa_fidelidade_configuracoes"."pontos_conversao" > 0),
	CONSTRAINT "programa_fidelidade_credito_positivo" CHECK ("programa_fidelidade_configuracoes"."valor_credito_em_centavos" > 0),
	CONSTRAINT "programa_fidelidade_resgate_nao_negativo" CHECK ("programa_fidelidade_configuracoes"."minimo_pontos_resgate" >= 0),
	CONSTRAINT "programa_fidelidade_validade_valida" CHECK ("programa_fidelidade_configuracoes"."meses_validade" IS NULL OR "programa_fidelidade_configuracoes"."meses_validade" > 0),
	CONSTRAINT "programa_fidelidade_versao_positiva" CHECK ("programa_fidelidade_configuracoes"."versao" > 0)
);
--> statement-breakpoint
CREATE TABLE "programa_fidelidade_regras_categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoria_id" uuid NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"pontos_por_real" numeric(12, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programa_fidelidade_regra_pontos_positivos" CHECK ("programa_fidelidade_regras_categorias"."pontos_por_real" IS NULL OR "programa_fidelidade_regras_categorias"."pontos_por_real" > 0)
);
--> statement-breakpoint
ALTER TABLE "programa_fidelidade_regras_categorias" ADD CONSTRAINT "programa_fidelidade_regras_categorias_categoria_id_category_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "programa_fidelidade_regra_categoria_unique" ON "programa_fidelidade_regras_categorias" USING btree ("categoria_id");