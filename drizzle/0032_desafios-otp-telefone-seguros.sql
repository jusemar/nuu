CREATE TABLE "desafios_otp_telefone" (
	"id" uuid PRIMARY KEY NOT NULL,
	"telefone_hash" text NOT NULL,
	"ip_hash" text NOT NULL,
	"finalidade" text NOT NULL,
	"codigo_hash" text NOT NULL,
	"tentativas" integer DEFAULT 0 NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"consumido_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "desafios_otp_telefone_finalidade_check" CHECK ("desafios_otp_telefone"."finalidade" in ('cadastro', 'verificacao', 'recuperacao', 'alteracao_numero')),
	CONSTRAINT "desafios_otp_telefone_tentativas_check" CHECK ("desafios_otp_telefone"."tentativas" between 0 and 3)
);
--> statement-breakpoint
CREATE TABLE "emissoes_otp_telefone" (
	"id" uuid PRIMARY KEY NOT NULL,
	"telefone_hash" text NOT NULL,
	"ip_hash" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "desafios_otp_telefone_identidade_unique" ON "desafios_otp_telefone" USING btree ("telefone_hash","finalidade");--> statement-breakpoint
CREATE INDEX "desafios_otp_telefone_expira_em_idx" ON "desafios_otp_telefone" USING btree ("expira_em");--> statement-breakpoint
CREATE INDEX "emissoes_otp_telefone_numero_data_idx" ON "emissoes_otp_telefone" USING btree ("telefone_hash","criado_em");--> statement-breakpoint
CREATE INDEX "emissoes_otp_telefone_ip_data_idx" ON "emissoes_otp_telefone" USING btree ("ip_hash","criado_em");