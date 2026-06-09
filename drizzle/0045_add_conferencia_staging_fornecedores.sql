ALTER TABLE "fornecedor_produtos_staging"
ADD COLUMN IF NOT EXISTS "produto_localizado_id" uuid,
ADD COLUMN IF NOT EXISTS "criterio_localizacao" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fornecedor_produtos_staging_produto_localizado_id_product_id_fk'
  ) THEN
    ALTER TABLE "fornecedor_produtos_staging"
    ADD CONSTRAINT "fornecedor_produtos_staging_produto_localizado_id_product_id_fk"
    FOREIGN KEY ("produto_localizado_id") REFERENCES "product"("id")
    ON DELETE SET NULL ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "fornecedor_produtos_staging_produto_localizado_id_idx"
ON "fornecedor_produtos_staging" ("produto_localizado_id");

CREATE INDEX IF NOT EXISTS "fornecedor_produtos_staging_criterio_localizacao_idx"
ON "fornecedor_produtos_staging" ("criterio_localizacao");
