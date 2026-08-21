CREATE TYPE "public"."identificador_catalogo_tipo" AS ENUM('gtin', 'mpn');--> statement-breakpoint
CREATE TYPE "public"."identificador_catalogo_gtin_tipo" AS ENUM('gtin_8', 'gtin_12', 'gtin_13', 'gtin_14');--> statement-breakpoint
CREATE TYPE "public"."identificador_catalogo_origem" AS ENUM('manual_admin', 'fornecedor_importacao');--> statement-breakpoint
CREATE TYPE "public"."identificador_catalogo_status" AS ENUM('pendente', 'verificado', 'rejeitado', 'conflito');--> statement-breakpoint
CREATE TABLE "produto_identificadores_catalogo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "identificador_catalogo_tipo" NOT NULL,
	"valor" text NOT NULL,
	"gtin_tipo" "identificador_catalogo_gtin_tipo",
	"produto_id" uuid,
	"variante_id" uuid,
	"marca_id" uuid,
	"origem" "identificador_catalogo_origem" NOT NULL,
	"fornecedor_id" uuid,
	"referencia_origem" text,
	"status" "identificador_catalogo_status" DEFAULT 'pendente' NOT NULL,
	"motivo_status" text,
	"principal" boolean DEFAULT false NOT NULL,
	"verificado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "produto_identificador_escopo_unico_check" CHECK (num_nonnulls("produto_id", "variante_id") = 1),
	CONSTRAINT "produto_identificador_gtin_escopo_check" CHECK ("tipo" <> 'gtin' OR ("variante_id" IS NOT NULL AND "produto_id" IS NULL)),
	CONSTRAINT "produto_identificador_gtin_tipo_check" CHECK (("tipo" = 'gtin' AND "gtin_tipo" IS NOT NULL) OR ("tipo" = 'mpn' AND "gtin_tipo" IS NULL)),
	CONSTRAINT "produto_identificador_valor_check" CHECK (btrim("valor") <> ''),
	CONSTRAINT "produto_identificador_gtin_formato_check" CHECK ("tipo" <> 'gtin' OR ("valor" ~ '^[0-9]+$' AND length("valor") IN (8, 12, 13, 14)))
);--> statement-breakpoint
ALTER TABLE "produto_identificadores_catalogo" ADD CONSTRAINT "produto_identificadores_catalogo_produto_id_product_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto_identificadores_catalogo" ADD CONSTRAINT "produto_identificadores_catalogo_variante_id_product_variant_id_fk" FOREIGN KEY ("variante_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto_identificadores_catalogo" ADD CONSTRAINT "produto_identificadores_catalogo_marca_id_marca_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marca"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto_identificadores_catalogo" ADD CONSTRAINT "produto_identificadores_catalogo_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "produto_identificador_produto_idx" ON "produto_identificadores_catalogo" USING btree ("produto_id");--> statement-breakpoint
CREATE INDEX "produto_identificador_variante_idx" ON "produto_identificadores_catalogo" USING btree ("variante_id");--> statement-breakpoint
CREATE INDEX "produto_identificador_fornecedor_idx" ON "produto_identificadores_catalogo" USING btree ("fornecedor_id");--> statement-breakpoint
CREATE INDEX "produto_identificador_status_idx" ON "produto_identificadores_catalogo" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "produto_identificador_principal_produto_unique" ON "produto_identificadores_catalogo" USING btree ("produto_id", "tipo") WHERE "principal" AND "produto_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "produto_identificador_principal_variante_unique" ON "produto_identificadores_catalogo" USING btree ("variante_id", "tipo") WHERE "principal" AND "variante_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "produto_identificador_gtin_principal_unique" ON "produto_identificadores_catalogo" USING btree ("valor") WHERE "tipo" = 'gtin' AND "principal";
