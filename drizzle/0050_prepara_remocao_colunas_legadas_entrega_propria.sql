-- Limpeza da Entrega Própria: preparação para remover as colunas legadas sem
-- indisponibilidade (expand/contract em dois deploys).
--
-- O código da limpeza deixou de declarar no Drizzle as colunas legadas
-- `shipping_regions.base_shipping_price`, `agenda_ativa`, `horario_corte`,
-- `periodo_entrega_inicio`, `periodo_entrega_fim`,
-- `ceps_especificos.shipping_price` e `product_own_delivery_prices.bairro_avulso_id`.
-- Elas só serão removidas (fase 2) depois que esse código estiver publicado,
-- porque o código anterior ainda as seleciona.
--
-- Até lá, as duas colunas NOT NULL sem valor padrão recebem DEFAULT 0 para que
-- inserts do código novo (que não as conhece) continuem válidos. Nenhum dado é
-- alterado e o código anterior não é afetado.
ALTER TABLE "shipping_regions" ALTER COLUMN "base_shipping_price" SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "ceps_especificos" ALTER COLUMN "shipping_price" SET DEFAULT 0;
