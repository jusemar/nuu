ALTER TABLE "regras_promocao_fretes_gratis"
ADD COLUMN IF NOT EXISTS "transportadora_codigo" text,
ADD COLUMN IF NOT EXISTS "servico_codigo" text;

CREATE INDEX IF NOT EXISTS "regras_promocao_fretes_gratis_transportadora_codigo_idx"
ON "regras_promocao_fretes_gratis" ("transportadora_codigo");

CREATE INDEX IF NOT EXISTS "regras_promocao_fretes_gratis_servico_codigo_idx"
ON "regras_promocao_fretes_gratis" ("servico_codigo");
