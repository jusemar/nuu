DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "atendimento_ia_resumos" LIMIT 1)
		OR EXISTS (SELECT 1 FROM "atendimento_ia_memorias" LIMIT 1) THEN
		RAISE EXCEPTION 'A migration 0002 exige tabelas de resumo e memória ainda sem registros; adoção manual necessária.';
	END IF;
END $$;
--> statement-breakpoint
CREATE TABLE "atendimento_ia_autorizacoes_memoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"evento" text NOT NULL,
	"versao_texto" text NOT NULL,
	"origem" text NOT NULL,
	"situacao" text DEFAULT 'ativa' NOT NULL,
	"autorizada_em" timestamp NOT NULL,
	"revogada_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_ia_conversas" ADD COLUMN "aviso_privacidade_versao" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_conversas" ADD COLUMN "inicio_voluntario_em" timestamp;--> statement-breakpoint
ALTER TABLE "atendimento_ia_memorias" ADD COLUMN "assunto_normalizado" text NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_memorias" ADD COLUMN "autorizacao_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_memorias" ADD COLUMN "sensibilidade" text DEFAULT 'comercial' NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_memorias" ADD COLUMN "situacao" text DEFAULT 'ativa' NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_memorias" ADD COLUMN "ultima_utilizacao_valida_em" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_memorias" ADD COLUMN "necessidade_encerrada" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_memorias" ADD COLUMN "substituida_por_id" uuid;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resumos" ADD COLUMN "versao" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resumos" ADD COLUMN "quantidade_mensagens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resumos" ADD COLUMN "hash_conteudo_considerado" text NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resumos" ADD COLUMN "execucao_geradora_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resumos" ADD COLUMN "situacao" text DEFAULT 'valido' NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resumos" ADD COLUMN "resumo_anterior_id" uuid;--> statement-breakpoint
ALTER TABLE "atendimento_ia_autorizacoes_memoria" ADD CONSTRAINT "atendimento_ia_autorizacoes_memoria_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "atendimento_ia_autorizacoes_memoria_usuario_situacao_idx" ON "atendimento_ia_autorizacoes_memoria" USING btree ("usuario_id","situacao");--> statement-breakpoint
ALTER TABLE "atendimento_ia_memorias" ADD CONSTRAINT "atendimento_ia_memorias_autorizacao_id_atendimento_ia_autorizacoes_memoria_id_fk" FOREIGN KEY ("autorizacao_id") REFERENCES "public"."atendimento_ia_autorizacoes_memoria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_memorias" ADD CONSTRAINT "atendimento_ia_memorias_substituida_por_id_atendimento_ia_memorias_id_fk" FOREIGN KEY ("substituida_por_id") REFERENCES "public"."atendimento_ia_memorias"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resumos" ADD CONSTRAINT "atendimento_ia_resumos_resumo_anterior_id_atendimento_ia_resumos_id_fk" FOREIGN KEY ("resumo_anterior_id") REFERENCES "public"."atendimento_ia_resumos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_memorias_logica_ativa_unique" ON "atendimento_ia_memorias" USING btree ("usuario_id","categoria","assunto_normalizado") WHERE "atendimento_ia_memorias"."situacao" = 'ativa' and "atendimento_ia_memorias"."removida_em" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_resumos_conversa_versao_unique" ON "atendimento_ia_resumos" USING btree ("conversa_id","versao");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_resumos_execucao_unique" ON "atendimento_ia_resumos" USING btree ("execucao_geradora_id");
