CREATE TYPE "public"."atendimento_ia_autor_mensagem" AS ENUM('cliente', 'assistente_ia', 'atendente_humano', 'sistema');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_canal" AS ENUM('site');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_conversa_status" AS ENUM('ativa', 'aguardando_atendimento_humano', 'encerrada');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_execucao_status" AS ENUM('processando', 'concluida', 'falhou', 'limite_excedido');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_ferramenta_classificacao" AS ENUM('consulta_publica', 'consulta_protegida', 'acao_reversivel', 'acao_sensivel', 'encaminhamento_humano');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_mensagem_status" AS ENUM('recebida', 'validando', 'processando', 'aguardando_ferramenta', 'executando_ferramenta', 'gerando_resposta', 'concluida', 'falhou', 'aguardando_atendimento_humano');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_origem_informacao" AS ENUM('informada_cliente', 'confirmada_sistema', 'inferida_ia', 'acao_solicitada', 'acao_concluida', 'informacao_vencida', 'informacao_possivelmente_desatualizada');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_tipo_falha" AS ENUM('entrada_invalida', 'modelo_indisponivel', 'ferramenta_indisponivel', 'integracao_indisponivel', 'falta_autorizacao', 'limite_excedido', 'ausencia_dado_oficial', 'conflito_fontes', 'erro_interno');--> statement-breakpoint
CREATE TYPE "public"."atendimento_ia_transferencia_status" AS ENUM('solicitada', 'aguardando_atendimento', 'em_atendimento', 'concluida');--> statement-breakpoint
CREATE TABLE "atendimento_ia_auditorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" uuid,
	"mensagem_id" uuid,
	"execucao_id" uuid,
	"execucao_ferramenta_id" uuid,
	"evento" text NOT NULL,
	"tipo_ator" text NOT NULL,
	"identificador_ator" text,
	"metadados" jsonb,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_avaliacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" uuid NOT NULL,
	"mensagem_id" uuid,
	"origem" text NOT NULL,
	"nota" integer,
	"criterios" jsonb,
	"comentario" text,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_conversas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text,
	"identificador_sessao" text NOT NULL,
	"canal" "atendimento_ia_canal" DEFAULT 'site' NOT NULL,
	"status" "atendimento_ia_conversa_status" DEFAULT 'ativa' NOT NULL,
	"ultima_atividade_em" timestamp DEFAULT now() NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_estados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" uuid NOT NULL,
	"intencao_atual" text,
	"etapa_atual" text,
	"estado_estruturado" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_execucoes_ferramentas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execucao_id" uuid NOT NULL,
	"nome_ferramenta" text NOT NULL,
	"versao_ferramenta" text NOT NULL,
	"classificacao" "atendimento_ia_ferramenta_classificacao" NOT NULL,
	"chave_idempotencia" text,
	"argumentos" jsonb,
	"resultado" jsonb,
	"status" "atendimento_ia_execucao_status" DEFAULT 'processando' NOT NULL,
	"duracao_em_ms" integer,
	"erro" text,
	"iniciado_em" timestamp DEFAULT now() NOT NULL,
	"concluido_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_execucoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" uuid NOT NULL,
	"mensagem_id" uuid,
	"modelo" text NOT NULL,
	"nivel_raciocinio" text,
	"status" "atendimento_ia_execucao_status" DEFAULT 'processando' NOT NULL,
	"tokens_entrada" integer DEFAULT 0 NOT NULL,
	"tokens_saida" integer DEFAULT 0 NOT NULL,
	"duracao_em_ms" integer,
	"custo_estimado_micros" integer DEFAULT 0 NOT NULL,
	"motivo_escalonamento" text,
	"erro" text,
	"iniciado_em" timestamp DEFAULT now() NOT NULL,
	"concluido_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_idempotencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" uuid,
	"escopo" text NOT NULL,
	"chave" text NOT NULL,
	"hash_requisicao" text NOT NULL,
	"status" "atendimento_ia_execucao_status" DEFAULT 'processando' NOT NULL,
	"referencia_resultado" text,
	"expira_em" timestamp NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_memorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"conversa_origem_id" uuid,
	"categoria" text NOT NULL,
	"origem" "atendimento_ia_origem_informacao" NOT NULL,
	"valor_estruturado" jsonb NOT NULL,
	"autorizada_em" timestamp NOT NULL,
	"expira_em" timestamp,
	"restrita" boolean DEFAULT false NOT NULL,
	"removida_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_mensagens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" uuid NOT NULL,
	"identificador_canal" text,
	"chave_idempotencia" text NOT NULL,
	"autor" "atendimento_ia_autor_mensagem" NOT NULL,
	"conteudo" text NOT NULL,
	"status" "atendimento_ia_mensagem_status" DEFAULT 'recebida' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_ocorrencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" uuid,
	"mensagem_id" uuid,
	"execucao_id" uuid,
	"tipo" "atendimento_ia_tipo_falha" NOT NULL,
	"descricao_sanitizada" text NOT NULL,
	"recuperacao_tentada" boolean DEFAULT false NOT NULL,
	"recuperacao_concluida" boolean DEFAULT false NOT NULL,
	"resolvida_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_resumos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" uuid NOT NULL,
	"ate_mensagem_id" uuid,
	"conteudo" text NOT NULL,
	"resumo_estruturado" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_ia_transferencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" uuid NOT NULL,
	"mensagem_solicitacao_id" uuid,
	"motivo" text NOT NULL,
	"resumo" text NOT NULL,
	"dados_confirmados" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"pendencias" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "atendimento_ia_transferencia_status" DEFAULT 'solicitada' NOT NULL,
	"referencia_externa" text,
	"solicitado_em" timestamp DEFAULT now() NOT NULL,
	"concluido_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD CONSTRAINT "atendimento_ia_auditorias_conversa_id_atendimento_ia_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."atendimento_ia_conversas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD CONSTRAINT "atendimento_ia_auditorias_mensagem_id_atendimento_ia_mensagens_id_fk" FOREIGN KEY ("mensagem_id") REFERENCES "public"."atendimento_ia_mensagens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD CONSTRAINT "atendimento_ia_auditorias_execucao_id_atendimento_ia_execucoes_id_fk" FOREIGN KEY ("execucao_id") REFERENCES "public"."atendimento_ia_execucoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_auditorias" ADD CONSTRAINT "atendimento_ia_auditorias_execucao_ferramenta_id_atendimento_ia_execucoes_ferramentas_id_fk" FOREIGN KEY ("execucao_ferramenta_id") REFERENCES "public"."atendimento_ia_execucoes_ferramentas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD CONSTRAINT "atendimento_ia_avaliacoes_conversa_id_atendimento_ia_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."atendimento_ia_conversas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_avaliacoes" ADD CONSTRAINT "atendimento_ia_avaliacoes_mensagem_id_atendimento_ia_mensagens_id_fk" FOREIGN KEY ("mensagem_id") REFERENCES "public"."atendimento_ia_mensagens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_conversas" ADD CONSTRAINT "atendimento_ia_conversas_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_estados" ADD CONSTRAINT "atendimento_ia_estados_conversa_id_atendimento_ia_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."atendimento_ia_conversas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes_ferramentas" ADD CONSTRAINT "atendimento_ia_execucoes_ferramentas_execucao_id_atendimento_ia_execucoes_id_fk" FOREIGN KEY ("execucao_id") REFERENCES "public"."atendimento_ia_execucoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes" ADD CONSTRAINT "atendimento_ia_execucoes_conversa_id_atendimento_ia_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."atendimento_ia_conversas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_execucoes" ADD CONSTRAINT "atendimento_ia_execucoes_mensagem_id_atendimento_ia_mensagens_id_fk" FOREIGN KEY ("mensagem_id") REFERENCES "public"."atendimento_ia_mensagens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_idempotencias" ADD CONSTRAINT "atendimento_ia_idempotencias_conversa_id_atendimento_ia_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."atendimento_ia_conversas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_memorias" ADD CONSTRAINT "atendimento_ia_memorias_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_memorias" ADD CONSTRAINT "atendimento_ia_memorias_conversa_origem_id_atendimento_ia_conversas_id_fk" FOREIGN KEY ("conversa_origem_id") REFERENCES "public"."atendimento_ia_conversas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_mensagens" ADD CONSTRAINT "atendimento_ia_mensagens_conversa_id_atendimento_ia_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."atendimento_ia_conversas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_ocorrencias" ADD CONSTRAINT "atendimento_ia_ocorrencias_conversa_id_atendimento_ia_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."atendimento_ia_conversas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_ocorrencias" ADD CONSTRAINT "atendimento_ia_ocorrencias_mensagem_id_atendimento_ia_mensagens_id_fk" FOREIGN KEY ("mensagem_id") REFERENCES "public"."atendimento_ia_mensagens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_ocorrencias" ADD CONSTRAINT "atendimento_ia_ocorrencias_execucao_id_atendimento_ia_execucoes_id_fk" FOREIGN KEY ("execucao_id") REFERENCES "public"."atendimento_ia_execucoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resumos" ADD CONSTRAINT "atendimento_ia_resumos_conversa_id_atendimento_ia_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."atendimento_ia_conversas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_resumos" ADD CONSTRAINT "atendimento_ia_resumos_ate_mensagem_id_atendimento_ia_mensagens_id_fk" FOREIGN KEY ("ate_mensagem_id") REFERENCES "public"."atendimento_ia_mensagens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD CONSTRAINT "atendimento_ia_transferencias_conversa_id_atendimento_ia_conversas_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."atendimento_ia_conversas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_ia_transferencias" ADD CONSTRAINT "atendimento_ia_transferencias_mensagem_solicitacao_id_atendimento_ia_mensagens_id_fk" FOREIGN KEY ("mensagem_solicitacao_id") REFERENCES "public"."atendimento_ia_mensagens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "atendimento_ia_auditorias_conversa_criado_idx" ON "atendimento_ia_auditorias" USING btree ("conversa_id","criado_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_auditorias_evento_idx" ON "atendimento_ia_auditorias" USING btree ("evento");--> statement-breakpoint
CREATE INDEX "atendimento_ia_avaliacoes_conversa_criado_idx" ON "atendimento_ia_avaliacoes" USING btree ("conversa_id","criado_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_conversas_usuario_idx" ON "atendimento_ia_conversas" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "atendimento_ia_conversas_sessao_idx" ON "atendimento_ia_conversas" USING btree ("identificador_sessao");--> statement-breakpoint
CREATE INDEX "atendimento_ia_conversas_status_atividade_idx" ON "atendimento_ia_conversas" USING btree ("status","ultima_atividade_em");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_estados_conversa_unique" ON "atendimento_ia_estados" USING btree ("conversa_id");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_exec_ferramentas_idempotencia_unique" ON "atendimento_ia_execucoes_ferramentas" USING btree ("chave_idempotencia") WHERE "atendimento_ia_execucoes_ferramentas"."chave_idempotencia" is not null;--> statement-breakpoint
CREATE INDEX "atendimento_ia_exec_ferramentas_execucao_idx" ON "atendimento_ia_execucoes_ferramentas" USING btree ("execucao_id");--> statement-breakpoint
CREATE INDEX "atendimento_ia_exec_ferramentas_nome_idx" ON "atendimento_ia_execucoes_ferramentas" USING btree ("nome_ferramenta");--> statement-breakpoint
CREATE INDEX "atendimento_ia_execucoes_conversa_iniciado_idx" ON "atendimento_ia_execucoes" USING btree ("conversa_id","iniciado_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_execucoes_mensagem_idx" ON "atendimento_ia_execucoes" USING btree ("mensagem_id");--> statement-breakpoint
CREATE INDEX "atendimento_ia_execucoes_status_idx" ON "atendimento_ia_execucoes" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_idempotencias_escopo_chave_unique" ON "atendimento_ia_idempotencias" USING btree ("escopo","chave");--> statement-breakpoint
CREATE INDEX "atendimento_ia_idempotencias_expiracao_idx" ON "atendimento_ia_idempotencias" USING btree ("expira_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_memorias_usuario_categoria_idx" ON "atendimento_ia_memorias" USING btree ("usuario_id","categoria");--> statement-breakpoint
CREATE INDEX "atendimento_ia_memorias_expiracao_idx" ON "atendimento_ia_memorias" USING btree ("expira_em");--> statement-breakpoint
CREATE UNIQUE INDEX "atendimento_ia_mensagens_idempotencia_unique" ON "atendimento_ia_mensagens" USING btree ("chave_idempotencia");--> statement-breakpoint
CREATE INDEX "atendimento_ia_mensagens_conversa_criado_idx" ON "atendimento_ia_mensagens" USING btree ("conversa_id","criado_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_mensagens_status_idx" ON "atendimento_ia_mensagens" USING btree ("status");--> statement-breakpoint
CREATE INDEX "atendimento_ia_ocorrencias_tipo_criado_idx" ON "atendimento_ia_ocorrencias" USING btree ("tipo","criado_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_ocorrencias_conversa_idx" ON "atendimento_ia_ocorrencias" USING btree ("conversa_id");--> statement-breakpoint
CREATE INDEX "atendimento_ia_resumos_conversa_criado_idx" ON "atendimento_ia_resumos" USING btree ("conversa_id","criado_em");--> statement-breakpoint
CREATE INDEX "atendimento_ia_transferencias_conversa_status_idx" ON "atendimento_ia_transferencias" USING btree ("conversa_id","status");