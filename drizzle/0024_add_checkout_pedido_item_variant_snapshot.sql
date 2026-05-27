ALTER TABLE "checkout_pedido_itens"
ADD COLUMN IF NOT EXISTS "variante_id" uuid,
ADD COLUMN IF NOT EXISTS "nome_variante" text,
ADD COLUMN IF NOT EXISTS "atributos_variante" jsonb NOT NULL DEFAULT '{}'::jsonb;
