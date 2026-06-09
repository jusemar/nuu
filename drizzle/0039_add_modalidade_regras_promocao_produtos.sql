ALTER TABLE "regras_promocao_produtos"
ADD COLUMN IF NOT EXISTS "modalidade" text;

DROP INDEX IF EXISTS "regras_promocao_produtos_regra_produto_unique";

CREATE UNIQUE INDEX IF NOT EXISTS "regras_promocao_produtos_regra_produto_modalidade_unique"
ON "regras_promocao_produtos" (
  "regra_promocao_id",
  "produto_id",
  COALESCE("modalidade", '__todas__')
);

CREATE INDEX IF NOT EXISTS "regras_promocao_produtos_modalidade_idx"
ON "regras_promocao_produtos" ("modalidade");
