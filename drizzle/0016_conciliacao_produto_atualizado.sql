ALTER TYPE "public"."produto_rascunho_status" ADD VALUE 'publicado';--> statement-breakpoint
ALTER TABLE "produto_rascunhos" ADD COLUMN "produto_atualizado_id" uuid;--> statement-breakpoint
ALTER TABLE "produto_rascunhos" ADD CONSTRAINT "produto_rascunhos_produto_atualizado_id_product_id_fk" FOREIGN KEY ("produto_atualizado_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "produto_rascunhos_produto_atualizado_id_idx" ON "produto_rascunhos" USING btree ("produto_atualizado_id");