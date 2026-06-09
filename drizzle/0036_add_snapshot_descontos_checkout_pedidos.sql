ALTER TABLE "checkout_pedidos"
  ADD COLUMN IF NOT EXISTS "desconto_promocional_em_centavos" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "desconto_cupom_em_centavos" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "economia_total_em_centavos" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "codigo_cupom_aplicado" text,
  ADD COLUMN IF NOT EXISTS "snapshot_descontos" jsonb;
