CREATE TYPE "public"."cliente_tipo_pessoa" AS ENUM('fisica', 'juridica');--> statement-breakpoint
CREATE TABLE "perfis_clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tipo_pessoa" "cliente_tipo_pessoa" NOT NULL,
	"nome_completo" text NOT NULL,
	"documento" text NOT NULL,
	"telefone" text NOT NULL,
	"data_nascimento" date,
	"perfil_completo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "perfis_clientes_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "perfis_clientes_documento_unique" UNIQUE("documento")
);
--> statement-breakpoint
CREATE TABLE "enderecos_clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"perfil_cliente_id" uuid NOT NULL,
	"cep" text NOT NULL,
	"rua" text NOT NULL,
	"numero" text NOT NULL,
	"complemento" text,
	"bairro" text NOT NULL,
	"cidade" text NOT NULL,
	"estado" text NOT NULL,
	"principal" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enderecos_clientes_user_id_principal_unique" UNIQUE("user_id","principal")
);
--> statement-breakpoint
ALTER TABLE "perfis_clientes" ADD CONSTRAINT "perfis_clientes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enderecos_clientes" ADD CONSTRAINT "enderecos_clientes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enderecos_clientes" ADD CONSTRAINT "enderecos_clientes_perfil_cliente_id_perfis_clientes_id_fk" FOREIGN KEY ("perfil_cliente_id") REFERENCES "public"."perfis_clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "perfis_clientes_tipo_pessoa_idx" ON "perfis_clientes" USING btree ("tipo_pessoa");--> statement-breakpoint
CREATE INDEX "enderecos_clientes_perfil_cliente_id_idx" ON "enderecos_clientes" USING btree ("perfil_cliente_id");
