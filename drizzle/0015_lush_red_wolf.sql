CREATE TYPE "public"."checkout_pagamento_na_entrega_forma" AS ENUM('dinheiro', 'pix_na_entrega', 'debito_entrega', 'credito_entrega');--> statement-breakpoint
ALTER TYPE "public"."checkout_pagamento_gateway" ADD VALUE 'manual';--> statement-breakpoint
ALTER TYPE "public"."checkout_pagamento_metodo" ADD VALUE 'dinheiro';--> statement-breakpoint
ALTER TYPE "public"."checkout_pagamento_metodo" ADD VALUE 'pix_na_entrega';--> statement-breakpoint
ALTER TYPE "public"."checkout_pagamento_metodo" ADD VALUE 'debito_entrega';--> statement-breakpoint
ALTER TYPE "public"."checkout_pagamento_metodo" ADD VALUE 'credito_entrega';--> statement-breakpoint
ALTER TYPE "public"."checkout_pedido_historico_tipo" ADD VALUE 'pagamento_recebido_na_entrega';--> statement-breakpoint
CREATE TABLE "checkout_pedido_pagamento_entrega" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"forma_escolhida" "checkout_pagamento_na_entrega_forma" NOT NULL,
	"servico_frete_id" uuid,
	"servico_identificador" text NOT NULL,
	"valor_a_receber_em_centavos" integer NOT NULL,
	"precisa_troco" boolean DEFAULT false NOT NULL,
	"troco_para_em_centavos" integer,
	"observacoes_cliente" text,
	"snapshot_elegibilidade" jsonb NOT NULL,
	"recebido_em" timestamp,
	"recebido_por_usuario_id" text,
	"recebido_por_email" text,
	"valor_recebido_em_centavos" integer,
	"observacao_recebimento" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configuracoes_pagamento_na_entrega_servico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"servico_frete_id" uuid NOT NULL,
	"aceita_pagamento_na_entrega" boolean DEFAULT false NOT NULL,
	"aceita_dinheiro" boolean DEFAULT false NOT NULL,
	"aceita_pix_na_entrega" boolean DEFAULT false NOT NULL,
	"aceita_debito" boolean DEFAULT false NOT NULL,
	"aceita_credito" boolean DEFAULT false NOT NULL,
	"valor_minimo_pedido_em_centavos" integer,
	"valor_maximo_pedido_em_centavos" integer,
	"valor_maximo_dinheiro_em_centavos" integer,
	"exige_troco" boolean DEFAULT true NOT NULL,
	"observacoes_cliente" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Correção de drift pré-existente, alheio ao pagamento na entrega.
-- A coluna já foi criada pela 0009_categoria_editorial_faq.sql (escrita à mão), mas o
-- snapshot do Drizzle nunca a registrou, então toda `generate` a reemitia. Sem o
-- IF NOT EXISTS a cadeia quebra em qualquer banco que já rodou a 0009 — inclusive produção.
-- O snapshot desta migration já contém a coluna, então a reemissão para de acontecer aqui.
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "description_bottom" text;--> statement-breakpoint
ALTER TABLE "checkout_pedido_historicos" ADD COLUMN "usuario_admin_id" text;--> statement-breakpoint
ALTER TABLE "checkout_pedido_historicos" ADD COLUMN "usuario_admin_email" text;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "chave_idempotencia" text;--> statement-breakpoint
ALTER TABLE "configuracoes_pagamento" ADD COLUMN "pagamento_na_entrega_ativo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "aceita_pagamento_na_entrega" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "aceita_pagamento_na_entrega" boolean;--> statement-breakpoint
ALTER TABLE "checkout_pedido_pagamento_entrega" ADD CONSTRAINT "checkout_pedido_pagamento_entrega_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_pedido_pagamento_entrega" ADD CONSTRAINT "checkout_pedido_pagamento_entrega_servico_frete_id_servicos_frete_id_fk" FOREIGN KEY ("servico_frete_id") REFERENCES "public"."servicos_frete"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_pedido_pagamento_entrega" ADD CONSTRAINT "checkout_pedido_pagamento_entrega_recebido_por_usuario_id_user_id_fk" FOREIGN KEY ("recebido_por_usuario_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "configuracoes_pagamento_na_entrega_servico" ADD CONSTRAINT "configuracoes_pagamento_na_entrega_servico_servico_frete_id_servicos_frete_id_fk" FOREIGN KEY ("servico_frete_id") REFERENCES "public"."servicos_frete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_pedido_pagamento_entrega_pedido_id_unique" ON "checkout_pedido_pagamento_entrega" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "checkout_pedido_pagamento_entrega_recebido_em_idx" ON "checkout_pedido_pagamento_entrega" USING btree ("recebido_em");--> statement-breakpoint
CREATE INDEX "checkout_pedido_pagamento_entrega_servico_frete_id_idx" ON "checkout_pedido_pagamento_entrega" USING btree ("servico_frete_id");--> statement-breakpoint
CREATE UNIQUE INDEX "configuracoes_pagamento_na_entrega_servico_servico_unique" ON "configuracoes_pagamento_na_entrega_servico" USING btree ("servico_frete_id");--> statement-breakpoint
CREATE INDEX "configuracoes_pagamento_na_entrega_servico_ativo_idx" ON "configuracoes_pagamento_na_entrega_servico" USING btree ("ativo");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_pedidos_chave_idempotencia_unique" ON "checkout_pedidos" USING btree ("chave_idempotencia");