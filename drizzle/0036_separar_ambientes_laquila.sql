DROP INDEX "fornecedor_integracoes_api_fornecedor_provedor_unique";--> statement-breakpoint
DROP INDEX "fornecedor_pedido_integracoes_grupo_unique";--> statement-breakpoint
DROP INDEX "fornecedor_pedido_integracoes_externo_unique";--> statement-breakpoint
ALTER TABLE "fornecedor_pedido_integracoes" ADD COLUMN "ambiente" "fornecedor_integracao_api_ambiente";--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "fornecedor_pedido_integracoes" integracao
    INNER JOIN "checkout_pedidos" pedido ON pedido."id" = integracao."pedido_id"
    WHERE pedido."numero_pedido" NOT IN ('#1034', '#1035')
  ) THEN
    RAISE EXCEPTION 'Há integrações históricas Laquila sem classificação de ambiente aprovada.';
  END IF;
END $$;--> statement-breakpoint
UPDATE "fornecedor_pedido_integracoes" integracao
SET "ambiente" = 'homologacao'
FROM "checkout_pedidos" pedido
WHERE pedido."id" = integracao."pedido_id"
  AND pedido."numero_pedido" IN ('#1034', '#1035');--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "fornecedor_pedido_integracoes" WHERE "ambiente" IS NULL
  ) THEN
    RAISE EXCEPTION 'Não foi possível classificar todas as integrações históricas Laquila.';
  END IF;
END $$;--> statement-breakpoint
UPDATE "fornecedor_pedido_integracoes"
SET "chave_idempotencia" =
  'pedido:' || "pedido_id"::text ||
  ':provedor:' || "provedor"::text ||
  ':ambiente:' || "ambiente"::text ||
  ':grupo:' || "chave_grupo";--> statement-breakpoint
ALTER TABLE "fornecedor_pedido_integracoes" ALTER COLUMN "ambiente" SET NOT NULL;--> statement-breakpoint
UPDATE "fornecedor_integracoes_api"
SET
  "ambiente" = 'homologacao',
  "url_base" = replace(
    "url_base",
    'https://api-dropshipping.laquila.com.br',
    'https://hom-api-dropshipping.laquila.com.br'
  ),
  "atualizado_em" = now()
WHERE "id" = '051f1566-18d1-4801-9837-7fd944a68643'
  AND "provedor" = 'laquila'
  AND "url_base" LIKE 'https://api-dropshipping.laquila.com.br/%';--> statement-breakpoint
CREATE UNIQUE INDEX "fornecedor_integracoes_api_fornecedor_provedor_ambiente_unique" ON "fornecedor_integracoes_api" USING btree ("fornecedor_id","provedor","ambiente");--> statement-breakpoint
CREATE INDEX "fornecedor_pedido_integracoes_ambiente_status_idx" ON "fornecedor_pedido_integracoes" USING btree ("ambiente","status");--> statement-breakpoint
CREATE UNIQUE INDEX "fornecedor_pedido_integracoes_grupo_unique" ON "fornecedor_pedido_integracoes" USING btree ("pedido_id","provedor","ambiente","chave_grupo");--> statement-breakpoint
CREATE UNIQUE INDEX "fornecedor_pedido_integracoes_externo_unique" ON "fornecedor_pedido_integracoes" USING btree ("provedor","ambiente","id_pedido_externo") WHERE "fornecedor_pedido_integracoes"."id_pedido_externo" is not null;
