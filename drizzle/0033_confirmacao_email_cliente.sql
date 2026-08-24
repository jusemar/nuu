CREATE TABLE "desafios_confirmacao_email" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"novo_email" text NOT NULL,
	"novo_email_hash" text NOT NULL,
	"token_hash" text NOT NULL,
	"ip_hash" text NOT NULL,
	"tentativas" integer DEFAULT 0 NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"consumido_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "desafios_confirmacao_email_tentativas_check" CHECK ("desafios_confirmacao_email"."tentativas" between 0 and 5)
);
--> statement-breakpoint
CREATE TABLE "tentativas_confirmacao_email" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ip_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desafios_confirmacao_email" ADD CONSTRAINT "desafios_confirmacao_email_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "desafios_confirmacao_email_token_hash_unique" ON "desafios_confirmacao_email" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "desafios_confirmacao_email_usuario_data_idx" ON "desafios_confirmacao_email" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "desafios_confirmacao_email_novo_email_data_idx" ON "desafios_confirmacao_email" USING btree ("novo_email_hash","created_at");--> statement-breakpoint
CREATE INDEX "desafios_confirmacao_email_expira_em_idx" ON "desafios_confirmacao_email" USING btree ("expira_em");--> statement-breakpoint
CREATE INDEX "tentativas_confirmacao_email_ip_data_idx" ON "tentativas_confirmacao_email" USING btree ("ip_hash","created_at");