CREATE TABLE "atendimento_ia_publicacao_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publicacao_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"candidato_id" uuid NOT NULL,
	"hash" text NOT NULL,
	"ordem" integer NOT NULL,
	"versao_anterior_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_publicacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" text NOT NULL,
	"identidade" text NOT NULL,
	"chave_idempotencia" text NOT NULL,
	"hash_requisicao" text NOT NULL,
	"status" text DEFAULT 'processando' NOT NULL,
	"justificativa_alertas" text,
	"publicado_por_id" text NOT NULL,
	"publicado_em" timestamp,
	"erro_sanitizado" text,
	"metadados" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes" ADD COLUMN "tipo_execucao" text DEFAULT 'publica' NOT NULL;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes" ADD COLUMN "comportamento_versao_id" uuid;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes" ADD COLUMN "conhecimento_versoes_ids" jsonb;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes" ADD COLUMN "identidade_publicacao" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes" ADD COLUMN "versao_catalogo_ferramentas" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes" ADD COLUMN "versao_schema_resposta" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes" ADD COLUMN "fallback_comportamento" boolean;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes" ADD COLUMN "hash_configuracao_efetiva" text;--> statement-breakpoint
ALTER TABLE "atendimento_ia_publicacao_itens" ADD CONSTRAINT "atendimento_ia_publicacao_itens_publicacao_id_atendimento_ia_publicacoes_id_fk" FOREIGN KEY ("publicacao_id") REFERENCES "public"."atendimento_ia_publicacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_publicacoes" ADD CONSTRAINT "atendimento_ia_publicacoes_publicado_por_id_user_id_fk" FOREIGN KEY ("publicado_por_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_publicacao_itens_ordem_unique" ON "atendimento_ia_publicacao_itens" USING btree ("publicacao_id","ordem");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_publicacao_itens_candidato_unique" ON "atendimento_ia_publicacao_itens" USING btree ("publicacao_id","candidato_id");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_publicacoes_idempotencia_unique" ON "atendimento_ia_publicacoes" USING btree ("chave_idempotencia");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_publicacoes_identidade_concluida_unique" ON "atendimento_ia_publicacoes" USING btree ("identidade") WHERE "atendimento_ia_publicacoes"."status" = 'concluida';--> statement-breakpoint
CREATE INDEX "atendimento_ia_publicacoes_status_criado_idx" ON "atendimento_ia_publicacoes" USING btree ("status","criado_em");--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes" ADD CONSTRAINT "atendimento_ia_execucoes_comportamento_versao_id_atendimento_ia_comportamento_versoes_id_fk" FOREIGN KEY ("comportamento_versao_id") REFERENCES "public"."atendimento_ia_comportamento_versoes"("id") ON DELETE set null ON UPDATE no action;
