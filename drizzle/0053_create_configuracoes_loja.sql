CREATE TABLE IF NOT EXISTS "configuracoes_loja" (
  "id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
  "nome_comercial" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "configuracoes_loja_registro_global_check" CHECK ("id" = 'global')
);
