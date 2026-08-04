CREATE TABLE "atendimento_ia_comportamento_versoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comportamento_id" uuid NOT NULL,
	"numero_versao" integer NOT NULL,
	"estado" "atendimento_ia_documento_estado" DEFAULT 'rascunho' NOT NULL,
	"configuracao_estruturada" jsonb NOT NULL,
	"blocos_administrativos" jsonb NOT NULL,
	"hash" text NOT NULL,
	"motivo_alteracao" text NOT NULL,
	"resumo_alteracao" text NOT NULL,
	"criado_por_id" text,
	"enviado_revisao_por_id" text,
	"enviado_revisao_em" timestamp,
	"revisado_por_id" text,
	"revisado_em" timestamp,
	"motivo_reprovacao" text,
	"publicacao_bloqueada" boolean DEFAULT false NOT NULL,
	"motivo_bloqueio" text,
	"restaurada_de_versao_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_comportamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chave_estavel" text NOT NULL,
	"nome" text NOT NULL,
	"descricao" text NOT NULL,
	"situacao" "atendimento_ia_conhecimento_situacao" DEFAULT 'ativa' NOT NULL,
	"criado_por_id" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_ia_comportamento_versoes" ADD CONSTRAINT "atendimento_ia_comportamento_versoes_comportamento_id_atendimento_ia_comportamentos_id_fk" FOREIGN KEY ("comportamento_id") REFERENCES "public"."atendimento_ia_comportamentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_comportamento_versoes" ADD CONSTRAINT "atendimento_ia_comportamento_versoes_criado_por_id_user_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_comportamento_versoes" ADD CONSTRAINT "atendimento_ia_comportamento_versoes_enviado_revisao_por_id_user_id_fk" FOREIGN KEY ("enviado_revisao_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_comportamento_versoes" ADD CONSTRAINT "atendimento_ia_comportamento_versoes_revisado_por_id_user_id_fk" FOREIGN KEY ("revisado_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_comportamento_versoes" ADD CONSTRAINT "atendimento_ia_comportamento_versoes_restaurada_de_versao_id_atendimento_ia_comportamento_versoes_id_fk" FOREIGN KEY ("restaurada_de_versao_id") REFERENCES "public"."atendimento_ia_comportamento_versoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_comportamentos" ADD CONSTRAINT "atendimento_ia_comportamentos_criado_por_id_user_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_comportamento_versao_unique" ON "atendimento_ia_comportamento_versoes" USING btree ("comportamento_id","numero_versao");--> statement-breakpoint
CREATE INDEX "atendimento_ia_comportamento_versoes_estado_idx" ON "atendimento_ia_comportamento_versoes" USING btree ("estado");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_comportamentos_chave_unique" ON "atendimento_ia_comportamentos" USING btree ("chave_estavel");--> statement-breakpoint
CREATE INDEX "atendimento_ia_comportamentos_situacao_idx" ON "atendimento_ia_comportamentos" USING btree ("situacao");