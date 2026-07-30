ALTER TYPE "public"."checkout_pedido_historico_tipo" ADD VALUE IF NOT EXISTS 'pedido_enviado';
ALTER TYPE "public"."checkout_pedido_historico_tipo" ADD VALUE IF NOT EXISTS 'rastreio_atualizado';
ALTER TYPE "public"."checkout_pedido_historico_tipo" ADD VALUE IF NOT EXISTS 'pedido_entregue';

CREATE TABLE IF NOT EXISTS "checkout_pedido_logisticas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pedido_id" uuid NOT NULL,
  "transportadora" text,
  "codigo_rastreio" text,
  "data_envio" timestamp,
  "data_entrega" timestamp,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "checkout_pedido_logisticas_pedido_id_checkout_pedidos_id_fk"
    FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "checkout_pedido_logisticas_pedido_id_unique"
  ON "checkout_pedido_logisticas" ("pedido_id");
CREATE INDEX IF NOT EXISTS "checkout_pedido_logisticas_codigo_rastreio_idx"
  ON "checkout_pedido_logisticas" ("codigo_rastreio");
