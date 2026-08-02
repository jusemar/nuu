CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_busca_rag_status" AS ENUM('fonte_encontrada', 'fonte_ausente', 'conflito');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_documento_estado" AS ENUM('rascunho', 'em_revisao', 'publicado', 'desativado');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_indexacao_status" AS ENUM('pendente', 'processando', 'concluida', 'falhou');--> statement-breakpoint
CREATE TABLE "atendimento_ia_buscas_rag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execucao_id" uuid NOT NULL,
	"hash_pergunta" text NOT NULL,
	"status" "atendimento_ia_busca_rag_status" NOT NULL,
	"configuracao" jsonb NOT NULL,
	"conflito" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_documento_versoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL,
	"versao" integer NOT NULL,
	"titulo" text NOT NULL,
	"conteudo" text NOT NULL,
	"hash_conteudo" text NOT NULL,
	"estado" "atendimento_ia_documento_estado" DEFAULT 'rascunho' NOT NULL,
	"responsavel_revisao_id" text,
	"revisado_em" timestamp,
	"publicado_em" timestamp,
	"desativado_em" timestamp,
	"versao_anterior_id" uuid,
	"status_indexacao" "atendimento_ia_indexacao_status" DEFAULT 'pendente' NOT NULL,
	"modelo_embedding" text,
	"dimensao_embedding" integer,
	"hash_indexacao" text,
	"indexado_em" timestamp,
	"metadados" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_documentos_institucionais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chave_estavel" text NOT NULL,
	"categoria" text NOT NULL,
	"origem" text NOT NULL,
	"metadados" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_fragmentos_institucionais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"versao_documento_id" uuid NOT NULL,
	"posicao" integer NOT NULL,
	"secao" text,
	"conteudo" text NOT NULL,
	"hash_conteudo" text NOT NULL,
	"quantidade_tokens" integer NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"modelo_embedding" text NOT NULL,
	"dimensao_embedding" integer NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"indexado_em" timestamp NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_resultados_rag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"busca_id" uuid NOT NULL,
	"fragmento_id" uuid NOT NULL,
	"posicao" integer NOT NULL,
	"pontuacao_semantica" real NOT NULL,
	"pontuacao_textual" real NOT NULL,
	"pontuacao_final" real NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_ia_buscas_rag" ADD CONSTRAINT "atendimento_ia_buscas_rag_execucao_id_atendimento_ia_execucoes_id_fk" FOREIGN KEY ("execucao_id") REFERENCES "public"."atendimento_ia_execucoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD CONSTRAINT "atendimento_ia_documento_versoes_documento_id_atendimento_ia_documentos_institucionais_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."atendimento_ia_documentos_institucionais"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD CONSTRAINT "atendimento_ia_documento_versoes_responsavel_revisao_id_user_id_fk" FOREIGN KEY ("responsavel_revisao_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_documento_versoes" ADD CONSTRAINT "atendimento_ia_documento_versoes_versao_anterior_id_atendimento_ia_documento_versoes_id_fk" FOREIGN KEY ("versao_anterior_id") REFERENCES "public"."atendimento_ia_documento_versoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_fragmentos_institucionais" ADD CONSTRAINT "atendimento_ia_fragmentos_institucionais_versao_documento_id_atendimento_ia_documento_versoes_id_fk" FOREIGN KEY ("versao_documento_id") REFERENCES "public"."atendimento_ia_documento_versoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resultados_rag" ADD CONSTRAINT "atendimento_ia_resultados_rag_busca_id_atendimento_ia_buscas_rag_id_fk" FOREIGN KEY ("busca_id") REFERENCES "public"."atendimento_ia_buscas_rag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resultados_rag" ADD CONSTRAINT "atendimento_ia_resultados_rag_fragmento_id_atendimento_ia_fragmentos_institucionais_id_fk" FOREIGN KEY ("fragmento_id") REFERENCES "public"."atendimento_ia_fragmentos_institucionais"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_buscas_rag_execucao_pergunta_unique" ON "atendimento_ia_buscas_rag" USING btree ("execucao_id","hash_pergunta");--> statement-breakpoint
CREATE INDEX "atendimento_ia_buscas_rag_execucao_idx" ON "atendimento_ia_buscas_rag" USING btree ("execucao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_documento_versoes_numero_unique" ON "atendimento_ia_documento_versoes" USING btree ("documento_id","versao");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_documento_versoes_indexacao_unique" ON "atendimento_ia_documento_versoes" USING btree ("documento_id","hash_indexacao") WHERE "atendimento_ia_documento_versoes"."hash_indexacao" is not null;--> statement-breakpoint
CREATE INDEX "atendimento_ia_documento_versoes_estado_idx" ON "atendimento_ia_documento_versoes" USING btree ("estado","status_indexacao");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_documentos_chave_unique" ON "atendimento_ia_documentos_institucionais" USING btree ("chave_estavel");--> statement-breakpoint
CREATE INDEX "atendimento_ia_documentos_categoria_idx" ON "atendimento_ia_documentos_institucionais" USING btree ("categoria");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_fragmentos_versao_posicao_unique" ON "atendimento_ia_fragmentos_institucionais" USING btree ("versao_documento_id","posicao");--> statement-breakpoint
CREATE INDEX "atendimento_ia_fragmentos_textual_idx" ON "atendimento_ia_fragmentos_institucionais" USING gin (to_tsvector('portuguese', "conteudo"));--> statement-breakpoint
CREATE INDEX "atendimento_ia_fragmentos_embedding_idx" ON "atendimento_ia_fragmentos_institucionais" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "atendimento_ia_fragmentos_ativos_idx" ON "atendimento_ia_fragmentos_institucionais" USING btree ("ativo");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_resultados_rag_busca_fragmento_unique" ON "atendimento_ia_resultados_rag" USING btree ("busca_id","fragmento_id");--> statement-breakpoint
CREATE INDEX "atendimento_ia_resultados_rag_busca_posicao_idx" ON "atendimento_ia_resultados_rag" USING btree ("busca_id","posicao");
