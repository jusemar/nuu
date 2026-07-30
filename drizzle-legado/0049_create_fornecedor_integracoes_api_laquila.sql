CREATE TYPE "fornecedor_integracao_api_provedor" AS ENUM ('laquila');
CREATE TYPE "fornecedor_integracao_api_ambiente" AS ENUM ('homologacao', 'producao');
CREATE TYPE "fornecedor_integracao_api_teste_status" AS ENUM ('nao_testado', 'sucesso', 'erro');
CREATE TYPE "fornecedor_integracao_log_status" AS ENUM ('sucesso', 'erro');

CREATE TABLE IF NOT EXISTS "fornecedor_integracoes_api" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "fornecedor_id" uuid NOT NULL,
  "provedor" "fornecedor_integracao_api_provedor" NOT NULL,
  "ambiente" "fornecedor_integracao_api_ambiente" DEFAULT 'homologacao' NOT NULL,
  "url_base" text,
  "cnpj_empresa" text NOT NULL,
  "token_cliente_criptografado" text,
  "ativo" boolean DEFAULT false NOT NULL,
  "ultimo_teste_status" "fornecedor_integracao_api_teste_status" DEFAULT 'nao_testado' NOT NULL,
  "ultimo_teste_em" timestamp,
  "criado_em" timestamp DEFAULT now() NOT NULL,
  "atualizado_em" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fornecedor_integracoes_api_fornecedor_id_fk"
    FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE restrict
);

CREATE TABLE IF NOT EXISTS "fornecedor_integracao_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "integracao_api_id" uuid NOT NULL,
  "metodo" text NOT NULL,
  "operacao" text NOT NULL,
  "status" "fornecedor_integracao_log_status" NOT NULL,
  "codigo_http" integer,
  "mensagem" text,
  "request_resumo" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "response_resumo" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "criado_em" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "fornecedor_integracao_logs_integracao_api_id_fk"
    FOREIGN KEY ("integracao_api_id") REFERENCES "fornecedor_integracoes_api"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "fornecedor_integracoes_api_fornecedor_id_idx"
ON "fornecedor_integracoes_api" ("fornecedor_id");

CREATE INDEX IF NOT EXISTS "fornecedor_integracoes_api_provedor_idx"
ON "fornecedor_integracoes_api" ("provedor");

CREATE INDEX IF NOT EXISTS "fornecedor_integracoes_api_ambiente_idx"
ON "fornecedor_integracoes_api" ("ambiente");

CREATE INDEX IF NOT EXISTS "fornecedor_integracoes_api_ativo_idx"
ON "fornecedor_integracoes_api" ("ativo");

CREATE UNIQUE INDEX IF NOT EXISTS "fornecedor_integracoes_api_fornecedor_provedor_unique"
ON "fornecedor_integracoes_api" ("fornecedor_id", "provedor");

CREATE INDEX IF NOT EXISTS "fornecedor_integracao_logs_integracao_api_id_idx"
ON "fornecedor_integracao_logs" ("integracao_api_id");

CREATE INDEX IF NOT EXISTS "fornecedor_integracao_logs_metodo_idx"
ON "fornecedor_integracao_logs" ("metodo");

CREATE INDEX IF NOT EXISTS "fornecedor_integracao_logs_status_idx"
ON "fornecedor_integracao_logs" ("status");

CREATE INDEX IF NOT EXISTS "fornecedor_integracao_logs_criado_em_idx"
ON "fornecedor_integracao_logs" ("criado_em");
