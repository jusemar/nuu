CREATE TABLE IF NOT EXISTS "modelos_retirada" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" text NOT NULL,
  "prazo_texto" text NOT NULL,
  "mensagem" text,
  "ativo" boolean DEFAULT true NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
