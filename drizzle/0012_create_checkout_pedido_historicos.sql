ALTER TYPE "public"."checkout_pedido_status" ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE "public"."checkout_pedido_status" ADD VALUE IF NOT EXISTS 'shipped';
ALTER TYPE "public"."checkout_pedido_status" ADD VALUE IF NOT EXISTS 'delivered';
ALTER TYPE "public"."checkout_pedido_status" ADD VALUE IF NOT EXISTS 'refunded';

DO $$ BEGIN
  CREATE TYPE "public"."checkout_pedido_historico_tipo" AS ENUM(
    'pedido_criado',
    'pagamento_aprovado',
    'status_alterado_manual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."checkout_pedido_historico_origem" AS ENUM(
    'system',
    'admin'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "checkout_pedido_historicos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pedido_id" uuid NOT NULL,
  "tipo" "checkout_pedido_historico_tipo" NOT NULL,
  "descricao" text NOT NULL,
  "origem" "checkout_pedido_historico_origem" NOT NULL,
  "status_anterior" "checkout_pedido_status",
  "status_novo" "checkout_pedido_status",
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "checkout_pedido_historicos_pedido_id_checkout_pedidos_id_fk"
    FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "checkout_pedido_historicos_pedido_id_idx"
  ON "checkout_pedido_historicos" ("pedido_id");
CREATE INDEX IF NOT EXISTS "checkout_pedido_historicos_tipo_idx"
  ON "checkout_pedido_historicos" ("tipo");
CREATE INDEX IF NOT EXISTS "checkout_pedido_historicos_created_at_idx"
  ON "checkout_pedido_historicos" ("created_at");

INSERT INTO "checkout_pedido_historicos" (
  "pedido_id",
  "tipo",
  "descricao",
  "origem",
  "status_novo",
  "created_at",
  "updated_at"
)
SELECT
  "id",
  'pedido_criado',
  'Pedido criado no checkout.',
  'system',
  "status",
  "created_at",
  "created_at"
FROM "checkout_pedidos" p
WHERE NOT EXISTS (
  SELECT 1
  FROM "checkout_pedido_historicos" h
  WHERE h."pedido_id" = p."id"
    AND h."tipo" = 'pedido_criado'
);

INSERT INTO "checkout_pedido_historicos" (
  "pedido_id",
  "tipo",
  "descricao",
  "origem",
  "status_novo",
  "created_at",
  "updated_at"
)
SELECT
  p."id",
  'pagamento_aprovado',
  'Pagamento aprovado.',
  'system',
  p."status",
  COALESCE(pg."paid_at", p."updated_at"),
  COALESCE(pg."paid_at", p."updated_at")
FROM "checkout_pedidos" p
JOIN "checkout_pagamentos" pg ON pg."pedido_id" = p."id"
WHERE pg."status" = 'paid'
  AND NOT EXISTS (
    SELECT 1
    FROM "checkout_pedido_historicos" h
    WHERE h."pedido_id" = p."id"
      AND h."tipo" = 'pagamento_aprovado'
  );
