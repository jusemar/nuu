DO $$
BEGIN
  CREATE TYPE "fornecedor_mapeamento_coluna_destino" AS ENUM (
    'codigo_fornecedor',
    'nome_produto',
    'categoria_fornecedor',
    'marca_fornecedor',
    'preco_fornecedor',
    'estoque_fornecedor'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "fornecedor_mapeamentos_colunas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "fornecedor_id" uuid NOT NULL,
  "nome_coluna_origem" text NOT NULL,
  "campo_destino" "fornecedor_mapeamento_coluna_destino" NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "criado_em" timestamp DEFAULT now() NOT NULL,
  "atualizado_em" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fornecedor_mapeamentos_colunas_fornecedor_id_fk"
    FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id")
    ON DELETE cascade
);

ALTER TABLE "importacoes_fornecedor"
ADD COLUMN IF NOT EXISTS "colunas_planilha" jsonb DEFAULT '[]'::jsonb NOT NULL,
ADD COLUMN IF NOT EXISTS "mapeamento_colunas" jsonb DEFAULT '[]'::jsonb NOT NULL;

ALTER TABLE "fornecedor_produtos_staging"
ADD COLUMN IF NOT EXISTS "marca_fornecedor" text,
ADD COLUMN IF NOT EXISTS "dados_brutos" jsonb DEFAULT '{}'::jsonb NOT NULL;

CREATE INDEX IF NOT EXISTS "fornecedor_mapeamentos_colunas_fornecedor_id_idx"
ON "fornecedor_mapeamentos_colunas" ("fornecedor_id");

CREATE INDEX IF NOT EXISTS "fornecedor_mapeamentos_colunas_campo_destino_idx"
ON "fornecedor_mapeamentos_colunas" ("campo_destino");

CREATE UNIQUE INDEX IF NOT EXISTS "fornecedor_mapeamentos_colunas_destino_ativo_unique"
ON "fornecedor_mapeamentos_colunas" ("fornecedor_id", "campo_destino")
WHERE "ativo" = true;

CREATE INDEX IF NOT EXISTS "fornecedor_produtos_staging_marca_fornecedor_idx"
ON "fornecedor_produtos_staging" ("marca_fornecedor");
