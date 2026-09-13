CREATE TABLE "agendas_geograficas_entrega_propria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_destino" text NOT NULL,
	"cidade_id" integer,
	"regiao_id" integer,
	"bairro_id" integer,
	"cep_especifico_id" integer,
	"ativa" boolean DEFAULT true NOT NULL,
	"dias_atendidos" integer[] DEFAULT '{}' NOT NULL,
	"horario_corte" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agendas_geograficas_destino_check" CHECK (("agendas_geograficas_entrega_propria"."tipo_destino" = 'cidade' AND "agendas_geograficas_entrega_propria"."cidade_id" IS NOT NULL AND "agendas_geograficas_entrega_propria"."regiao_id" IS NULL AND "agendas_geograficas_entrega_propria"."bairro_id" IS NULL AND "agendas_geograficas_entrega_propria"."cep_especifico_id" IS NULL) OR ("agendas_geograficas_entrega_propria"."tipo_destino" = 'regiao' AND "agendas_geograficas_entrega_propria"."cidade_id" IS NULL AND "agendas_geograficas_entrega_propria"."regiao_id" IS NOT NULL AND "agendas_geograficas_entrega_propria"."bairro_id" IS NULL AND "agendas_geograficas_entrega_propria"."cep_especifico_id" IS NULL) OR ("agendas_geograficas_entrega_propria"."tipo_destino" = 'bairro' AND "agendas_geograficas_entrega_propria"."cidade_id" IS NULL AND "agendas_geograficas_entrega_propria"."regiao_id" IS NULL AND "agendas_geograficas_entrega_propria"."bairro_id" IS NOT NULL AND "agendas_geograficas_entrega_propria"."cep_especifico_id" IS NULL) OR ("agendas_geograficas_entrega_propria"."tipo_destino" = 'cep' AND "agendas_geograficas_entrega_propria"."cidade_id" IS NULL AND "agendas_geograficas_entrega_propria"."regiao_id" IS NULL AND "agendas_geograficas_entrega_propria"."bairro_id" IS NULL AND "agendas_geograficas_entrega_propria"."cep_especifico_id" IS NOT NULL)),
	CONSTRAINT "agendas_geograficas_dias_check" CHECK (cardinality("agendas_geograficas_entrega_propria"."dias_atendidos") > 0 AND "agendas_geograficas_entrega_propria"."dias_atendidos" <@ ARRAY[0,1,2,3,4,5,6]::integer[]),
	CONSTRAINT "agendas_geograficas_corte_check" CHECK ("agendas_geograficas_entrega_propria"."horario_corte" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);
--> statement-breakpoint
CREATE TABLE "bairros_entrega_propria" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"nome_normalizado" varchar(120) NOT NULL,
	"cidade_id" integer NOT NULL,
	"regiao_id" integer,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "datas_bloqueadas_agenda_entrega_propria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agenda_id" uuid NOT NULL,
	"data" date NOT NULL,
	"motivo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD COLUMN "bairro_id" integer;--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD COLUMN "rapid_delivery_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "shipping_regions" ADD COLUMN "city_id" integer;--> statement-breakpoint
ALTER TABLE "agendas_geograficas_entrega_propria" ADD CONSTRAINT "agendas_geograficas_entrega_propria_cidade_id_cities_id_fk" FOREIGN KEY ("cidade_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendas_geograficas_entrega_propria" ADD CONSTRAINT "agendas_geograficas_entrega_propria_regiao_id_shipping_regions_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "public"."shipping_regions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendas_geograficas_entrega_propria" ADD CONSTRAINT "agendas_geograficas_entrega_propria_bairro_id_bairros_entrega_propria_id_fk" FOREIGN KEY ("bairro_id") REFERENCES "public"."bairros_entrega_propria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendas_geograficas_entrega_propria" ADD CONSTRAINT "agendas_geograficas_entrega_propria_cep_especifico_id_ceps_especificos_id_fk" FOREIGN KEY ("cep_especifico_id") REFERENCES "public"."ceps_especificos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bairros_entrega_propria" ADD CONSTRAINT "bairros_entrega_propria_cidade_id_cities_id_fk" FOREIGN KEY ("cidade_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bairros_entrega_propria" ADD CONSTRAINT "bairros_entrega_propria_regiao_id_shipping_regions_id_fk" FOREIGN KEY ("regiao_id") REFERENCES "public"."shipping_regions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "datas_bloqueadas_agenda_entrega_propria" ADD CONSTRAINT "datas_bloqueadas_agenda_entrega_propria_agenda_id_agendas_geograficas_entrega_propria_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas_geograficas_entrega_propria"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agendas_geograficas_cidade_uidx" ON "agendas_geograficas_entrega_propria" USING btree ("cidade_id") WHERE "agendas_geograficas_entrega_propria"."tipo_destino" = 'cidade';--> statement-breakpoint
CREATE UNIQUE INDEX "agendas_geograficas_regiao_uidx" ON "agendas_geograficas_entrega_propria" USING btree ("regiao_id") WHERE "agendas_geograficas_entrega_propria"."tipo_destino" = 'regiao';--> statement-breakpoint
CREATE UNIQUE INDEX "agendas_geograficas_bairro_uidx" ON "agendas_geograficas_entrega_propria" USING btree ("bairro_id") WHERE "agendas_geograficas_entrega_propria"."tipo_destino" = 'bairro';--> statement-breakpoint
CREATE UNIQUE INDEX "agendas_geograficas_cep_uidx" ON "agendas_geograficas_entrega_propria" USING btree ("cep_especifico_id") WHERE "agendas_geograficas_entrega_propria"."tipo_destino" = 'cep';--> statement-breakpoint
CREATE INDEX "agendas_geograficas_ativa_idx" ON "agendas_geograficas_entrega_propria" USING btree ("ativa");--> statement-breakpoint
CREATE UNIQUE INDEX "bairros_entrega_propria_cidade_nome_uidx" ON "bairros_entrega_propria" USING btree ("cidade_id","nome_normalizado");--> statement-breakpoint
CREATE UNIQUE INDEX "bairros_entrega_propria_id_cidade_uidx" ON "bairros_entrega_propria" USING btree ("id","cidade_id");--> statement-breakpoint
CREATE UNIQUE INDEX "datas_bloqueadas_agenda_data_uidx" ON "datas_bloqueadas_agenda_entrega_propria" USING btree ("agenda_id","data");--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" ADD CONSTRAINT "product_own_delivery_prices_bairro_id_bairros_entrega_propria_id_fk" FOREIGN KEY ("bairro_id") REFERENCES "public"."bairros_entrega_propria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_regions" ADD CONSTRAINT "shipping_regions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;