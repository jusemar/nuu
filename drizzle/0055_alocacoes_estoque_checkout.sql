CREATE TYPE "public"."checkout_estoque_alocacao_status" AS ENUM('alocada', 'liberada', 'comprometida');--> statement-breakpoint
CREATE TABLE "checkout_estoque_alocacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"variante_id" uuid NOT NULL,
	"quantidade" integer NOT NULL,
	"modalidade" text DEFAULT 'stock' NOT NULL,
	"status" "checkout_estoque_alocacao_status" DEFAULT 'alocada' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_estoque_alocacoes_quantidade_positiva" CHECK ("checkout_estoque_alocacoes"."quantidade" > 0),
	CONSTRAINT "checkout_estoque_alocacoes_modalidade_stock" CHECK ("checkout_estoque_alocacoes"."modalidade" = 'stock')
);
--> statement-breakpoint
ALTER TABLE "checkout_estoque_alocacoes" ADD CONSTRAINT "checkout_estoque_alocacoes_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_estoque_alocacoes" ADD CONSTRAINT "checkout_estoque_alocacoes_variante_id_product_variant_id_fk" FOREIGN KEY ("variante_id") REFERENCES "public"."product_variant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_estoque_alocacoes_pedido_variante_unique" ON "checkout_estoque_alocacoes" USING btree ("pedido_id","variante_id");--> statement-breakpoint
CREATE INDEX "checkout_estoque_alocacoes_variante_status_idx" ON "checkout_estoque_alocacoes" USING btree ("variante_id","status");