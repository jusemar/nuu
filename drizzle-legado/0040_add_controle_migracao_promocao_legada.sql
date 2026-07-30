ALTER TABLE "product_pricing"
ADD COLUMN IF NOT EXISTS "legado_promocao_migrado_em" timestamp,
ADD COLUMN IF NOT EXISTS "legado_promocao_migrado_para_regra_id" uuid;

CREATE INDEX IF NOT EXISTS "product_pricing_legado_promocao_migrado_em_idx"
ON "product_pricing" ("legado_promocao_migrado_em");

CREATE INDEX IF NOT EXISTS "product_pricing_legado_promocao_migrado_para_regra_id_idx"
ON "product_pricing" ("legado_promocao_migrado_para_regra_id");
