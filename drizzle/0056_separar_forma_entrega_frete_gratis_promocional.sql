ALTER TABLE "regras_promocao_fretes_gratis"
ADD COLUMN IF NOT EXISTS "forma_entrega" text;

UPDATE "regras_promocao_fretes_gratis"
SET
  "forma_entrega" = CASE "modalidade"
    WHEN 'entrega-propria' THEN 'entrega-propria'
    WHEN 'retirada' THEN 'retirada'
    WHEN 'frenet' THEN 'frete-externo'
    ELSE "forma_entrega"
  END,
  "modalidade" = CASE
    WHEN "modalidade" IN ('entrega-propria', 'retirada', 'frenet') THEN NULL
    ELSE "modalidade"
  END
WHERE "modalidade" IN ('entrega-propria', 'retirada', 'frenet');

UPDATE "regras_promocao_fretes_gratis"
SET "forma_entrega" = 'frete-externo'
WHERE "forma_entrega" IS NULL
  AND (
    "transportadora_codigo" IS NOT NULL
    OR "servico_codigo" IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS "regras_promocao_fretes_gratis_forma_entrega_idx"
ON "regras_promocao_fretes_gratis" ("forma_entrega");
