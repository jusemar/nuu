CREATE TABLE "atendimentos_jaaa_produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"autorizacao_id" uuid,
	"atualizado_por_usuario_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identidades_jaaa_representantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"identidade" text NOT NULL,
	"ativa" boolean DEFAULT false NOT NULL,
	"atualizado_por_usuario_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identidades_jaaa_representantes_formato" CHECK ("identidades_jaaa_representantes"."identidade" ~ '^[a-z][a-z0-9_]{2,29}$')
);
--> statement-breakpoint
ALTER TABLE "atendimentos_jaaa_produtos" ADD CONSTRAINT "atendimentos_jaaa_produtos_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos_jaaa_produtos" ADD CONSTRAINT "atendimentos_jaaa_produtos_autorizacao_id_autorizacoes_produtos_representantes_id_fk" FOREIGN KEY ("autorizacao_id") REFERENCES "public"."autorizacoes_produtos_representantes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimentos_jaaa_produtos" ADD CONSTRAINT "atendimentos_jaaa_produtos_atualizado_por_usuario_id_user_id_fk" FOREIGN KEY ("atualizado_por_usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identidades_jaaa_representantes" ADD CONSTRAINT "identidades_jaaa_representantes_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identidades_jaaa_representantes" ADD CONSTRAINT "identidades_jaaa_representantes_atualizado_por_usuario_id_user_id_fk" FOREIGN KEY ("atualizado_por_usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimentos_jaaa_produtos_produto_unico" ON "atendimentos_jaaa_produtos" USING btree ("produto_id");--> statement-breakpoint
CREATE UNIQUE INDEX "identidades_jaaa_representantes_usuario_unico" ON "identidades_jaaa_representantes" USING btree ("usuario_id");