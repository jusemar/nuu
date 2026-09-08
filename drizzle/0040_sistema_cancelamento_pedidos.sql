CREATE TYPE "public"."checkout_cancelamento_motivo" AS ENUM('compra_por_engano', 'alterar_pedido', 'prazo_entrega', 'outra_opcao', 'problema_pagamento', 'outro');--> statement-breakpoint
CREATE TYPE "public"."checkout_cancelamento_status" AS ENUM('processando', 'concluido', 'falhou', 'bloqueado_fornecedor');--> statement-breakpoint
CREATE TYPE "public"."checkout_reembolso_status" AS ENUM('nao_necessario', 'processando', 'concluido', 'falhou');--> statement-breakpoint
ALTER TYPE "public"."checkout_pedido_historico_origem" ADD VALUE 'cliente';--> statement-breakpoint
ALTER TYPE "public"."checkout_pedido_historico_tipo" ADD VALUE 'cancelamento_solicitado';--> statement-breakpoint
ALTER TYPE "public"."checkout_pedido_historico_tipo" ADD VALUE 'pedido_cancelado';--> statement-breakpoint
ALTER TYPE "public"."checkout_pedido_historico_tipo" ADD VALUE 'reembolso_atualizado';--> statement-breakpoint
CREATE TABLE "checkout_pedido_cancelamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"status" "checkout_cancelamento_status" NOT NULL,
	"motivo" "checkout_cancelamento_motivo" NOT NULL,
	"complemento_motivo" text,
	"solicitado_por_usuario_id" text NOT NULL,
	"solicitado_por_email" text NOT NULL,
	"solicitado_em" timestamp DEFAULT now() NOT NULL,
	"concluido_em" timestamp,
	"gateway_reembolso" "checkout_pagamento_gateway",
	"reembolso_status" "checkout_reembolso_status" DEFAULT 'nao_necessario' NOT NULL,
	"reembolso_id" text,
	"chave_idempotencia_reembolso" text NOT NULL,
	"erro_operacional" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checkout_pedido_cancelamentos" ADD CONSTRAINT "checkout_pedido_cancelamentos_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_pedido_cancelamentos_pedido_unique" ON "checkout_pedido_cancelamentos" USING btree ("pedido_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_pedido_cancelamentos_reembolso_unique" ON "checkout_pedido_cancelamentos" USING btree ("chave_idempotencia_reembolso");--> statement-breakpoint
CREATE INDEX "checkout_pedido_cancelamentos_status_idx" ON "checkout_pedido_cancelamentos" USING btree ("status");--> statement-breakpoint
CREATE INDEX "checkout_pedido_cancelamentos_reembolso_status_idx" ON "checkout_pedido_cancelamentos" USING btree ("reembolso_status");