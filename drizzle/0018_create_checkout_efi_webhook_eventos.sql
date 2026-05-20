CREATE TABLE "checkout_efi_webhook_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identificador_evento" text NOT NULL,
	"end_to_end_id" text,
	"txid" text,
	"pedido_id" uuid,
	"pagamento_id" uuid,
	"status_processamento" text NOT NULL,
	"erro" text,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_efi_webhook_eventos_identificador_unique" UNIQUE("identificador_evento")
);
--> statement-breakpoint
ALTER TABLE "checkout_efi_webhook_eventos" ADD CONSTRAINT "checkout_efi_webhook_eventos_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_efi_webhook_eventos" ADD CONSTRAINT "checkout_efi_webhook_eventos_pagamento_id_checkout_pagamentos_id_fk" FOREIGN KEY ("pagamento_id") REFERENCES "public"."checkout_pagamentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkout_efi_webhook_eventos_txid_idx" ON "checkout_efi_webhook_eventos" USING btree ("txid");--> statement-breakpoint
CREATE INDEX "checkout_efi_webhook_eventos_end_to_end_id_idx" ON "checkout_efi_webhook_eventos" USING btree ("end_to_end_id");--> statement-breakpoint
CREATE INDEX "checkout_efi_webhook_eventos_pedido_id_idx" ON "checkout_efi_webhook_eventos" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "checkout_efi_webhook_eventos_pagamento_id_idx" ON "checkout_efi_webhook_eventos" USING btree ("pagamento_id");
