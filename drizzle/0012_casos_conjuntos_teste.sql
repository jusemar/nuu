CREATE TYPE "public"."atendimento_ia_caso_teste_categoria" AS ENUM('conhecimento', 'pergunta_resposta', 'comportamento', 'ferramenta', 'integracao', 'transferencia_humana', 'seguranca', 'privacidade', 'fora_escopo', 'experiencia_usuario');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_caso_teste_criticidade" AS ENUM('baixa', 'media', 'alta', 'critica');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_caso_teste_dados_origem" AS ENUM('ficticio', 'snapshot_anonimizado');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_caso_teste_estado" AS ENUM('rascunho', 'em_revisao', 'aprovado', 'desativado');--> statement-breakpoint
CREATE TABLE "atendimento_ia_caso_teste_versoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caso_teste_id" uuid NOT NULL,
	"numero_versao" integer NOT NULL,
	"estado" "atendimento_ia_caso_teste_estado" DEFAULT 'rascunho' NOT NULL,
	"entrada_controlada" jsonb NOT NULL,
	"contexto_simulado" jsonb NOT NULL,
	"expectativas" jsonb NOT NULL,
	"ferramentas_permitidas" jsonb NOT NULL,
	"ferramentas_proibidas" jsonb NOT NULL,
	"efeitos_esperados" text DEFAULT 'nenhum' NOT NULL,
	"criterios" jsonb NOT NULL,
	"dados_origem" "atendimento_ia_caso_teste_dados_origem" DEFAULT 'ficticio' NOT NULL,
	"justificativa_snapshot" text,
	"autorizado_snapshot_por_id" text,
	"versao_anterior_id" uuid,
	"hash" text NOT NULL,
	"criado_por_id" text,
	"enviado_revisao_por_id" text,
	"enviado_revisao_em" timestamp,
	"revisado_por_id" text,
	"revisado_em" timestamp,
	"motivo_reprovacao" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_casos_teste" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chave_estavel" text NOT NULL,
	"nome" text NOT NULL,
	"descricao" text NOT NULL,
	"categoria" "atendimento_ia_caso_teste_categoria" NOT NULL,
	"criticidade" "atendimento_ia_caso_teste_criticidade" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por_id" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_conjunto_teste_casos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conjunto_teste_id" uuid NOT NULL,
	"caso_teste_versao_id" uuid NOT NULL,
	"ordem" integer NOT NULL,
	"obrigatorio" boolean DEFAULT true NOT NULL,
	"bloqueia_publicacao" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_conjuntos_teste" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chave_estavel" text NOT NULL,
	"nome" text NOT NULL,
	"descricao" text NOT NULL,
	"finalidade" text NOT NULL,
	"criticidade_minima" "atendimento_ia_caso_teste_criticidade" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por_id" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_ia_caso_teste_versoes" ADD CONSTRAINT "atendimento_ia_caso_teste_versoes_caso_teste_id_atendimento_ia_casos_teste_id_fk" FOREIGN KEY ("caso_teste_id") REFERENCES "public"."atendimento_ia_casos_teste"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_caso_teste_versoes" ADD CONSTRAINT "atendimento_ia_caso_teste_versoes_autorizado_snapshot_por_id_user_id_fk" FOREIGN KEY ("autorizado_snapshot_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_caso_teste_versoes" ADD CONSTRAINT "atendimento_ia_caso_teste_versoes_criado_por_id_user_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_caso_teste_versoes" ADD CONSTRAINT "atendimento_ia_caso_teste_versoes_enviado_revisao_por_id_user_id_fk" FOREIGN KEY ("enviado_revisao_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_caso_teste_versoes" ADD CONSTRAINT "atendimento_ia_caso_teste_versoes_revisado_por_id_user_id_fk" FOREIGN KEY ("revisado_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_casos_teste" ADD CONSTRAINT "atendimento_ia_casos_teste_criado_por_id_user_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_conjunto_teste_casos" ADD CONSTRAINT "atendimento_ia_conjunto_teste_casos_conjunto_teste_id_atendimento_ia_conjuntos_teste_id_fk" FOREIGN KEY ("conjunto_teste_id") REFERENCES "public"."atendimento_ia_conjuntos_teste"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_conjunto_teste_casos" ADD CONSTRAINT "atendimento_ia_conjunto_teste_casos_caso_teste_versao_id_atendimento_ia_caso_teste_versoes_id_fk" FOREIGN KEY ("caso_teste_versao_id") REFERENCES "public"."atendimento_ia_caso_teste_versoes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_conjuntos_teste" ADD CONSTRAINT "atendimento_ia_conjuntos_teste_criado_por_id_user_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_caso_teste_versao_unique" ON "atendimento_ia_caso_teste_versoes" USING btree ("caso_teste_id","numero_versao");--> statement-breakpoint
CREATE INDEX "atendimento_ia_caso_teste_versoes_estado_idx" ON "atendimento_ia_caso_teste_versoes" USING btree ("estado");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_casos_teste_chave_unique" ON "atendimento_ia_casos_teste" USING btree ("chave_estavel");--> statement-breakpoint
CREATE INDEX "atendimento_ia_casos_teste_filtros_idx" ON "atendimento_ia_casos_teste" USING btree ("ativo","categoria","criticidade");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_conjunto_teste_caso_unique" ON "atendimento_ia_conjunto_teste_casos" USING btree ("conjunto_teste_id","caso_teste_versao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_conjunto_teste_ordem_unique" ON "atendimento_ia_conjunto_teste_casos" USING btree ("conjunto_teste_id","ordem");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_conjuntos_teste_chave_unique" ON "atendimento_ia_conjuntos_teste" USING btree ("chave_estavel");
