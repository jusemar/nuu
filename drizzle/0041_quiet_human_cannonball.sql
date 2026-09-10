CREATE TYPE "public"."convite_administrativo_tipo_identificador" AS ENUM('email', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."prova_posse_convite_finalidade" AS ENUM('admin_convite');--> statement-breakpoint
CREATE TABLE "provas_posse_convites_administrativos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"convite_id" uuid NOT NULL,
	"telefone_normalizado" text NOT NULL,
	"usuario_id" text,
	"finalidade" "prova_posse_convite_finalidade" DEFAULT 'admin_convite' NOT NULL,
	"contexto_hash" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"confirmado_em" timestamp with time zone,
	"consumido_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "convites_administrativos" ALTER COLUMN "email_destinatario" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "convites_administrativos" ADD COLUMN "tipo_identificador" "convite_administrativo_tipo_identificador" DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE "convites_administrativos" ADD COLUMN "identificador_normalizado" text;--> statement-breakpoint
ALTER TABLE "provas_posse_convites_administrativos" ADD CONSTRAINT "provas_posse_convites_administrativos_convite_id_convites_administrativos_id_fk" FOREIGN KEY ("convite_id") REFERENCES "public"."convites_administrativos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provas_posse_convites_administrativos" ADD CONSTRAINT "provas_posse_convites_administrativos_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "provas_posse_convites_contexto_unique" ON "provas_posse_convites_administrativos" USING btree ("convite_id","contexto_hash");--> statement-breakpoint
CREATE INDEX "provas_posse_convites_telefone_idx" ON "provas_posse_convites_administrativos" USING btree ("telefone_normalizado");--> statement-breakpoint
CREATE INDEX "provas_posse_convites_usuario_idx" ON "provas_posse_convites_administrativos" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "provas_posse_convites_expiracao_idx" ON "provas_posse_convites_administrativos" USING btree ("expira_em");--> statement-breakpoint
CREATE INDEX "convites_administrativos_identificador_status_idx" ON "convites_administrativos" USING btree ("tipo_identificador","identificador_normalizado","status");