CREATE TYPE "public"."grupo_navegacao_local" AS ENUM('rodape');--> statement-breakpoint
CREATE TYPE "public"."pagina_dinamica_status" AS ENUM('rascunho', 'publicada', 'arquivada');--> statement-breakpoint
CREATE TABLE "grupo_paginas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grupo_id" uuid NOT NULL,
	"pagina_id" uuid NOT NULL,
	"texto_link" text,
	"ordem" integer DEFAULT 0 NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grupos_navegacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"titulo_publico" text NOT NULL,
	"identificador" text NOT NULL,
	"local_exibicao" "grupo_navegacao_local" DEFAULT 'rodape' NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paginas_dinamicas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"slug" text NOT NULL,
	"conteudo" jsonb NOT NULL,
	"status" "pagina_dinamica_status" DEFAULT 'rascunho' NOT NULL,
	"titulo_seo" text,
	"descricao_seo" text,
	"publicada_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grupo_paginas" ADD CONSTRAINT "grupo_paginas_grupo_id_grupos_navegacao_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos_navegacao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grupo_paginas" ADD CONSTRAINT "grupo_paginas_pagina_id_paginas_dinamicas_id_fk" FOREIGN KEY ("pagina_id") REFERENCES "public"."paginas_dinamicas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "grupo_paginas_grupo_pagina_unique" ON "grupo_paginas" USING btree ("grupo_id","pagina_id");--> statement-breakpoint
CREATE INDEX "grupo_paginas_grupo_ordem_idx" ON "grupo_paginas" USING btree ("grupo_id","ordem");--> statement-breakpoint
CREATE INDEX "grupo_paginas_pagina_idx" ON "grupo_paginas" USING btree ("pagina_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grupos_navegacao_identificador_unique" ON "grupos_navegacao" USING btree ("identificador");--> statement-breakpoint
CREATE INDEX "grupos_navegacao_local_ordem_idx" ON "grupos_navegacao" USING btree ("local_exibicao","ordem");--> statement-breakpoint
CREATE INDEX "grupos_navegacao_ativo_idx" ON "grupos_navegacao" USING btree ("ativo");--> statement-breakpoint
CREATE UNIQUE INDEX "paginas_dinamicas_slug_unique" ON "paginas_dinamicas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "paginas_dinamicas_status_idx" ON "paginas_dinamicas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "paginas_dinamicas_updated_at_idx" ON "paginas_dinamicas" USING btree ("updated_at");