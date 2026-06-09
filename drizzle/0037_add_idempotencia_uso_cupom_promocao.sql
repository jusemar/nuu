ALTER TABLE "usos_cupons_promocao"
  ADD COLUMN IF NOT EXISTS "valor_desconto_em_centavos" integer DEFAULT 0 NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "usos_cupons_promocao_pedido_cupom_unique"
ON "usos_cupons_promocao" ("pedido_id", "cupom_promocao_id");
