CREATE TYPE "public"."administrador_status" AS ENUM('ativo', 'desativado');--> statement-breakpoint
CREATE TYPE "public"."auditoria_administrativa_resultado" AS ENUM('sucesso', 'negado', 'falha');--> statement-breakpoint
CREATE TYPE "public"."convite_administrativo_status" AS ENUM('pendente', 'aceito', 'expirado', 'revogado');--> statement-breakpoint
CREATE TYPE "public"."efeito_permissao_administrador" AS ENUM('permitir', 'negar');--> statement-breakpoint
CREATE TYPE "public"."funcao_administrativa_status" AS ENUM('ativa', 'desativada');--> statement-breakpoint
CREATE TYPE "public"."permissao_administrativa_status" AS ENUM('ativa', 'desativada');--> statement-breakpoint
CREATE TABLE "administradores_funcoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"administrador_id" uuid NOT NULL,
	"funcao_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "administradores_permissoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"administrador_id" uuid NOT NULL,
	"permissao_id" uuid NOT NULL,
	"efeito" "efeito_permissao_administrador" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funcoes_permissoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"funcao_id" uuid NOT NULL,
	"permissao_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditorias_administrativas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ator_administrador_id" uuid,
	"alvo_administrador_id" uuid,
	"acao" text NOT NULL,
	"resultado" "auditoria_administrativa_resultado" NOT NULL,
	"recurso_tipo" text,
	"recurso_id" text,
	"metadados" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "convites_administrativos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_destinatario" text NOT NULL,
	"usuario_destinatario_id" text,
	"emissor_administrador_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"status" "convite_administrativo_status" DEFAULT 'pendente' NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"aceito_em" timestamp with time zone,
	"revogado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "convites_funcoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"convite_id" uuid NOT NULL,
	"funcao_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "convites_permissoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"convite_id" uuid NOT NULL,
	"permissao_id" uuid NOT NULL,
	"efeito" "efeito_permissao_administrador" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "administradores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"status" "administrador_status" DEFAULT 'ativo' NOT NULL,
	"administrador_principal" boolean DEFAULT false NOT NULL,
	"versao_autorizacao" integer DEFAULT 1 NOT NULL,
	"ativado_em" timestamp with time zone,
	"desativado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "administradores_versao_autorizacao_positiva_check" CHECK ("administradores"."versao_autorizacao" > 0)
);
--> statement-breakpoint
CREATE TABLE "funcoes_administrativas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chave" text NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"funcao_sistema" boolean DEFAULT false NOT NULL,
	"status" "funcao_administrativa_status" DEFAULT 'ativa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissoes_administrativas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chave" text NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"modulo" text NOT NULL,
	"status" "permissao_administrativa_status" DEFAULT 'ativa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissoes_administrativas_chave_formato_check" CHECK ("permissoes_administrativas"."chave" ~ '^[a-z0-9_]+[.][a-z0-9_]+$')
);
--> statement-breakpoint
ALTER TABLE "administradores_funcoes" ADD CONSTRAINT "administradores_funcoes_administrador_id_administradores_id_fk" FOREIGN KEY ("administrador_id") REFERENCES "public"."administradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "administradores_funcoes" ADD CONSTRAINT "administradores_funcoes_funcao_id_funcoes_administrativas_id_fk" FOREIGN KEY ("funcao_id") REFERENCES "public"."funcoes_administrativas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "administradores_permissoes" ADD CONSTRAINT "administradores_permissoes_administrador_id_administradores_id_fk" FOREIGN KEY ("administrador_id") REFERENCES "public"."administradores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "administradores_permissoes" ADD CONSTRAINT "administradores_permissoes_permissao_id_permissoes_administrativas_id_fk" FOREIGN KEY ("permissao_id") REFERENCES "public"."permissoes_administrativas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcoes_permissoes" ADD CONSTRAINT "funcoes_permissoes_funcao_id_funcoes_administrativas_id_fk" FOREIGN KEY ("funcao_id") REFERENCES "public"."funcoes_administrativas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcoes_permissoes" ADD CONSTRAINT "funcoes_permissoes_permissao_id_permissoes_administrativas_id_fk" FOREIGN KEY ("permissao_id") REFERENCES "public"."permissoes_administrativas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditorias_administrativas" ADD CONSTRAINT "auditorias_administrativas_ator_administrador_id_administradores_id_fk" FOREIGN KEY ("ator_administrador_id") REFERENCES "public"."administradores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditorias_administrativas" ADD CONSTRAINT "auditorias_administrativas_alvo_administrador_id_administradores_id_fk" FOREIGN KEY ("alvo_administrador_id") REFERENCES "public"."administradores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convites_administrativos" ADD CONSTRAINT "convites_administrativos_usuario_destinatario_id_user_id_fk" FOREIGN KEY ("usuario_destinatario_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convites_administrativos" ADD CONSTRAINT "convites_administrativos_emissor_administrador_id_administradores_id_fk" FOREIGN KEY ("emissor_administrador_id") REFERENCES "public"."administradores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convites_funcoes" ADD CONSTRAINT "convites_funcoes_convite_id_convites_administrativos_id_fk" FOREIGN KEY ("convite_id") REFERENCES "public"."convites_administrativos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convites_funcoes" ADD CONSTRAINT "convites_funcoes_funcao_id_funcoes_administrativas_id_fk" FOREIGN KEY ("funcao_id") REFERENCES "public"."funcoes_administrativas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convites_permissoes" ADD CONSTRAINT "convites_permissoes_convite_id_convites_administrativos_id_fk" FOREIGN KEY ("convite_id") REFERENCES "public"."convites_administrativos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convites_permissoes" ADD CONSTRAINT "convites_permissoes_permissao_id_permissoes_administrativas_id_fk" FOREIGN KEY ("permissao_id") REFERENCES "public"."permissoes_administrativas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "administradores" ADD CONSTRAINT "administradores_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "administradores_funcoes_administrador_funcao_unique" ON "administradores_funcoes" USING btree ("administrador_id","funcao_id");--> statement-breakpoint
CREATE INDEX "administradores_funcoes_funcao_id_idx" ON "administradores_funcoes" USING btree ("funcao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "administradores_permissoes_admin_permissao_unique" ON "administradores_permissoes" USING btree ("administrador_id","permissao_id");--> statement-breakpoint
CREATE INDEX "administradores_permissoes_permissao_id_idx" ON "administradores_permissoes" USING btree ("permissao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "funcoes_permissoes_funcao_permissao_unique" ON "funcoes_permissoes" USING btree ("funcao_id","permissao_id");--> statement-breakpoint
CREATE INDEX "funcoes_permissoes_permissao_id_idx" ON "funcoes_permissoes" USING btree ("permissao_id");--> statement-breakpoint
CREATE INDEX "auditorias_administrativas_ator_data_idx" ON "auditorias_administrativas" USING btree ("ator_administrador_id","created_at");--> statement-breakpoint
CREATE INDEX "auditorias_administrativas_alvo_data_idx" ON "auditorias_administrativas" USING btree ("alvo_administrador_id","created_at");--> statement-breakpoint
CREATE INDEX "auditorias_administrativas_acao_resultado_data_idx" ON "auditorias_administrativas" USING btree ("acao","resultado","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "convites_administrativos_token_hash_unique" ON "convites_administrativos" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "convites_administrativos_email_status_idx" ON "convites_administrativos" USING btree ("email_destinatario","status");--> statement-breakpoint
CREATE INDEX "convites_administrativos_usuario_destinatario_idx" ON "convites_administrativos" USING btree ("usuario_destinatario_id");--> statement-breakpoint
CREATE INDEX "convites_administrativos_emissor_idx" ON "convites_administrativos" USING btree ("emissor_administrador_id");--> statement-breakpoint
CREATE INDEX "convites_administrativos_status_expiracao_idx" ON "convites_administrativos" USING btree ("status","expira_em");--> statement-breakpoint
CREATE UNIQUE INDEX "convites_funcoes_convite_funcao_unique" ON "convites_funcoes" USING btree ("convite_id","funcao_id");--> statement-breakpoint
CREATE INDEX "convites_funcoes_funcao_id_idx" ON "convites_funcoes" USING btree ("funcao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "convites_permissoes_convite_permissao_unique" ON "convites_permissoes" USING btree ("convite_id","permissao_id");--> statement-breakpoint
CREATE INDEX "convites_permissoes_permissao_id_idx" ON "convites_permissoes" USING btree ("permissao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "administradores_usuario_id_unique" ON "administradores" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "administradores_status_idx" ON "administradores" USING btree ("status");--> statement-breakpoint
CREATE INDEX "administradores_principal_status_idx" ON "administradores" USING btree ("administrador_principal","status");--> statement-breakpoint
CREATE UNIQUE INDEX "funcoes_administrativas_chave_unique" ON "funcoes_administrativas" USING btree ("chave");--> statement-breakpoint
CREATE INDEX "funcoes_administrativas_status_idx" ON "funcoes_administrativas" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "permissoes_administrativas_chave_unique" ON "permissoes_administrativas" USING btree ("chave");--> statement-breakpoint
CREATE INDEX "permissoes_administrativas_modulo_status_idx" ON "permissoes_administrativas" USING btree ("modulo","status");