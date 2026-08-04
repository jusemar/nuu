CREATE TYPE "public"."atendimento_ia_avaliacao_status" AS ENUM('registrada', 'substituida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_classificacao_problema" AS ENUM('resposta_incorreta', 'resposta_sem_fonte', 'fonte_desatualizada', 'conflito_fontes', 'lacuna_conhecimento', 'ferramenta_ausente', 'ferramenta_falhou', 'consulta_real_omitida', 'fora_escopo_incorreto', 'transferencia_prematura', 'transferencia_ausente', 'problema_tom', 'problema_clareza', 'risco_seguranca', 'exposicao_dados', 'outro');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_evidencia_tipo" AS ENUM('conversa', 'mensagem', 'execucao', 'avaliacao', 'ocorrencia', 'transferencia', 'resultado_rag');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_proposta_status" AS ENUM('aberta', 'em_triagem', 'aceita', 'em_implementacao', 'aguardando_testes', 'concluida', 'rejeitada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_resultado_avaliacao" AS ENUM('aprovado', 'precisa_melhorar', 'reprovado');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_revisao_status" AS ENUM('pendente', 'em_analise', 'aprovada', 'reprovada', 'cancelada', 'substituida');--> statement-breakpoint
CREATE TABLE "atendimento_ia_proposta_evidencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposta_id" uuid NOT NULL,
	"tipo" "atendimento_ia_evidencia_tipo" NOT NULL,
	"referencia_id" uuid NOT NULL,
	"descricao_sanitizada" text NOT NULL,
	"data_evidencia" timestamp NOT NULL,
	"criado_por_id" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_propostas_melhoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text NOT NULL,
	"categoria" text NOT NULL,
	"criterio_aceite" text NOT NULL,
	"impacto" text NOT NULL,
	"prioridade" text NOT NULL,
	"risco" text NOT NULL,
	"status" "atendimento_ia_proposta_status" DEFAULT 'aberta' NOT NULL,
	"criado_por_id" text NOT NULL,
	"responsavel_id" text,
	"avaliacao_origem_id" uuid,
	"intencao_caso_teste" jsonb,
	"expira_em" timestamp NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_revisoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"avaliacao_id" uuid,
	"proposta_id" uuid,
	"status" "atendimento_ia_revisao_status" DEFAULT 'pendente' NOT NULL,
	"autor_id" text NOT NULL,
	"responsavel_id" text,
	"decidido_por_id" text,
	"decisao_justificativa" text,
	"decidido_em" timestamp,
	"versao" integer DEFAULT 1 NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD COLUMN "resultado" "atendimento_ia_resultado_avaliacao";--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD COLUMN "classificacao_problema" "atendimento_ia_classificacao_problema";--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD COLUMN "resolucao" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD COLUMN "avaliador_id" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD COLUMN "status" "atendimento_ia_avaliacao_status" DEFAULT 'registrada' NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD COLUMN "rubrica_versao" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD COLUMN "avaliado_em" timestamp;--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD COLUMN "proposta_melhoria_id" uuid;--> statement-breakpoint
ALTER TABLE "atendimento_ia_proposta_evidencias" ADD CONSTRAINT "atendimento_ia_proposta_evidencias_proposta_id_atendimento_ia_propostas_melhoria_id_fk" FOREIGN KEY ("proposta_id") REFERENCES "public"."atendimento_ia_propostas_melhoria"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_proposta_evidencias" ADD CONSTRAINT "atendimento_ia_proposta_evidencias_criado_por_id_user_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_propostas_melhoria" ADD CONSTRAINT "atendimento_ia_propostas_melhoria_criado_por_id_user_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_propostas_melhoria" ADD CONSTRAINT "atendimento_ia_propostas_melhoria_responsavel_id_user_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_revisoes" ADD CONSTRAINT "atendimento_ia_revisoes_avaliacao_id_atendimento_ia_avaliacoes_id_fk" FOREIGN KEY ("avaliacao_id") REFERENCES "public"."atendimento_ia_avaliacoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_revisoes" ADD CONSTRAINT "atendimento_ia_revisoes_proposta_id_atendimento_ia_propostas_melhoria_id_fk" FOREIGN KEY ("proposta_id") REFERENCES "public"."atendimento_ia_propostas_melhoria"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_revisoes" ADD CONSTRAINT "atendimento_ia_revisoes_autor_id_user_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_revisoes" ADD CONSTRAINT "atendimento_ia_revisoes_responsavel_id_user_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_revisoes" ADD CONSTRAINT "atendimento_ia_revisoes_decidido_por_id_user_id_fk" FOREIGN KEY ("decidido_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_evidencias_proposta_tipo_ref_unique" ON "atendimento_ia_proposta_evidencias" USING btree ("proposta_id","tipo","referencia_id");--> statement-breakpoint
CREATE INDEX "atendimento_ia_evidencias_proposta_idx" ON "atendimento_ia_proposta_evidencias" USING btree ("proposta_id");--> statement-breakpoint
CREATE INDEX "atendimento_ia_propostas_status_atualizado_idx" ON "atendimento_ia_propostas_melhoria" USING btree ("status","atualizado_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_propostas_expiracao_idx" ON "atendimento_ia_propostas_melhoria" USING btree ("expira_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_revisoes_status_atualizado_idx" ON "atendimento_ia_revisoes" USING btree ("status","atualizado_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_revisoes_avaliacao_idx" ON "atendimento_ia_revisoes" USING btree ("avaliacao_id");--> statement-breakpoint
CREATE INDEX "atendimento_ia_revisoes_proposta_idx" ON "atendimento_ia_revisoes" USING btree ("proposta_id");--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD CONSTRAINT "atendimento_ia_avaliacoes_avaliador_id_user_id_fk" FOREIGN KEY ("avaliador_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD CONSTRAINT "atendimento_ia_avaliacoes_proposta_melhoria_id_atendimento_ia_propostas_melhoria_id_fk" FOREIGN KEY ("proposta_melhoria_id") REFERENCES "public"."atendimento_ia_propostas_melhoria"("id") ON DELETE set null ON UPDATE no action;
