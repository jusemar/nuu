ALTER TABLE "perfis_clientes" ADD COLUMN "observacao_cliente" text;--> statement-breakpoint
ALTER TABLE "enderecos_clientes" ADD COLUMN "autorizar_entrega_vizinho" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "enderecos_clientes" ADD COLUMN "nome_vizinho" text;--> statement-breakpoint
ALTER TABLE "enderecos_clientes" ADD COLUMN "observacao_vizinho" text;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "observacao_cliente" text;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "autorizar_entrega_vizinho" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "nome_vizinho" text;--> statement-breakpoint
ALTER TABLE "checkout_pedidos" ADD COLUMN "observacao_vizinho" text;
