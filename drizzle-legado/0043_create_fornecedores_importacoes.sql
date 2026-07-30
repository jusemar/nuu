CREATE TYPE "fornecedor_tipo_integracao" AS ENUM ('arquivo_excel', 'api');
CREATE TYPE "fornecedor_status" AS ENUM ('ativo', 'inativo', 'pendente');
CREATE TYPE "importacao_fornecedor_tipo_arquivo" AS ENUM ('arquivo_excel', 'api');
CREATE TYPE "importacao_fornecedor_status" AS ENUM ('pendente', 'em_staging', 'em_homologacao', 'aprovada', 'rejeitada', 'erro');
CREATE TYPE "fornecedor_produto_staging_status" AS ENUM ('aguardando_analise', 'localizado', 'nao_localizado', 'erro', 'rejeitado', 'aprovado');

CREATE TABLE "fornecedores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nome" text NOT NULL,
  "tipo_integracao" "fornecedor_tipo_integracao" NOT NULL,
  "status" "fornecedor_status" DEFAULT 'pendente' NOT NULL,
  "criado_em" timestamp DEFAULT now() NOT NULL,
  "atualizado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "importacoes_fornecedor" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "fornecedor_id" uuid NOT NULL,
  "tipo_arquivo" "importacao_fornecedor_tipo_arquivo" NOT NULL,
  "status" "importacao_fornecedor_status" DEFAULT 'pendente' NOT NULL,
  "nome_arquivo" text,
  "total_linhas" integer DEFAULT 0 NOT NULL,
  "total_processadas" integer DEFAULT 0 NOT NULL,
  "total_erros" integer DEFAULT 0 NOT NULL,
  "criado_em" timestamp DEFAULT now() NOT NULL,
  "atualizado_em" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "fornecedor_produtos_staging" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "importacao_id" uuid NOT NULL,
  "codigo_fornecedor" text,
  "nome_produto" text NOT NULL,
  "categoria_fornecedor" text,
  "preco_fornecedor" numeric(12, 2),
  "estoque_fornecedor" integer,
  "status" "fornecedor_produto_staging_status" DEFAULT 'aguardando_analise' NOT NULL,
  "criado_em" timestamp DEFAULT now() NOT NULL,
  "atualizado_em" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "importacoes_fornecedor"
ADD CONSTRAINT "importacoes_fornecedor_fornecedor_id_fornecedores_id_fk"
FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id")
ON DELETE restrict ON UPDATE no action;

ALTER TABLE "fornecedor_produtos_staging"
ADD CONSTRAINT "fornecedor_produtos_staging_importacao_id_importacoes_fornecedor_id_fk"
FOREIGN KEY ("importacao_id") REFERENCES "importacoes_fornecedor"("id")
ON DELETE cascade ON UPDATE no action;

CREATE INDEX "fornecedores_tipo_integracao_idx"
ON "fornecedores" ("tipo_integracao");

CREATE INDEX "fornecedores_status_idx"
ON "fornecedores" ("status");

CREATE INDEX "importacoes_fornecedor_fornecedor_id_idx"
ON "importacoes_fornecedor" ("fornecedor_id");

CREATE INDEX "importacoes_fornecedor_status_idx"
ON "importacoes_fornecedor" ("status");

CREATE INDEX "importacoes_fornecedor_criado_em_idx"
ON "importacoes_fornecedor" ("criado_em");

CREATE INDEX "fornecedor_produtos_staging_importacao_id_idx"
ON "fornecedor_produtos_staging" ("importacao_id");

CREATE INDEX "fornecedor_produtos_staging_status_idx"
ON "fornecedor_produtos_staging" ("status");

CREATE INDEX "fornecedor_produtos_staging_codigo_fornecedor_idx"
ON "fornecedor_produtos_staging" ("codigo_fornecedor");
