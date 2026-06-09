CREATE TYPE "fornecedor_produto_vinculo_tipo" AS ENUM ('manual', 'automatico');
CREATE TYPE "fornecedor_produto_vinculo_status" AS ENUM ('ativo', 'inativo');

CREATE TABLE IF NOT EXISTS "fornecedor_produto_vinculos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "fornecedor_id" uuid NOT NULL,
  "codigo_fornecedor" text NOT NULL,
  "produto_id" uuid NOT NULL,
  "tipo_vinculo" "fornecedor_produto_vinculo_tipo" DEFAULT 'manual' NOT NULL,
  "status" "fornecedor_produto_vinculo_status" DEFAULT 'ativo' NOT NULL,
  "criado_em" timestamp DEFAULT now() NOT NULL,
  "atualizado_em" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fornecedor_produto_vinculos_fornecedor_id_fornecedores_id_fk"
    FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id")
    ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "fornecedor_produto_vinculos_produto_id_product_id_fk"
    FOREIGN KEY ("produto_id") REFERENCES "product"("id")
    ON DELETE restrict ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "fornecedor_produto_vinculos_fornecedor_id_idx"
ON "fornecedor_produto_vinculos" ("fornecedor_id");

CREATE INDEX IF NOT EXISTS "fornecedor_produto_vinculos_produto_id_idx"
ON "fornecedor_produto_vinculos" ("produto_id");

CREATE INDEX IF NOT EXISTS "fornecedor_produto_vinculos_codigo_fornecedor_idx"
ON "fornecedor_produto_vinculos" ("codigo_fornecedor");

CREATE INDEX IF NOT EXISTS "fornecedor_produto_vinculos_status_idx"
ON "fornecedor_produto_vinculos" ("status");

CREATE UNIQUE INDEX IF NOT EXISTS "fornecedor_produto_vinculos_codigo_ativo_unique"
ON "fornecedor_produto_vinculos" ("fornecedor_id", "codigo_fornecedor")
WHERE "status" = 'ativo';
