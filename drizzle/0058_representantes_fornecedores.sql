CREATE TABLE "autorizacoes_produtos_representantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"representante_fornecedor_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"ativa" boolean DEFAULT false NOT NULL,
	"criado_por_usuario_id" text NOT NULL,
	"atualizado_por_usuario_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "representantes_fornecedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"fornecedor_id" uuid NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"criado_por_usuario_id" text NOT NULL,
	"atualizado_por_usuario_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "autorizacoes_produtos_representantes" ADD CONSTRAINT "autorizacoes_produtos_representantes_representante_fornecedor_id_representantes_fornecedores_id_fk" FOREIGN KEY ("representante_fornecedor_id") REFERENCES "public"."representantes_fornecedores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autorizacoes_produtos_representantes" ADD CONSTRAINT "autorizacoes_produtos_representantes_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autorizacoes_produtos_representantes" ADD CONSTRAINT "autorizacoes_produtos_representantes_criado_por_usuario_id_user_id_fk" FOREIGN KEY ("criado_por_usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autorizacoes_produtos_representantes" ADD CONSTRAINT "autorizacoes_produtos_representantes_atualizado_por_usuario_id_user_id_fk" FOREIGN KEY ("atualizado_por_usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "representantes_fornecedores" ADD CONSTRAINT "representantes_fornecedores_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "representantes_fornecedores" ADD CONSTRAINT "representantes_fornecedores_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "representantes_fornecedores" ADD CONSTRAINT "representantes_fornecedores_criado_por_usuario_id_user_id_fk" FOREIGN KEY ("criado_por_usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "representantes_fornecedores" ADD CONSTRAINT "representantes_fornecedores_atualizado_por_usuario_id_user_id_fk" FOREIGN KEY ("atualizado_por_usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "autorizacoes_representantes_vinculo_produto_unico" ON "autorizacoes_produtos_representantes" USING btree ("representante_fornecedor_id","produto_id");--> statement-breakpoint
CREATE INDEX "autorizacoes_representantes_produto_idx" ON "autorizacoes_produtos_representantes" USING btree ("produto_id");--> statement-breakpoint
CREATE UNIQUE INDEX "representantes_fornecedores_usuario_fornecedor_unico" ON "representantes_fornecedores" USING btree ("usuario_id","fornecedor_id");--> statement-breakpoint
CREATE INDEX "representantes_fornecedores_fornecedor_ativo_idx" ON "representantes_fornecedores" USING btree ("fornecedor_id","ativo");