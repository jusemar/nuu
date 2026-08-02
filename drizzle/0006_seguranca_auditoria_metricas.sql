CREATE TYPE "public"."atendimento_ia_auditoria_categoria" AS ENUM('operacao', 'seguranca', 'privacidade', 'integracao', 'limite');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_auditoria_resultado" AS ENUM('sucesso_comprovado', 'recusa', 'falha', 'cancelamento', 'expiracao', 'parcial', 'incerto', 'indisponibilidade');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_auditoria_severidade" AS ENUM('informativo', 'atencao', 'risco_relevante', 'critico');--> statement-breakpoint
CREATE TABLE "atendimento_ia_limites_uso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escopo" text NOT NULL,
	"referencia_hash" text NOT NULL,
	"recurso" text NOT NULL,
	"janela_inicio" timestamp NOT NULL,
	"janela_fim" timestamp NOT NULL,
	"quantidade" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "correlacao_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "categoria" "atendimento_ia_auditoria_categoria" DEFAULT 'operacao' NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "severidade" "atendimento_ia_auditoria_severidade" DEFAULT 'informativo' NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "resultado" "atendimento_ia_auditoria_resultado";--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "usuario_id" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "referencia_sessao_hash" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "acao" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "autorizacao" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "estado_anterior" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "estado_posterior" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "codigo_falha" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "versoes" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "hash_integridade" text DEFAULT md5(random()::text || clock_timestamp()::text) NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "corrige_evento_id" uuid;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD COLUMN "justificativa_correcao" text;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_limites_uso_escopo_janela_unique" ON "atendimento_ia_limites_uso" USING btree ("escopo","referencia_hash","recurso","janela_inicio");--> statement-breakpoint
CREATE INDEX "atendimento_ia_limites_uso_expiracao_idx" ON "atendimento_ia_limites_uso" USING btree ("janela_fim");--> statement-breakpoint
CREATE INDEX "atendimento_ia_limites_uso_recurso_idx" ON "atendimento_ia_limites_uso" USING btree ("recurso","janela_inicio");--> statement-breakpoint
CREATE INDEX "atendimento_ia_auditorias_correlacao_idx" ON "atendimento_ia_auditorias" USING btree ("correlacao_id");--> statement-breakpoint
CREATE INDEX "atendimento_ia_auditorias_categoria_severidade_idx" ON "atendimento_ia_auditorias" USING btree ("categoria","severidade","criado_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_auditorias_sessao_idx" ON "atendimento_ia_auditorias" USING btree ("referencia_sessao_hash","criado_em");
--> statement-breakpoint
CREATE FUNCTION "atendimento_ia_impedir_reescrita_auditoria"() RETURNS trigger AS $$
BEGIN
  -- Exclusões e anonimizações legítimas podem apenas remover vínculos por FK.
  -- Todo conteúdo substantivo do evento continua imutável.
  IF
    to_jsonb(NEW) - ARRAY['conversa_id', 'mensagem_id', 'execucao_id', 'execucao_ferramenta_id'] =
    to_jsonb(OLD) - ARRAY['conversa_id', 'mensagem_id', 'execucao_id', 'execucao_ferramenta_id']
    AND (NEW.conversa_id IS NULL OR NEW.conversa_id IS NOT DISTINCT FROM OLD.conversa_id)
    AND (NEW.mensagem_id IS NULL OR NEW.mensagem_id IS NOT DISTINCT FROM OLD.mensagem_id)
    AND (NEW.execucao_id IS NULL OR NEW.execucao_id IS NOT DISTINCT FROM OLD.execucao_id)
    AND (NEW.execucao_ferramenta_id IS NULL OR NEW.execucao_ferramenta_id IS NOT DISTINCT FROM OLD.execucao_ferramenta_id)
  THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'AUDITORIA_IMUTAVEL';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "atendimento_ia_auditorias_bloquear_update"
BEFORE UPDATE ON "atendimento_ia_auditorias"
FOR EACH ROW EXECUTE FUNCTION "atendimento_ia_impedir_reescrita_auditoria"();
