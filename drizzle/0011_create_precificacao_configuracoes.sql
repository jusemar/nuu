DO $$ BEGIN
  CREATE TYPE "public"."precificacao_tipo_regra_promocional" AS ENUM(
    'percentual_desconto',
    'valor_fixo_desconto',
    'preco_fixo'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."precificacao_alvo_regra_promocional" AS ENUM(
    'global',
    'produto',
    'categoria'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "configuracoes_pagamento" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" text NOT NULL,
  "ativo" boolean NOT NULL DEFAULT true,
  "pix_ativo" boolean NOT NULL DEFAULT true,
  "cartao_ativo" boolean NOT NULL DEFAULT true,
  "boleto_ativo" boolean NOT NULL DEFAULT false,
  "percentual_acrescimo_cartao_bps" integer NOT NULL DEFAULT 1500,
  "parcelas_sem_juros" integer NOT NULL DEFAULT 3,
  "taxa_juros_mensal_bps" integer NOT NULL DEFAULT 199,
  "maximo_parcelas" integer NOT NULL DEFAULT 10,
  "valor_minimo_parcela_em_centavos" integer NOT NULL DEFAULT 500,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "regras_promocionais_precificacao" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" text NOT NULL,
  "ativo" boolean NOT NULL DEFAULT true,
  "prioridade" integer NOT NULL DEFAULT 0,
  "tipo" "precificacao_tipo_regra_promocional" NOT NULL,
  "alvo" "precificacao_alvo_regra_promocional" NOT NULL DEFAULT 'global',
  "valor_bps" integer,
  "valor_em_centavos" integer,
  "produto_id" uuid,
  "categoria_id" uuid,
  "inicio_em" timestamp,
  "fim_em" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "regras_promocionais_precificacao_produto_id_product_id_fk"
    FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "regras_promocionais_precificacao_categoria_id_category_id_fk"
    FOREIGN KEY ("categoria_id") REFERENCES "public"."category"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "configuracoes_pagamento_ativo_idx" ON "configuracoes_pagamento" ("ativo");
CREATE INDEX IF NOT EXISTS "regras_promocionais_precificacao_ativo_idx" ON "regras_promocionais_precificacao" ("ativo");
CREATE INDEX IF NOT EXISTS "regras_promocionais_precificacao_produto_id_idx" ON "regras_promocionais_precificacao" ("produto_id");
CREATE INDEX IF NOT EXISTS "regras_promocionais_precificacao_categoria_id_idx" ON "regras_promocionais_precificacao" ("categoria_id");

INSERT INTO "configuracoes_pagamento" (
  "nome",
  "ativo",
  "pix_ativo",
  "cartao_ativo",
  "boleto_ativo",
  "percentual_acrescimo_cartao_bps",
  "parcelas_sem_juros",
  "taxa_juros_mensal_bps",
  "maximo_parcelas",
  "valor_minimo_parcela_em_centavos"
)
SELECT
  'Configuração padrão',
  true,
  true,
  true,
  false,
  1500,
  3,
  199,
  10,
  500
WHERE NOT EXISTS (
  SELECT 1 FROM "configuracoes_pagamento" WHERE "ativo" = true
);
