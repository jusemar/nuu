CREATE TYPE "public"."atendimento_ia_laboratorio_modo_execucao" AS ENUM('sincrono', 'assincrono');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_laboratorio_resultado" AS ENUM('aprovado', 'reprovado', 'inconclusivo', 'bloqueado');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_laboratorio_status" AS ENUM('pendente', 'processando', 'concluida', 'falhou', 'cancelada', 'bloqueada');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_laboratorio_tipo_comparacao" AS ENUM('conhecimento', 'comportamento', 'combinado', 'lote');--> statement-breakpoint
CREATE TABLE "atendimento_ia_execucoes_laboratorio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_comparacao" "atendimento_ia_laboratorio_tipo_comparacao" NOT NULL,
	"modo_execucao" "atendimento_ia_laboratorio_modo_execucao" NOT NULL,
	"versao_publicada_conhecimento_id" uuid,
	"versao_candidata_conhecimento_id" uuid,
	"versao_publicada_comportamento_id" uuid,
	"versao_candidata_comportamento_id" uuid,
	"conjunto_teste_id" uuid,
	"caso_teste_versao_id" uuid,
	"status" "atendimento_ia_laboratorio_status" DEFAULT 'pendente' NOT NULL,
	"configuracao_congelada" jsonb NOT NULL,
	"hashes_congelados" jsonb NOT NULL,
	"chave_idempotencia" text NOT NULL,
	"solicitado_por_id" text NOT NULL,
	"iniciado_em" timestamp,
	"concluido_em" timestamp,
	"cancelado_em" timestamp,
	"custo_estimado" numeric(12, 6) DEFAULT '0' NOT NULL,
	"tokens_entrada" integer DEFAULT 0 NOT NULL,
	"tokens_saida" integer DEFAULT 0 NOT NULL,
	"erro_sanitizado" text,
	"expira_em" timestamp NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_resultados_laboratorio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execucao_laboratorio_id" uuid NOT NULL,
	"caso_teste_versao_id" uuid NOT NULL,
	"resposta_publicada" text NOT NULL,
	"resposta_candidata" text NOT NULL,
	"conhecimentos_usados_publicada" jsonb NOT NULL,
	"conhecimentos_usados_candidata" jsonb NOT NULL,
	"conflitos" jsonb NOT NULL,
	"fontes_ausentes" jsonb NOT NULL,
	"ferramentas_solicitadas" jsonb NOT NULL,
	"ferramentas_simuladas" jsonb NOT NULL,
	"necessidade_consulta_real" boolean DEFAULT false NOT NULL,
	"violacoes" jsonb NOT NULL,
	"resultado_automatico" "atendimento_ia_laboratorio_resultado" NOT NULL,
	"decisao_humana" "atendimento_ia_laboratorio_resultado",
	"comentario_avaliador" text,
	"avaliador_id" text,
	"tokens" integer DEFAULT 0 NOT NULL,
	"duracao" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes_laboratorio" ADD CONSTRAINT "atendimento_ia_execucoes_laboratorio_versao_publicada_conhecimento_id_atendimento_ia_documento_versoes_id_fk" FOREIGN KEY ("versao_publicada_conhecimento_id") REFERENCES "public"."atendimento_ia_documento_versoes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes_laboratorio" ADD CONSTRAINT "atendimento_ia_execucoes_laboratorio_versao_candidata_conhecimento_id_atendimento_ia_documento_versoes_id_fk" FOREIGN KEY ("versao_candidata_conhecimento_id") REFERENCES "public"."atendimento_ia_documento_versoes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes_laboratorio" ADD CONSTRAINT "atendimento_ia_execucoes_laboratorio_versao_publicada_comportamento_id_atendimento_ia_comportamento_versoes_id_fk" FOREIGN KEY ("versao_publicada_comportamento_id") REFERENCES "public"."atendimento_ia_comportamento_versoes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes_laboratorio" ADD CONSTRAINT "atendimento_ia_execucoes_laboratorio_versao_candidata_comportamento_id_atendimento_ia_comportamento_versoes_id_fk" FOREIGN KEY ("versao_candidata_comportamento_id") REFERENCES "public"."atendimento_ia_comportamento_versoes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes_laboratorio" ADD CONSTRAINT "atendimento_ia_execucoes_laboratorio_conjunto_teste_id_atendimento_ia_conjuntos_teste_id_fk" FOREIGN KEY ("conjunto_teste_id") REFERENCES "public"."atendimento_ia_conjuntos_teste"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes_laboratorio" ADD CONSTRAINT "atendimento_ia_execucoes_laboratorio_caso_teste_versao_id_atendimento_ia_caso_teste_versoes_id_fk" FOREIGN KEY ("caso_teste_versao_id") REFERENCES "public"."atendimento_ia_caso_teste_versoes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes_laboratorio" ADD CONSTRAINT "atendimento_ia_execucoes_laboratorio_solicitado_por_id_user_id_fk" FOREIGN KEY ("solicitado_por_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resultados_laboratorio" ADD CONSTRAINT "atendimento_ia_resultados_laboratorio_execucao_laboratorio_id_atendimento_ia_execucoes_laboratorio_id_fk" FOREIGN KEY ("execucao_laboratorio_id") REFERENCES "public"."atendimento_ia_execucoes_laboratorio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resultados_laboratorio" ADD CONSTRAINT "atendimento_ia_resultados_laboratorio_caso_teste_versao_id_atendimento_ia_caso_teste_versoes_id_fk" FOREIGN KEY ("caso_teste_versao_id") REFERENCES "public"."atendimento_ia_caso_teste_versoes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resultados_laboratorio" ADD CONSTRAINT "atendimento_ia_resultados_laboratorio_avaliador_id_user_id_fk" FOREIGN KEY ("avaliador_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_execucoes_lab_idempotencia_unique" ON "atendimento_ia_execucoes_laboratorio" USING btree ("chave_idempotencia");--> statement-breakpoint
CREATE INDEX "atendimento_ia_execucoes_lab_status_criado_idx" ON "atendimento_ia_execucoes_laboratorio" USING btree ("status","criado_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_execucoes_lab_expira_idx" ON "atendimento_ia_execucoes_laboratorio" USING btree ("expira_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_resultados_lab_execucao_idx" ON "atendimento_ia_resultados_laboratorio" USING btree ("execucao_laboratorio_id");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_resultados_lab_execucao_caso_unique" ON "atendimento_ia_resultados_laboratorio" USING btree ("execucao_laboratorio_id","caso_teste_versao_id");
