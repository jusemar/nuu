DO $$
BEGIN
  CREATE TYPE "produto_rascunho_origem_tipo" AS ENUM (
    'manual',
    'fornecedor_api',
    'fornecedor_excel'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "produto_rascunho_status" AS ENUM (
    'rascunho',
    'pendente_conciliacao',
    'pronto_para_publicar',
    'ignorado'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "produto_rascunhos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "origem_tipo" "produto_rascunho_origem_tipo" NOT NULL,
  "origem_provedor" text,
  "fornecedor_id" uuid,
  "integracao_api_id" uuid,
  "codigo_fornecedor" text,
  "nome" text NOT NULL,
  "descricao" text,
  "categoria_id" uuid,
  "marca_id" uuid,
  "ean" text,
  "ncm" text,
  "preco_fornecedor" numeric(12, 2),
  "preco_loja" numeric(12, 2),
  "estoque_fornecedor" integer,
  "peso" numeric(12, 4),
  "altura" numeric(12, 4),
  "largura" numeric(12, 4),
  "comprimento" numeric(12, 4),
  "imagens" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "dados_origem_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" "produto_rascunho_status" DEFAULT 'rascunho' NOT NULL,
  "criado_em" timestamp DEFAULT now() NOT NULL,
  "atualizado_em" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "produto_rascunhos_fornecedor_id_fk"
    FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE set null,
  CONSTRAINT "produto_rascunhos_integracao_api_id_fk"
    FOREIGN KEY ("integracao_api_id") REFERENCES "fornecedor_integracoes_api"("id") ON DELETE set null,
  CONSTRAINT "produto_rascunhos_categoria_id_fk"
    FOREIGN KEY ("categoria_id") REFERENCES "category"("id") ON DELETE set null,
  CONSTRAINT "produto_rascunhos_marca_id_fk"
    FOREIGN KEY ("marca_id") REFERENCES "marca"("id") ON DELETE set null
);

CREATE INDEX IF NOT EXISTS "produto_rascunhos_origem_tipo_idx"
ON "produto_rascunhos" ("origem_tipo");

CREATE INDEX IF NOT EXISTS "produto_rascunhos_origem_provedor_idx"
ON "produto_rascunhos" ("origem_provedor");

CREATE INDEX IF NOT EXISTS "produto_rascunhos_fornecedor_id_idx"
ON "produto_rascunhos" ("fornecedor_id");

CREATE INDEX IF NOT EXISTS "produto_rascunhos_integracao_api_id_idx"
ON "produto_rascunhos" ("integracao_api_id");

CREATE INDEX IF NOT EXISTS "produto_rascunhos_codigo_fornecedor_idx"
ON "produto_rascunhos" ("codigo_fornecedor");

CREATE INDEX IF NOT EXISTS "produto_rascunhos_status_idx"
ON "produto_rascunhos" ("status");
