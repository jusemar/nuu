CREATE TABLE "provedores_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identificador" text NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tipos_logisticos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identificador" text NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transportadoras_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provedor_frete_id" uuid NOT NULL,
	"identificador" text NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"peso_maximo_em_gramas" integer,
	"altura_maxima_em_cm" integer,
	"largura_maxima_em_cm" integer,
	"comprimento_maximo_em_cm" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicos_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provedor_frete_id" uuid NOT NULL,
	"transportadora_frete_id" uuid,
	"identificador" text NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"peso_maximo_em_gramas" integer,
	"altura_maxima_em_cm" integer,
	"largura_maxima_em_cm" integer,
	"comprimento_maximo_em_cm" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos_tipos_logisticos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"tipo_logistico_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_categorias_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoria_id" uuid NOT NULL,
	"efeito" text NOT NULL,
	"provedor_frete_id" uuid,
	"transportadora_frete_id" uuid,
	"servico_frete_id" uuid,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_produtos_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" uuid NOT NULL,
	"efeito" text NOT NULL,
	"provedor_frete_id" uuid,
	"transportadora_frete_id" uuid,
	"servico_frete_id" uuid,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras_tipos_logisticos_frete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_logistico_id" uuid NOT NULL,
	"efeito" text NOT NULL,
	"provedor_frete_id" uuid,
	"transportadora_frete_id" uuid,
	"servico_frete_id" uuid,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transportadoras_frete" ADD CONSTRAINT "transportadoras_frete_provedor_frete_id_provedores_frete_id_fk" FOREIGN KEY ("provedor_frete_id") REFERENCES "public"."provedores_frete"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "servicos_frete" ADD CONSTRAINT "servicos_frete_provedor_frete_id_provedores_frete_id_fk" FOREIGN KEY ("provedor_frete_id") REFERENCES "public"."provedores_frete"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "servicos_frete" ADD CONSTRAINT "servicos_frete_transportadora_frete_id_transportadoras_frete_id_fk" FOREIGN KEY ("transportadora_frete_id") REFERENCES "public"."transportadoras_frete"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "produtos_tipos_logisticos" ADD CONSTRAINT "produtos_tipos_logisticos_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "produtos_tipos_logisticos" ADD CONSTRAINT "produtos_tipos_logisticos_tipo_logistico_id_tipos_logisticos_id_fk" FOREIGN KEY ("tipo_logistico_id") REFERENCES "public"."tipos_logisticos"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_categorias_frete" ADD CONSTRAINT "regras_categorias_frete_categoria_id_category_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_categorias_frete" ADD CONSTRAINT "regras_categorias_frete_provedor_frete_id_provedores_frete_id_fk" FOREIGN KEY ("provedor_frete_id") REFERENCES "public"."provedores_frete"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_categorias_frete" ADD CONSTRAINT "regras_categorias_frete_transportadora_frete_id_transportadoras_frete_id_fk" FOREIGN KEY ("transportadora_frete_id") REFERENCES "public"."transportadoras_frete"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_categorias_frete" ADD CONSTRAINT "regras_categorias_frete_servico_frete_id_servicos_frete_id_fk" FOREIGN KEY ("servico_frete_id") REFERENCES "public"."servicos_frete"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_produtos_frete" ADD CONSTRAINT "regras_produtos_frete_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_produtos_frete" ADD CONSTRAINT "regras_produtos_frete_provedor_frete_id_provedores_frete_id_fk" FOREIGN KEY ("provedor_frete_id") REFERENCES "public"."provedores_frete"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_produtos_frete" ADD CONSTRAINT "regras_produtos_frete_transportadora_frete_id_transportadoras_frete_id_fk" FOREIGN KEY ("transportadora_frete_id") REFERENCES "public"."transportadoras_frete"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_produtos_frete" ADD CONSTRAINT "regras_produtos_frete_servico_frete_id_servicos_frete_id_fk" FOREIGN KEY ("servico_frete_id") REFERENCES "public"."servicos_frete"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_tipos_logisticos_frete" ADD CONSTRAINT "regras_tipos_logisticos_frete_tipo_logistico_id_tipos_logisticos_id_fk" FOREIGN KEY ("tipo_logistico_id") REFERENCES "public"."tipos_logisticos"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_tipos_logisticos_frete" ADD CONSTRAINT "regras_tipos_logisticos_frete_provedor_frete_id_provedores_frete_id_fk" FOREIGN KEY ("provedor_frete_id") REFERENCES "public"."provedores_frete"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_tipos_logisticos_frete" ADD CONSTRAINT "regras_tipos_logisticos_frete_transportadora_frete_id_transportadoras_frete_id_fk" FOREIGN KEY ("transportadora_frete_id") REFERENCES "public"."transportadoras_frete"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "regras_tipos_logisticos_frete" ADD CONSTRAINT "regras_tipos_logisticos_frete_servico_frete_id_servicos_frete_id_fk" FOREIGN KEY ("servico_frete_id") REFERENCES "public"."servicos_frete"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "provedores_frete_identificador_unique" ON "provedores_frete" ("identificador");
--> statement-breakpoint
CREATE UNIQUE INDEX "tipos_logisticos_identificador_unique" ON "tipos_logisticos" ("identificador");
--> statement-breakpoint
CREATE UNIQUE INDEX "transportadoras_frete_provedor_identificador_unique" ON "transportadoras_frete" ("provedor_frete_id","identificador");
--> statement-breakpoint
CREATE INDEX "transportadoras_frete_provedor_frete_id_idx" ON "transportadoras_frete" ("provedor_frete_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "servicos_frete_provedor_identificador_unique" ON "servicos_frete" ("provedor_frete_id","identificador");
--> statement-breakpoint
CREATE INDEX "servicos_frete_provedor_frete_id_idx" ON "servicos_frete" ("provedor_frete_id");
--> statement-breakpoint
CREATE INDEX "servicos_frete_transportadora_frete_id_idx" ON "servicos_frete" ("transportadora_frete_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "produtos_tipos_logisticos_produto_tipo_unique" ON "produtos_tipos_logisticos" ("produto_id","tipo_logistico_id");
--> statement-breakpoint
CREATE INDEX "produtos_tipos_logisticos_produto_id_idx" ON "produtos_tipos_logisticos" ("produto_id");
--> statement-breakpoint
CREATE INDEX "produtos_tipos_logisticos_tipo_logistico_id_idx" ON "produtos_tipos_logisticos" ("tipo_logistico_id");
--> statement-breakpoint
CREATE INDEX "regras_categorias_frete_categoria_id_idx" ON "regras_categorias_frete" ("categoria_id");
--> statement-breakpoint
CREATE INDEX "regras_categorias_frete_provedor_frete_id_idx" ON "regras_categorias_frete" ("provedor_frete_id");
--> statement-breakpoint
CREATE INDEX "regras_categorias_frete_transportadora_frete_id_idx" ON "regras_categorias_frete" ("transportadora_frete_id");
--> statement-breakpoint
CREATE INDEX "regras_categorias_frete_servico_frete_id_idx" ON "regras_categorias_frete" ("servico_frete_id");
--> statement-breakpoint
CREATE INDEX "regras_produtos_frete_produto_id_idx" ON "regras_produtos_frete" ("produto_id");
--> statement-breakpoint
CREATE INDEX "regras_produtos_frete_provedor_frete_id_idx" ON "regras_produtos_frete" ("provedor_frete_id");
--> statement-breakpoint
CREATE INDEX "regras_produtos_frete_transportadora_frete_id_idx" ON "regras_produtos_frete" ("transportadora_frete_id");
--> statement-breakpoint
CREATE INDEX "regras_produtos_frete_servico_frete_id_idx" ON "regras_produtos_frete" ("servico_frete_id");
--> statement-breakpoint
CREATE INDEX "regras_tipos_logisticos_frete_tipo_id_idx" ON "regras_tipos_logisticos_frete" ("tipo_logistico_id");
--> statement-breakpoint
CREATE INDEX "regras_tipos_logisticos_frete_provedor_id_idx" ON "regras_tipos_logisticos_frete" ("provedor_frete_id");
--> statement-breakpoint
CREATE INDEX "regras_tipos_logisticos_frete_transportadora_id_idx" ON "regras_tipos_logisticos_frete" ("transportadora_frete_id");
--> statement-breakpoint
CREATE INDEX "regras_tipos_logisticos_frete_servico_id_idx" ON "regras_tipos_logisticos_frete" ("servico_frete_id");
