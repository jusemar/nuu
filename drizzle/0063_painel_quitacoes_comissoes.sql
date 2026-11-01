CREATE TABLE "checkout_item_comissao_quitacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comissao_id" uuid NOT NULL,
	"responsavel_administrador_id" uuid NOT NULL,
	"data_quitacao" timestamp with time zone NOT NULL,
	"valor_em_centavos" bigint NOT NULL,
	"referencia" text,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_item_comissao_quitacao_valor_valido" CHECK ("checkout_item_comissao_quitacoes"."valor_em_centavos" BETWEEN 0 AND 9007199254740991)
);
--> statement-breakpoint
ALTER TABLE "checkout_item_comissao_quitacoes" ADD CONSTRAINT "checkout_item_comissao_quitacoes_comissao_id_checkout_item_comissoes_id_fk" FOREIGN KEY ("comissao_id") REFERENCES "public"."checkout_item_comissoes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_item_comissao_quitacoes" ADD CONSTRAINT "checkout_item_comissao_quitacoes_responsavel_administrador_id_administradores_id_fk" FOREIGN KEY ("responsavel_administrador_id") REFERENCES "public"."administradores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_item_comissao_quitacao_unica" ON "checkout_item_comissao_quitacoes" USING btree ("comissao_id");--> statement-breakpoint
CREATE INDEX "checkout_item_comissoes_titular_data_idx" ON "checkout_item_comissoes" USING btree ("representante_usuario_id","created_at","id");--> statement-breakpoint
CREATE INDEX "checkout_item_comissoes_data_idx" ON "checkout_item_comissoes" USING btree ("created_at","id");