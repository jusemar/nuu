ALTER TABLE "atendimento_ia_transferencias" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ALTER COLUMN "status" TYPE text USING "status"::text;--> statement-breakpoint
DROP TYPE "public"."atendimento_ia_transferencia_status";--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_transferencia_status" AS ENUM('solicitada', 'aguardando_atendimento', 'em_atendimento', 'concluida', 'oferecido', 'recusado', 'resumo_preparado', 'aguardando_confirmacao', 'confirmado', 'cancelado', 'link_gerado', 'whatsapp_aberto', 'falha_ao_gerar_link', 'expirado');--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ALTER COLUMN "status" TYPE "public"."atendimento_ia_transferencia_status" USING "status"::"public"."atendimento_ia_transferencia_status";--> statement-breakpoint
DROP INDEX "atendimento_ia_confirmacoes_operacao_pendente_unique";--> statement-breakpoint
ALTER TABLE "atendimento_ia_confirmacoes_ferramentas" ALTER COLUMN "usuario_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ALTER COLUMN "status" SET DEFAULT 'oferecido';--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "usuario_id" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "execucao_solicitacao_id" uuid;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "referencia_sessao_hash" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "canal" text DEFAULT 'whatsapp' NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "resumo_estruturado" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "hash_resumo" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "referencia_destinatario_hash" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "referencia_confirmacao_id" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "chave_idempotencia" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "expira_em" timestamp;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "oferta_confirmada_em" timestamp;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "confirmado_em" timestamp;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "link_gerado_em" timestamp;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD COLUMN "whatsapp_aberto_em" timestamp;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD CONSTRAINT "atendimento_ia_transferencias_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD CONSTRAINT "atendimento_ia_transferencias_execucao_solicitacao_id_atendimento_ia_execucoes_id_fk" FOREIGN KEY ("execucao_solicitacao_id") REFERENCES "public"."atendimento_ia_execucoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_confirmacoes_operacao_pendente_unique" ON "atendimento_ia_confirmacoes_ferramentas" USING btree ("referencia_sessao_hash","conversa_id","ferramenta","hash_parametros") WHERE "atendimento_ia_confirmacoes_ferramentas"."status" in ('pendente', 'confirmada');--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD CONSTRAINT "atendimento_ia_transferencias_chave_idempotencia_unique" UNIQUE("chave_idempotencia");
