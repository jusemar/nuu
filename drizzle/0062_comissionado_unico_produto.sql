CREATE TABLE "representantes_comissionados_produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"autorizacao_id" uuid,
	"atualizado_por_usuario_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "representantes_comissionados_produtos" ADD CONSTRAINT "representantes_comissionados_produtos_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "representantes_comissionados_produtos" ADD CONSTRAINT "representantes_comissionados_produtos_autorizacao_id_autorizacoes_produtos_representantes_id_fk" FOREIGN KEY ("autorizacao_id") REFERENCES "public"."autorizacoes_produtos_representantes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "representantes_comissionados_produtos" ADD CONSTRAINT "representantes_comissionados_produtos_atualizado_por_usuario_id_user_id_fk" FOREIGN KEY ("atualizado_por_usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "representante_comissionado_produto_unico" ON "representantes_comissionados_produtos" USING btree ("produto_id");