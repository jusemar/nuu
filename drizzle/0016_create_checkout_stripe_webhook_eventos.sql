CREATE TABLE "checkout_stripe_webhook_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_event_id" text NOT NULL,
	"tipo_evento" text NOT NULL,
	"pedido_id" uuid,
	"pagamento_id" uuid,
	"status_processamento" text NOT NULL,
	"erro" text,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_stripe_webhook_eventos_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
ALTER TABLE "checkout_stripe_webhook_eventos" ADD CONSTRAINT "checkout_stripe_webhook_eventos_pedido_id_checkout_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."checkout_pedidos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_stripe_webhook_eventos" ADD CONSTRAINT "checkout_stripe_webhook_eventos_pagamento_id_checkout_pagamentos_id_fk" FOREIGN KEY ("pagamento_id") REFERENCES "public"."checkout_pagamentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkout_stripe_webhook_eventos_pedido_id_idx" ON "checkout_stripe_webhook_eventos" USING btree ("pedido_id");--> statement-breakpoint
CREATE INDEX "checkout_stripe_webhook_eventos_pagamento_id_idx" ON "checkout_stripe_webhook_eventos" USING btree ("pagamento_id");--> statement-breakpoint
CREATE INDEX "checkout_stripe_webhook_eventos_tipo_idx" ON "checkout_stripe_webhook_eventos" USING btree ("tipo_evento");
