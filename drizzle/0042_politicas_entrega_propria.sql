CREATE TABLE "politicas_entrega_propria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escopo" text NOT NULL,
	"produto_id" uuid,
	"categoria_id" uuid,
	"incluir_descendentes" boolean DEFAULT false NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"entrega_rapida_ativa" boolean DEFAULT true NOT NULL,
	"entrega_programada_ativa" boolean DEFAULT false NOT NULL,
	"dias_atendidos" integer[] DEFAULT '{}' NOT NULL,
	"horario_corte" text,
	"prazo_minimo_programada_dias" integer,
	"permite_retirada" boolean,
	"modelo_retirada_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "politicas_entrega_propria_escopo_check" CHECK (("politicas_entrega_propria"."escopo" = 'produto' AND "politicas_entrega_propria"."produto_id" IS NOT NULL AND "politicas_entrega_propria"."categoria_id" IS NULL AND "politicas_entrega_propria"."incluir_descendentes" = false) OR ("politicas_entrega_propria"."escopo" = 'categoria' AND "politicas_entrega_propria"."categoria_id" IS NOT NULL AND "politicas_entrega_propria"."produto_id" IS NULL)),
	CONSTRAINT "politicas_entrega_propria_dias_check" CHECK ("politicas_entrega_propria"."dias_atendidos" <@ ARRAY[0,1,2,3,4,5,6]::integer[]),
	CONSTRAINT "politicas_entrega_propria_corte_check" CHECK ("politicas_entrega_propria"."horario_corte" IS NULL OR "politicas_entrega_propria"."horario_corte" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
	CONSTRAINT "politicas_entrega_propria_programada_check" CHECK (("politicas_entrega_propria"."prazo_minimo_programada_dias" IS NULL OR "politicas_entrega_propria"."prazo_minimo_programada_dias" >= 0) AND (NOT "politicas_entrega_propria"."entrega_rapida_ativa" OR ("politicas_entrega_propria"."horario_corte" IS NOT NULL AND cardinality("politicas_entrega_propria"."dias_atendidos") > 0)) AND (NOT "politicas_entrega_propria"."entrega_programada_ativa" OR ("politicas_entrega_propria"."prazo_minimo_programada_dias" IS NOT NULL AND cardinality("politicas_entrega_propria"."dias_atendidos") > 0))),
	CONSTRAINT "politicas_entrega_propria_retirada_check" CHECK ("politicas_entrega_propria"."permite_retirada" IS DISTINCT FROM true OR "politicas_entrega_propria"."modelo_retirada_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "precos_politicas_entrega_propria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"politica_id" uuid NOT NULL,
	"tipo_destino" text NOT NULL,
	"cep_especifico_id" integer,
	"bairro_avulso_id" integer,
	"regiao_id" integer,
	"cidade_id" integer,
	"uf" text,
	"preco_rapida_em_centavos" integer,
	"preco_programada_em_centavos" integer,
	"ativa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "precos_politicas_entrega_propria_destino_check" CHECK (("precos_politicas_entrega_propria"."tipo_destino" = 'cep' AND "precos_politicas_entrega_propria"."cep_especifico_id" IS NOT NULL AND "precos_politicas_entrega_propria"."bairro_avulso_id" IS NULL AND "precos_politicas_entrega_propria"."regiao_id" IS NULL AND "precos_politicas_entrega_propria"."cidade_id" IS NULL AND "precos_politicas_entrega_propria"."uf" IS NULL) OR ("precos_politicas_entrega_propria"."tipo_destino" = 'bairro' AND "precos_politicas_entrega_propria"."bairro_avulso_id" IS NOT NULL AND "precos_politicas_entrega_propria"."cep_especifico_id" IS NULL AND "precos_politicas_entrega_propria"."regiao_id" IS NULL AND "precos_politicas_entrega_propria"."cidade_id" IS NULL AND "precos_politicas_entrega_propria"."uf" IS NULL) OR ("precos_politicas_entrega_propria"."tipo_destino" = 'regiao' AND "precos_politicas_entrega_propria"."regiao_id" IS NOT NULL AND "precos_politicas_entrega_propria"."cep_especifico_id" IS NULL AND "precos_politicas_entrega_propria"."bairro_avulso_id" IS NULL AND "precos_politicas_entrega_propria"."cidade_id" IS NULL AND "precos_politicas_entrega_propria"."uf" IS NULL) OR ("precos_politicas_entrega_propria"."tipo_destino" = 'cidade' AND "precos_politicas_entrega_propria"."cidade_id" IS NOT NULL AND "precos_politicas_entrega_propria"."cep_especifico_id" IS NULL AND "precos_politicas_entrega_propria"."bairro_avulso_id" IS NULL AND "precos_politicas_entrega_propria"."regiao_id" IS NULL AND "precos_politicas_entrega_propria"."uf" IS NULL) OR ("precos_politicas_entrega_propria"."tipo_destino" = 'uf' AND "precos_politicas_entrega_propria"."uf" ~ '^[A-Z]{2}$' AND "precos_politicas_entrega_propria"."cep_especifico_id" IS NULL AND "precos_politicas_entrega_propria"."bairro_avulso_id" IS NULL AND "precos_politicas_entrega_propria"."regiao_id" IS NULL AND "precos_politicas_entrega_propria"."cidade_id" IS NULL)),
	CONSTRAINT "precos_politicas_entrega_propria_valores_check" CHECK (("precos_politicas_entrega_propria"."preco_rapida_em_centavos" IS NULL OR "precos_politicas_entrega_propria"."preco_rapida_em_centavos" >= 0) AND ("precos_politicas_entrega_propria"."preco_programada_em_centavos" IS NULL OR "precos_politicas_entrega_propria"."preco_programada_em_centavos" >= 0) AND ("precos_politicas_entrega_propria"."preco_rapida_em_centavos" IS NOT NULL OR "precos_politicas_entrega_propria"."preco_programada_em_centavos" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "politicas_entrega_propria" ADD CONSTRAINT "politicas_entrega_propria_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "politicas_entrega_propria" ADD CONSTRAINT "politicas_entrega_propria_categoria_id_category_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "politicas_entrega_propria" ADD CONSTRAINT "politicas_entrega_propria_modelo_retirada_id_modelos_retirada_id_fk" FOREIGN KEY ("modelo_retirada_id") REFERENCES "public"."modelos_retirada"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "precos_politicas_entrega_propria" ADD CONSTRAINT "precos_politicas_entrega_propria_politica_id_politicas_entrega_propria_id_fk" FOREIGN KEY ("politica_id") REFERENCES "public"."politicas_entrega_propria"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "precos_politicas_entrega_propria" ADD CONSTRAINT "precos_politicas_entrega_propria_cep_especifico_id_ceps_especificos_id_fk" FOREIGN KEY ("cep_especifico_id") REFERENCES "public"."ceps_especificos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "precos_politicas_entrega_propria" ADD CONSTRAINT "precos_politicas_entrega_propria_bairro_avulso_id_bairros_avulsos_id_fk" FOREIGN KEY ("bairro_avulso_id") REFERENCES "public"."bairros_avulsos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "precos_politicas_entrega_propria" ADD CONSTRAINT "precos_politicas_entrega_propria_regiao_id_shipping_regions_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "public"."shipping_regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "precos_politicas_entrega_propria" ADD CONSTRAINT "precos_politicas_entrega_propria_cidade_id_cities_id_fk" FOREIGN KEY ("cidade_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "politicas_entrega_propria_produto_uidx" ON "politicas_entrega_propria" USING btree ("produto_id") WHERE "politicas_entrega_propria"."escopo" = 'produto';--> statement-breakpoint
CREATE UNIQUE INDEX "politicas_entrega_propria_categoria_uidx" ON "politicas_entrega_propria" USING btree ("categoria_id") WHERE "politicas_entrega_propria"."escopo" = 'categoria';--> statement-breakpoint
CREATE INDEX "politicas_entrega_propria_ativa_idx" ON "politicas_entrega_propria" USING btree ("ativa");--> statement-breakpoint
CREATE INDEX "precos_politicas_entrega_propria_politica_idx" ON "precos_politicas_entrega_propria" USING btree ("politica_id");--> statement-breakpoint
CREATE UNIQUE INDEX "precos_politicas_entrega_propria_cep_uidx" ON "precos_politicas_entrega_propria" USING btree ("politica_id","cep_especifico_id") WHERE "precos_politicas_entrega_propria"."tipo_destino" = 'cep';--> statement-breakpoint
CREATE UNIQUE INDEX "precos_politicas_entrega_propria_bairro_uidx" ON "precos_politicas_entrega_propria" USING btree ("politica_id","bairro_avulso_id") WHERE "precos_politicas_entrega_propria"."tipo_destino" = 'bairro';--> statement-breakpoint
CREATE UNIQUE INDEX "precos_politicas_entrega_propria_regiao_uidx" ON "precos_politicas_entrega_propria" USING btree ("politica_id","regiao_id") WHERE "precos_politicas_entrega_propria"."tipo_destino" = 'regiao';--> statement-breakpoint
CREATE UNIQUE INDEX "precos_politicas_entrega_propria_cidade_uidx" ON "precos_politicas_entrega_propria" USING btree ("politica_id","cidade_id") WHERE "precos_politicas_entrega_propria"."tipo_destino" = 'cidade';--> statement-breakpoint
CREATE UNIQUE INDEX "precos_politicas_entrega_propria_uf_uidx" ON "precos_politicas_entrega_propria" USING btree ("politica_id","uf") WHERE "precos_politicas_entrega_propria"."tipo_destino" = 'uf';