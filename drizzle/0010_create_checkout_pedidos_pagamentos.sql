DO $$ BEGIN
  CREATE TYPE "public"."checkout_pedido_status" AS ENUM('pending', 'paid', 'canceled', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."checkout_pagamento_gateway" AS ENUM('stripe', 'efibank');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."checkout_pagamento_metodo" AS ENUM('cartao', 'pix');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."checkout_pagamento_status" AS ENUM('pending', 'paid', 'failed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
CREATE SEQUENCE IF NOT EXISTS "checkout_pedidos_numero_pedido_seq" START WITH 1001;

CREATE TABLE IF NOT EXISTS "checkout_clientes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text,
  "nome" text NOT NULL,
  "email" text NOT NULL,
  "telefone" text NOT NULL,
  "documento" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "checkout_enderecos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "cliente_id" uuid NOT NULL,
  "cep" text NOT NULL,
  "rua" text NOT NULL,
  "numero" text NOT NULL,
  "complemento" text,
  "bairro" text NOT NULL,
  "cidade" text NOT NULL,
  "estado" text NOT NULL,
  "observacao" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "checkout_enderecos_cliente_id_checkout_clientes_id_fk"
    FOREIGN KEY ("cliente_id") REFERENCES "public"."checkout_clientes"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "checkout_pedidos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "numero_pedido" text NOT NULL,
  "cliente_id" uuid NOT NULL,
  "endereco_id" uuid NOT NULL,
  "status" "checkout_pedido_status" NOT NULL DEFAULT 'pending',
  "subtotal_em_centavos" integer NOT NULL,
  "frete_em_centavos" integer NOT NULL,
  "desconto_em_centavos" integer NOT NULL DEFAULT 0,
  "total_em_centavos" integer NOT NULL,
  "gateway_pagamento" "checkout_pagamento_gateway" NOT NULL,
  "pagamento_status" "checkout_pagamento_status" NOT NULL DEFAULT 'pending',
  "observacao" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "checkout_pedidos_numero_pedido_unique" UNIQUE("numero_pedido"),
  CONSTRAINT "checkout_pedidos_cliente_id_checkout_clientes_id_fk"
    FOREIGN KEY ("cliente_id") REFERENCES "public"."checkout_clientes"("id")
    ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "checkout_pedidos_endereco_id_checkout_enderecos_id_fk"
    FOREIGN KEY ("endereco_id") REFERENCES "public"."checkout_enderecos"("id")
    ON DELETE restrict ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "checkout_pedido_itens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pedido_id" uuid NOT NULL,
  "produto_id" uuid NOT NULL,
  "nome_produto" text NOT NULL,
  "sku_produto" text,
  "modalidade" text,
  "prazo_modalidade" text,
  "imagem_url" text,
  "quantidade" integer NOT NULL,
  "preco_unitario_em_centavos" integer NOT NULL,
  "total_em_centavos" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "checkout_pedido_itens_pedido_id_checkout_pedidos_id_fk"
    FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "checkout_pagamentos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pedido_id" uuid NOT NULL,
  "gateway" "checkout_pagamento_gateway" NOT NULL,
  "metodo" "checkout_pagamento_metodo" NOT NULL,
  "status" "checkout_pagamento_status" NOT NULL DEFAULT 'pending',
  "valor_em_centavos" integer NOT NULL,
  "transaction_id" text,
  "pix_txid" text,
  "qr_code" text,
  "copia_e_cola" text,
  "provider_response" jsonb,
  "expires_at" timestamp,
  "paid_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "checkout_pagamentos_pedido_id_checkout_pedidos_id_fk"
    FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "checkout_clientes_email_idx" ON "checkout_clientes" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "checkout_clientes_documento_unique" ON "checkout_clientes" ("documento");
CREATE INDEX IF NOT EXISTS "checkout_enderecos_cliente_id_idx" ON "checkout_enderecos" ("cliente_id");
CREATE INDEX IF NOT EXISTS "checkout_pedidos_cliente_id_idx" ON "checkout_pedidos" ("cliente_id");
CREATE INDEX IF NOT EXISTS "checkout_pedidos_status_idx" ON "checkout_pedidos" ("status");
CREATE INDEX IF NOT EXISTS "checkout_pedido_itens_pedido_id_idx" ON "checkout_pedido_itens" ("pedido_id");
CREATE INDEX IF NOT EXISTS "checkout_pagamentos_pedido_id_idx" ON "checkout_pagamentos" ("pedido_id");
CREATE INDEX IF NOT EXISTS "checkout_pagamentos_transaction_id_idx" ON "checkout_pagamentos" ("transaction_id");
CREATE INDEX IF NOT EXISTS "checkout_pagamentos_pix_txid_idx" ON "checkout_pagamentos" ("pix_txid");
