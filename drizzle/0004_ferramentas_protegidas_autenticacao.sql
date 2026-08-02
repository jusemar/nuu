CREATE TYPE "public"."atendimento_ia_confirmacao_status" AS ENUM('pendente', 'confirmada', 'consumida', 'cancelada', 'expirada', 'invalidada');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_operacao_protegida_status" AS ENUM('processando', 'concluida', 'falha_sem_execucao', 'resultado_incerto');--> statement-breakpoint
CREATE TABLE "atendimento_ia_confirmacoes_ferramentas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"referencia_sessao_hash" text NOT NULL,
	"conversa_id" uuid NOT NULL,
	"execucao_solicitacao_id" uuid NOT NULL,
	"ferramenta" text NOT NULL,
	"acao" text NOT NULL,
	"recurso_tipo" text NOT NULL,
	"recurso_id" text NOT NULL,
	"parametros_essenciais" jsonb NOT NULL,
	"hash_parametros" text NOT NULL,
	"status" "atendimento_ia_confirmacao_status" DEFAULT 'pendente' NOT NULL,
	"expira_em" timestamp NOT NULL,
	"confirmada_em" timestamp,
	"consumida_em" timestamp,
	"cancelada_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_operacoes_protegidas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"confirmacao_id" uuid NOT NULL,
	"execucao_id" uuid NOT NULL,
	"ferramenta" text NOT NULL,
	"acao" text NOT NULL,
	"recurso_tipo" text NOT NULL,
	"recurso_id" text NOT NULL,
	"hash_parametros" text NOT NULL,
	"chave_idempotencia" text NOT NULL,
	"status" "atendimento_ia_operacao_protegida_status" DEFAULT 'processando' NOT NULL,
	"resultado" jsonb,
	"erro_sanitizado" text,
	"iniciado_em" timestamp DEFAULT now() NOT NULL,
	"concluido_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_ia_confirmacoes_ferramentas" ADD CONSTRAINT "atendimento_ia_confirmacoes_ferramentas_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_confirmacoes_ferramentas" ADD CONSTRAINT "atendimento_ia_confirmacoes_ferramentas_conversa_id_atendimento_ia_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."atendimento_ia_conversas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_confirmacoes_ferramentas" ADD CONSTRAINT "atendimento_ia_confirmacoes_ferramentas_execucao_solicitacao_id_atendimento_ia_execucoes_id_fk" FOREIGN KEY ("execucao_solicitacao_id") REFERENCES "public"."atendimento_ia_execucoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_operacoes_protegidas" ADD CONSTRAINT "atendimento_ia_operacoes_protegidas_confirmacao_id_atendimento_ia_confirmacoes_ferramentas_id_fk" FOREIGN KEY ("confirmacao_id") REFERENCES "public"."atendimento_ia_confirmacoes_ferramentas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_operacoes_protegidas" ADD CONSTRAINT "atendimento_ia_operacoes_protegidas_execucao_id_atendimento_ia_execucoes_id_fk" FOREIGN KEY ("execucao_id") REFERENCES "public"."atendimento_ia_execucoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "atendimento_ia_confirmacoes_conversa_status_idx" ON "atendimento_ia_confirmacoes_ferramentas" USING btree ("conversa_id","status","expira_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_confirmacoes_usuario_idx" ON "atendimento_ia_confirmacoes_ferramentas" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_confirmacoes_operacao_pendente_unique" ON "atendimento_ia_confirmacoes_ferramentas" USING btree ("usuario_id","conversa_id","ferramenta","hash_parametros") WHERE "atendimento_ia_confirmacoes_ferramentas"."status" in ('pendente', 'confirmada');--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_operacoes_protegidas_idempotencia_unique" ON "atendimento_ia_operacoes_protegidas" USING btree ("chave_idempotencia");--> statement-breakpoint
CREATE INDEX "atendimento_ia_operacoes_protegidas_confirmacao_idx" ON "atendimento_ia_operacoes_protegidas" USING btree ("confirmacao_id");--> statement-breakpoint
CREATE INDEX "atendimento_ia_operacoes_protegidas_execucao_idx" ON "atendimento_ia_operacoes_protegidas" USING btree ("execucao_id");
