ALTER TABLE "checkout_pedido_logisticas"
  ADD COLUMN IF NOT EXISTS "provedor_frete" text,
  ADD COLUMN IF NOT EXISTS "modalidade_frete" text,
  ADD COLUMN IF NOT EXISTS "valor_frete_em_centavos" integer,
  ADD COLUMN IF NOT EXISTS "prazo_frete" text,
  ADD COLUMN IF NOT EXISTS "cep_frete" text,
  ADD COLUMN IF NOT EXISTS "fallback_frete_utilizado" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "snapshot_frete" jsonb;
