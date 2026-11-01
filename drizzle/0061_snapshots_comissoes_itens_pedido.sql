CREATE TABLE "checkout_item_comissao_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comissao_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_item_comissao_evento_valido" CHECK ("checkout_item_comissao_eventos"."tipo" IN ('confirmada','cancelada','estornada'))
);
--> statement-breakpoint
CREATE TABLE "checkout_item_comissoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"pedido_item_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"representante_usuario_id" text NOT NULL,
	"fornecedor_id" uuid NOT NULL,
	"autorizacao_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"atribuido_por_usuario_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checkout_pedido_itens" ADD COLUMN "preco_comercial_unitario_em_centavos" integer;--> statement-breakpoint
ALTER TABLE "checkout_pedido_itens" ADD COLUMN "desconto_cupom_rateado_em_centavos" integer;--> statement-breakpoint
ALTER TABLE "checkout_item_comissao_eventos" ADD CONSTRAINT "checkout_item_comissao_eventos_comissao_id_checkout_item_comissoes_id_fk" FOREIGN KEY ("comissao_id") REFERENCES "public"."checkout_item_comissoes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_item_comissoes" ADD CONSTRAINT "checkout_item_comissoes_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_item_comissoes" ADD CONSTRAINT "checkout_item_comissoes_pedido_item_id_checkout_pedido_itens_id_fk" FOREIGN KEY ("pedido_item_id") REFERENCES "public"."checkout_pedido_itens"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_item_comissoes" ADD CONSTRAINT "checkout_item_comissoes_representante_usuario_id_user_id_fk" FOREIGN KEY ("representante_usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_item_comissoes" ADD CONSTRAINT "checkout_item_comissoes_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_item_comissoes" ADD CONSTRAINT "checkout_item_comissoes_autorizacao_id_autorizacoes_produtos_representantes_id_fk" FOREIGN KEY ("autorizacao_id") REFERENCES "public"."autorizacoes_produtos_representantes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_item_comissoes" ADD CONSTRAINT "checkout_item_comissoes_atribuido_por_usuario_id_user_id_fk" FOREIGN KEY ("atribuido_por_usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_item_comissao_evento_unico" ON "checkout_item_comissao_eventos" USING btree ("comissao_id","tipo");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_item_comissoes_item_unico" ON "checkout_item_comissoes" USING btree ("pedido_item_id");--> statement-breakpoint
CREATE INDEX "checkout_item_comissoes_pedido_idx" ON "checkout_item_comissoes" USING btree ("pedido_id");