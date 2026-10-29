ALTER TABLE "fornecedor_produto_vinculos" ADD COLUMN "estoque_informado_fornecedor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "autorizacoes_produtos_representantes" ADD COLUMN "comissao_tipo" text;--> statement-breakpoint
ALTER TABLE "autorizacoes_produtos_representantes" ADD COLUMN "comissao_valor" integer;--> statement-breakpoint
ALTER TABLE "autorizacoes_produtos_representantes" ADD COLUMN "comissao_visivel" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "fornecedor_produto_vinculos" ADD CONSTRAINT "fornecedor_produto_estoque_informado_valido" CHECK ("fornecedor_produto_vinculos"."estoque_informado_fornecedor" >= 0);--> statement-breakpoint
ALTER TABLE "autorizacoes_produtos_representantes" ADD CONSTRAINT "autorizacoes_comissao_valida" CHECK ((
      ("autorizacoes_produtos_representantes"."comissao_tipo" IS NULL AND "autorizacoes_produtos_representantes"."comissao_valor" IS NULL AND NOT "autorizacoes_produtos_representantes"."comissao_visivel") OR
      ("autorizacoes_produtos_representantes"."comissao_tipo" = 'percentual' AND "autorizacoes_produtos_representantes"."comissao_valor" IS NOT NULL AND "autorizacoes_produtos_representantes"."comissao_valor" BETWEEN 0 AND 10000) OR
      ("autorizacoes_produtos_representantes"."comissao_tipo" = 'fixa' AND "autorizacoes_produtos_representantes"."comissao_valor" IS NOT NULL AND "autorizacoes_produtos_representantes"."comissao_valor" >= 0)
    ) IS TRUE);