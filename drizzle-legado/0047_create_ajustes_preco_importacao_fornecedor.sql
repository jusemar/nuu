CREATE TYPE "importacao_fornecedor_ajuste_tipo" AS ENUM ('percentual', 'valor_fixo');
CREATE TYPE "importacao_fornecedor_ajuste_escopo" AS ENUM ('global', 'categoria', 'produto');
CREATE TYPE "importacao_fornecedor_ajuste_status" AS ENUM ('ativo', 'inativo');
CREATE TYPE "fornecedor_preco_origem_ajuste" AS ENUM ('global', 'categoria', 'produto', 'nenhum');

ALTER TABLE "fornecedor_produtos_staging"
ADD COLUMN IF NOT EXISTS "preco_original" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "preco_calculado" numeric(12, 2),
ADD COLUMN IF NOT EXISTS "origem_ajuste" "fornecedor_preco_origem_ajuste" DEFAULT 'nenhum' NOT NULL;

UPDATE "fornecedor_produtos_staging"
SET "preco_original" = COALESCE("preco_original", "preco_fornecedor")
WHERE "preco_original" IS NULL;

CREATE TABLE IF NOT EXISTS "importacao_fornecedor_ajustes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "importacao_id" uuid NOT NULL,
  "tipo_ajuste" "importacao_fornecedor_ajuste_tipo" NOT NULL,
  "escopo_ajuste" "importacao_fornecedor_ajuste_escopo" NOT NULL,
  "valor_ajuste" numeric(12, 4) NOT NULL,
  "categoria_fornecedor" text,
  "produto_staging_id" uuid,
  "status" "importacao_fornecedor_ajuste_status" DEFAULT 'ativo' NOT NULL,
  "criado_em" timestamp DEFAULT now() NOT NULL,
  "atualizado_em" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "importacao_fornecedor_ajustes_importacao_id_fk"
    FOREIGN KEY ("importacao_id") REFERENCES "importacoes_fornecedor"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "importacao_fornecedor_ajustes_produto_staging_id_fk"
    FOREIGN KEY ("produto_staging_id") REFERENCES "fornecedor_produtos_staging"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fornecedor_produtos_staging_origem_ajuste_idx"
ON "fornecedor_produtos_staging" ("origem_ajuste");

CREATE INDEX IF NOT EXISTS "importacao_fornecedor_ajustes_importacao_id_idx"
ON "importacao_fornecedor_ajustes" ("importacao_id");

CREATE INDEX IF NOT EXISTS "importacao_fornecedor_ajustes_escopo_idx"
ON "importacao_fornecedor_ajustes" ("escopo_ajuste");

CREATE INDEX IF NOT EXISTS "importacao_fornecedor_ajustes_status_idx"
ON "importacao_fornecedor_ajustes" ("status");

CREATE INDEX IF NOT EXISTS "importacao_fornecedor_ajustes_categoria_idx"
ON "importacao_fornecedor_ajustes" ("categoria_fornecedor");

CREATE INDEX IF NOT EXISTS "importacao_fornecedor_ajustes_produto_staging_id_idx"
ON "importacao_fornecedor_ajustes" ("produto_staging_id");

CREATE UNIQUE INDEX IF NOT EXISTS "importacao_fornecedor_ajustes_global_ativo_unique"
ON "importacao_fornecedor_ajustes" ("importacao_id")
WHERE "status" = 'ativo' AND "escopo_ajuste" = 'global';

CREATE UNIQUE INDEX IF NOT EXISTS "importacao_fornecedor_ajustes_categoria_ativo_unique"
ON "importacao_fornecedor_ajustes" ("importacao_id", "categoria_fornecedor")
WHERE "status" = 'ativo' AND "escopo_ajuste" = 'categoria';

CREATE UNIQUE INDEX IF NOT EXISTS "importacao_fornecedor_ajustes_produto_ativo_unique"
ON "importacao_fornecedor_ajustes" ("importacao_id", "produto_staging_id")
WHERE "status" = 'ativo' AND "escopo_ajuste" = 'produto';
