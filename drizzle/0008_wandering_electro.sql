CREATE TYPE "public"."atendimento_ia_conhecimento_situacao" AS ENUM('ativa', 'arquivada');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_tipo_conhecimento" AS ENUM('institucional', 'pergunta_resposta');--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "conteudo_estruturado" jsonb;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "criado_por_id" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "enviado_revisao_em" timestamp;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "enviado_revisao_por_id" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "motivo_alteracao" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "resumo_alteracao" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "reprovado_em" timestamp;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "reprovado_por_id" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "motivo_reprovacao" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "publicacao_bloqueada" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "motivo_bloqueio" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD COLUMN "restaurada_de_versao_id" uuid;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documentos_institucionais" ADD COLUMN "tipo_conhecimento" "atendimento_ia_tipo_conhecimento" DEFAULT 'institucional' NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documentos_institucionais" ADD COLUMN "titulo_administrativo" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documentos_institucionais" ADD COLUMN "situacao" "atendimento_ia_conhecimento_situacao" DEFAULT 'ativa' NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documentos_institucionais" ADD COLUMN "criado_por_id" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD CONSTRAINT "atendimento_ia_documento_versoes_criado_por_id_user_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD CONSTRAINT "atendimento_ia_documento_versoes_enviado_revisao_por_id_user_id_fk" FOREIGN KEY ("enviado_revisao_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD CONSTRAINT "atendimento_ia_documento_versoes_reprovado_por_id_user_id_fk" FOREIGN KEY ("reprovado_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD CONSTRAINT "atendimento_ia_documento_versoes_restaurada_de_versao_id_atendimento_ia_documento_versoes_id_fk" FOREIGN KEY ("restaurada_de_versao_id") REFERENCES "public"."atendimento_ia_documento_versoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documentos_institucionais" ADD CONSTRAINT "atendimento_ia_documentos_institucionais_criado_por_id_user_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;