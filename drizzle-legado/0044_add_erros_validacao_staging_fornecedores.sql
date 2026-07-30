ALTER TABLE "fornecedor_produtos_staging"
ADD COLUMN IF NOT EXISTS "erros_validacao" jsonb DEFAULT '[]'::jsonb NOT NULL;
