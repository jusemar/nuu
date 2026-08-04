CREATE TYPE "public"."atendimento_ia_papel_admin" AS ENUM('gestor_principal', 'revisor', 'visualizador');--> statement-breakpoint
CREATE TABLE "atendimento_ia_papeis_admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"papel" "atendimento_ia_papel_admin" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"capacidades_adicionais" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"origem" text NOT NULL,
	"atribuido_por_id" text,
	"atribuido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"revogado_por_id" text,
	"revogado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_ia_papeis_admin" ADD CONSTRAINT "atendimento_ia_papeis_admin_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_papeis_admin" ADD CONSTRAINT "atendimento_ia_papeis_admin_atribuido_por_id_user_id_fk" FOREIGN KEY ("atribuido_por_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_papeis_admin" ADD CONSTRAINT "atendimento_ia_papeis_admin_revogado_por_id_user_id_fk" FOREIGN KEY ("revogado_por_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_papeis_admin_usuario_ativo_unique" ON "atendimento_ia_papeis_admin" USING btree ("usuario_id") WHERE "atendimento_ia_papeis_admin"."ativo" = true;--> statement-breakpoint
CREATE INDEX "atendimento_ia_papeis_admin_papel_ativo_idx" ON "atendimento_ia_papeis_admin" USING btree ("papel","ativo");--> statement-breakpoint
CREATE INDEX "atendimento_ia_papeis_admin_atribuido_por_idx" ON "atendimento_ia_papeis_admin" USING btree ("atribuido_por_id");