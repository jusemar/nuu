CREATE TYPE "public"."fidelidade_origem_regra" AS ENUM('global', 'personalizada');--> statement-breakpoint
CREATE TYPE "public"."fidelidade_situacao_processamento" AS ENUM('nao_elegivel', 'pendente', 'disponivel', 'revertido');--> statement-breakpoint
CREATE TYPE "public"."fidelidade_status_transacao" AS ENUM('pendente', 'disponivel', 'revertido');--> statement-breakpoint
CREATE TYPE "public"."fidelidade_tipo_transacao" AS ENUM('credito_pendente', 'liberacao', 'reversao_pendente', 'reversao_disponivel');--> statement-breakpoint
CREATE TABLE "programa_fidelidade_carteiras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"pontos_pendentes" numeric(18, 4) DEFAULT '0' NOT NULL,
	"pontos_disponiveis" numeric(18, 4) DEFAULT '0' NOT NULL,
	"pontos_utilizados" numeric(18, 4) DEFAULT '0' NOT NULL,
	"pontos_revertidos" numeric(18, 4) DEFAULT '0' NOT NULL,
	"total_acumulado_historico" numeric(18, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programa_fidelidade_carteira_saldos_nao_negativos" CHECK ("programa_fidelidade_carteiras"."pontos_pendentes" >= 0 AND "programa_fidelidade_carteiras"."pontos_disponiveis" >= 0 AND "programa_fidelidade_carteiras"."pontos_utilizados" >= 0 AND "programa_fidelidade_carteiras"."pontos_revertidos" >= 0 AND "programa_fidelidade_carteiras"."total_acumulado_historico" >= 0)
);
--> statement-breakpoint
CREATE TABLE "programa_fidelidade_processamentos_pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"situacao" "fidelidade_situacao_processamento" NOT NULL,
	"motivo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programa_fidelidade_transacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"carteira_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"pedido_id" uuid NOT NULL,
	"pedido_item_id" uuid,
	"transacao_origem_id" uuid,
	"categoria_id" uuid,
	"tipo" "fidelidade_tipo_transacao" NOT NULL,
	"status" "fidelidade_status_transacao" NOT NULL,
	"referencia_idempotencia" text NOT NULL,
	"origem_regra" "fidelidade_origem_regra" NOT NULL,
	"configuracao_versao" integer NOT NULL,
	"taxa_pontos_por_real" numeric(12, 4) NOT NULL,
	"valor_bruto_em_centavos" numeric(18, 0) NOT NULL,
	"desconto_rateado_em_centavos" numeric(18, 0) NOT NULL,
	"valor_base_em_centavos" numeric(18, 0) NOT NULL,
	"pontos" numeric(18, 4) NOT NULL,
	"motivo" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programa_fidelidade_transacao_pontos_positivos" CHECK ("programa_fidelidade_transacoes"."pontos" > 0),
	CONSTRAINT "programa_fidelidade_transacao_valores_validos" CHECK ("programa_fidelidade_transacoes"."valor_bruto_em_centavos" >= 0 AND "programa_fidelidade_transacoes"."desconto_rateado_em_centavos" >= 0 AND "programa_fidelidade_transacoes"."valor_base_em_centavos" >= 0 AND "programa_fidelidade_transacoes"."valor_base_em_centavos" = "programa_fidelidade_transacoes"."valor_bruto_em_centavos" - "programa_fidelidade_transacoes"."desconto_rateado_em_centavos")
);
--> statement-breakpoint
ALTER TABLE "checkout_pedido_itens" ADD COLUMN "categoria_id" uuid;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_carteiras" ADD CONSTRAINT "programa_fidelidade_carteiras_cliente_id_checkout_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."checkout_clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_processamentos_pedidos" ADD CONSTRAINT "programa_fidelidade_processamentos_pedidos_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_processamentos_pedidos" ADD CONSTRAINT "programa_fidelidade_processamentos_pedidos_cliente_id_checkout_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."checkout_clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_transacoes" ADD CONSTRAINT "programa_fidelidade_transacoes_carteira_id_programa_fidelidade_carteiras_id_fk" FOREIGN KEY ("carteira_id") REFERENCES "public"."programa_fidelidade_carteiras"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_transacoes" ADD CONSTRAINT "programa_fidelidade_transacoes_cliente_id_checkout_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."checkout_clientes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_transacoes" ADD CONSTRAINT "programa_fidelidade_transacoes_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_transacoes" ADD CONSTRAINT "programa_fidelidade_transacoes_pedido_item_id_checkout_pedido_itens_id_fk" FOREIGN KEY ("pedido_item_id") REFERENCES "public"."checkout_pedido_itens"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programa_fidelidade_transacoes" ADD CONSTRAINT "programa_fidelidade_transacoes_transacao_origem_id_programa_fidelidade_transacoes_id_fk" FOREIGN KEY ("transacao_origem_id") REFERENCES "public"."programa_fidelidade_transacoes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "programa_fidelidade_carteira_cliente_unique" ON "programa_fidelidade_carteiras" USING btree ("cliente_id");--> statement-breakpoint
CREATE UNIQUE INDEX "programa_fidelidade_processamento_pedido_unique" ON "programa_fidelidade_processamentos_pedidos" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "programa_fidelidade_processamento_cliente_idx" ON "programa_fidelidade_processamentos_pedidos" USING btree ("cliente_id");--> statement-breakpoint
CREATE UNIQUE INDEX "programa_fidelidade_transacao_referencia_unique" ON "programa_fidelidade_transacoes" USING btree ("referencia_idempotencia");--> statement-breakpoint
CREATE INDEX "programa_fidelidade_transacao_cliente_data_idx" ON "programa_fidelidade_transacoes" USING btree ("cliente_id","created_at");--> statement-breakpoint
CREATE INDEX "programa_fidelidade_transacao_pedido_idx" ON "programa_fidelidade_transacoes" USING btree ("pedido_id");