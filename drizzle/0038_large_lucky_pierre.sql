CREATE TABLE "configuracoes_barra_avisos" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"cor_fundo" text DEFAULT '#0c447c' NOT NULL,
	"cor_texto" text DEFAULT '#ffffff' NOT NULL,
	"velocidade_segundos" integer DEFAULT 60 NOT NULL,
	"pausar_hover" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mensagens_barra_avisos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"configuracao_id" text NOT NULL,
	"texto" text NOT NULL,
	"icone" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"ordem" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mensagens_barra_avisos" ADD CONSTRAINT "mensagens_barra_avisos_configuracao_id_configuracoes_barra_avisos_id_fk" FOREIGN KEY ("configuracao_id") REFERENCES "public"."configuracoes_barra_avisos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mensagens_barra_avisos_configuracao_ordem_idx" ON "mensagens_barra_avisos" USING btree ("configuracao_id","ordem");