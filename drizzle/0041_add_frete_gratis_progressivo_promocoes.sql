CREATE TYPE "promocao_tipo_beneficio" AS ENUM ('desconto', 'frete_gratis');

ALTER TABLE "regras_promocao"
ADD COLUMN IF NOT EXISTS "tipo_beneficio" "promocao_tipo_beneficio" NOT NULL DEFAULT 'desconto';

CREATE INDEX IF NOT EXISTS "regras_promocao_tipo_beneficio_idx"
ON "regras_promocao" ("tipo_beneficio");

CREATE TABLE IF NOT EXISTS "regras_promocao_fretes_gratis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "regra_promocao_id" uuid NOT NULL REFERENCES "regras_promocao"("id") ON DELETE cascade,
  "subtotal_minimo" integer NOT NULL,
  "modalidade" text,
  "mensagem_progressiva" text,
  "regiao_codigo" text,
  "criado_em" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "regras_promocao_fretes_gratis_regra_promocao_id_idx"
ON "regras_promocao_fretes_gratis" ("regra_promocao_id");

CREATE INDEX IF NOT EXISTS "regras_promocao_fretes_gratis_subtotal_idx"
ON "regras_promocao_fretes_gratis" ("subtotal_minimo");

CREATE INDEX IF NOT EXISTS "regras_promocao_fretes_gratis_modalidade_idx"
ON "regras_promocao_fretes_gratis" ("modalidade");
