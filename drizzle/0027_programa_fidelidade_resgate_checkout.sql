ALTER TYPE "public"."fidelidade_tipo_transacao" ADD VALUE IF NOT EXISTS 'reserva_resgate';--> statement-breakpoint
ALTER TYPE "public"."fidelidade_tipo_transacao" ADD VALUE IF NOT EXISTS 'consumo_resgate';--> statement-breakpoint
ALTER TYPE "public"."fidelidade_tipo_transacao" ADD VALUE IF NOT EXISTS 'liberacao_resgate';--> statement-breakpoint
ALTER TYPE "public"."fidelidade_tipo_transacao" ADD VALUE IF NOT EXISTS 'devolucao_resgate';--> statement-breakpoint
ALTER TYPE "public"."fidelidade_status_transacao" ADD VALUE IF NOT EXISTS 'reservada';--> statement-breakpoint
ALTER TYPE "public"."fidelidade_status_transacao" ADD VALUE IF NOT EXISTS 'consumida';--> statement-breakpoint
ALTER TYPE "public"."fidelidade_status_transacao" ADD VALUE IF NOT EXISTS 'liberada';--> statement-breakpoint
ALTER TYPE "public"."fidelidade_status_transacao" ADD VALUE IF NOT EXISTS 'devolvida';--> statement-breakpoint
CREATE TYPE "public"."fidelidade_status_reserva" AS ENUM('reservada', 'consumida', 'liberada', 'devolvida');--> statement-breakpoint
ALTER TABLE "programa_fidelidade_carteiras" ADD COLUMN "pontos_reservados" numeric(18,4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_carteiras" DROP CONSTRAINT "programa_fidelidade_carteira_saldos_nao_negativos";--> statement-breakpoint
ALTER TABLE "programa_fidelidade_carteiras" ADD CONSTRAINT "programa_fidelidade_carteira_saldos_nao_negativos" CHECK ("pontos_pendentes" >= 0 AND "pontos_disponiveis" >= 0 AND "pontos_reservados" >= 0 AND "pontos_utilizados" >= 0 AND "pontos_revertidos" >= 0 AND "total_acumulado_historico" >= 0);--> statement-breakpoint
CREATE TABLE "programa_fidelidade_reservas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "carteira_id" uuid NOT NULL,
  "cliente_id" uuid NOT NULL,
  "pedido_id" uuid NOT NULL,
  "status" "fidelidade_status_reserva" NOT NULL,
  "pontos" numeric(18,4) NOT NULL,
  "credito_em_centavos" integer NOT NULL,
  "pontos_conversao" numeric(18,4) NOT NULL,
  "valor_credito_conversao_em_centavos" integer NOT NULL,
  "configuracao_versao" integer NOT NULL,
  "base_elegivel_em_centavos" integer NOT NULL,
  "limite_aplicado_em_centavos" integer NOT NULL,
  "valor_minimo_pagamento_em_centavos" integer NOT NULL,
  "referencia_idempotencia" text NOT NULL,
  "motivo_finalizacao" text,
  "consumida_em" timestamp with time zone,
  "liberada_em" timestamp with time zone,
  "devolvida_em" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "programa_fidelidade_reserva_pontos_positivos" CHECK ("pontos" > 0),
  CONSTRAINT "programa_fidelidade_reserva_valores_validos" CHECK ("credito_em_centavos" > 0 AND "base_elegivel_em_centavos" >= "credito_em_centavos" AND "limite_aplicado_em_centavos" >= "credito_em_centavos" AND "valor_minimo_pagamento_em_centavos" > 0)
);--> statement-breakpoint
ALTER TABLE "programa_fidelidade_reservas" ADD CONSTRAINT "programa_fidelidade_reservas_carteira_fk" FOREIGN KEY ("carteira_id") REFERENCES "public"."programa_fidelidade_carteiras"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_reservas" ADD CONSTRAINT "programa_fidelidade_reservas_cliente_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."checkout_clientes"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_reservas" ADD CONSTRAINT "programa_fidelidade_reservas_pedido_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE restrict;--> statement-breakpoint
CREATE UNIQUE INDEX "programa_fidelidade_reserva_pedido_unique" ON "programa_fidelidade_reservas" ("pedido_id");--> statement-breakpoint
CREATE UNIQUE INDEX "programa_fidelidade_reserva_referencia_unique" ON "programa_fidelidade_reservas" ("referencia_idempotencia");--> statement-breakpoint
CREATE INDEX "programa_fidelidade_reserva_cliente_status_idx" ON "programa_fidelidade_reservas" ("cliente_id", "status");--> statement-breakpoint
ALTER TABLE "programa_fidelidade_transacoes" ADD COLUMN "reserva_id" uuid;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_transacoes" ADD CONSTRAINT "programa_fidelidade_transacoes_reserva_fk" FOREIGN KEY ("reserva_id") REFERENCES "public"."programa_fidelidade_reservas"("id") ON DELETE restrict;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "pontos_resgatados" text;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "credito_fidelidade_em_centavos" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "pontos_conversao_fidelidade" text;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "valor_credito_conversao_em_centavos" integer;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "configuracao_fidelidade_versao" integer;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "base_elegivel_fidelidade_em_centavos" integer;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "limite_fidelidade_aplicado_em_centavos" integer;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "valor_minimo_pagamento_em_centavos" integer;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "reserva_fidelidade_id" uuid;--> statement-breakpoint
ALTER TABLE "checkout_pedido_itens" ADD COLUMN "credito_fidelidade_rateado_em_centavos" integer DEFAULT 0 NOT NULL;
