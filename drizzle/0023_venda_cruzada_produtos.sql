CREATE TABLE "produtos_venda_cruzada" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_principal_id" uuid NOT NULL,
	"produto_oferecido_id" uuid NOT NULL,
	"ordem" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "produtos_venda_cruzada_sem_autorrelacionamento" CHECK ("produtos_venda_cruzada"."produto_principal_id" <> "produtos_venda_cruzada"."produto_oferecido_id"),
	CONSTRAINT "produtos_venda_cruzada_ordem_valida" CHECK ("produtos_venda_cruzada"."ordem" >= 0 AND "produtos_venda_cruzada"."ordem" < 4)
);
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "venda_cruzada_ativa" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "produtos_venda_cruzada" ADD CONSTRAINT "produtos_venda_cruzada_produto_principal_id_product_id_fk" FOREIGN KEY ("produto_principal_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos_venda_cruzada" ADD CONSTRAINT "produtos_venda_cruzada_produto_oferecido_id_product_id_fk" FOREIGN KEY ("produto_oferecido_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "produtos_venda_cruzada_principal_oferecido_unico" ON "produtos_venda_cruzada" USING btree ("produto_principal_id","produto_oferecido_id");--> statement-breakpoint
CREATE UNIQUE INDEX "produtos_venda_cruzada_principal_ordem_unica" ON "produtos_venda_cruzada" USING btree ("produto_principal_id","ordem");