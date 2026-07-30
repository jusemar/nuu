DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type tipo
    INNER JOIN pg_enum valor ON valor.enumtypid = tipo.oid
    WHERE tipo.typname = 'fornecedor_produto_staging_status'
      AND valor.enumlabel = 'ignorado'
  ) THEN
    ALTER TYPE "fornecedor_produto_staging_status" ADD VALUE 'ignorado';
  END IF;
END $$;

ALTER TABLE "importacoes_fornecedor"
ADD COLUMN IF NOT EXISTS "configuracao_fluxo_json" jsonb DEFAULT '{}'::jsonb NOT NULL;
