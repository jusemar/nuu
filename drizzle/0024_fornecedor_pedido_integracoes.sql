CREATE TABLE "fornecedor_pedido_integracoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"fornecedor_id" uuid NOT NULL,
	"provedor" "fornecedor_integracao_api_provedor" NOT NULL,
	"chave_grupo" text NOT NULL,
	"chave_idempotencia" text NOT NULL,
	"hash_payload" text NOT NULL,
	"status" text NOT NULL,
	"id_pedido_externo" text,
	"cd_transportador" text NOT NULL,
	"tentativas" integer DEFAULT 0 NOT NULL,
	"ultima_tentativa_em" timestamp,
	"erro_sanitizado" text,
	"payload_sanitizado" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fornecedor_pedido_integracoes_status_check" CHECK ("status" IN ('pendente', 'processando', 'criado', 'falha', 'resultado_indeterminado'))
);
--> statement-breakpoint
ALTER TABLE "fornecedor_pedido_integracoes" ADD CONSTRAINT "fornecedor_pedido_integracoes_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "fornecedor_pedido_integracoes" ADD CONSTRAINT "fornecedor_pedido_integracoes_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "fornecedor_pedido_integracoes_grupo_unique" ON "fornecedor_pedido_integracoes" USING btree ("pedido_id", "provedor", "chave_grupo");
--> statement-breakpoint
CREATE UNIQUE INDEX "fornecedor_pedido_integracoes_idempotencia_unique" ON "fornecedor_pedido_integracoes" USING btree ("chave_idempotencia");
--> statement-breakpoint
CREATE UNIQUE INDEX "fornecedor_pedido_integracoes_externo_unique" ON "fornecedor_pedido_integracoes" USING btree ("provedor", "id_pedido_externo") WHERE "id_pedido_externo" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "fornecedor_pedido_integracoes_status_idx" ON "fornecedor_pedido_integracoes" USING btree ("status");
