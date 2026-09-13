-- Limpeza final da Entrega Própria (parte 1 de 3): verificações e normalização.
--
-- Contexto: 0044–0046 criaram o modelo único (Agenda Geográfica + bairros
-- canônicos + preços do Produto) e migraram os dados. O código que lia as
-- estruturas antigas já foi removido e publicado. As migrations 0048 e 0049
-- removem colunas e tabelas legadas; esta migration garante, antes disso, que
-- nenhum dado ainda não representado no modelo novo será perdido.
--
-- O migrator executa as migrations pendentes em uma única transação: qualquer
-- RAISE abaixo desfaz 0047, 0048 e 0049 juntas.
--
-- Rollback após aplicado: restaurar a partir da branch Neon de backup criada
-- imediatamente antes da aplicação (a estrutura antiga está descrita no
-- snapshot 0046).

DO $$
BEGIN
  -- Bairro de região antigo sem bairro canônico na mesma cidade.
  IF EXISTS (
    SELECT 1
    FROM regiao_bairros rb
    JOIN shipping_regions r ON r.id = rb.regiao_id
    WHERE NOT EXISTS (
      SELECT 1
      FROM bairros_entrega_propria b
      WHERE b.cidade_id = r.city_id
        AND b.nome_normalizado = translate(lower(trim(rb.neighborhood)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
    )
  ) THEN
    RAISE EXCEPTION 'Limpeza abortada: existe bairro de região sem bairro canônico.';
  END IF;

  -- Bairro avulso antigo sem bairro canônico na mesma cidade.
  IF EXISTS (
    SELECT 1
    FROM bairros_avulsos ba
    WHERE NOT EXISTS (
      SELECT 1
      FROM bairros_entrega_propria b
      JOIN cities c ON c.id = b.cidade_id
      WHERE lower(trim(c.name)) = lower(trim(ba.city))
        AND upper(c.state_uf) = upper(ba.state)
        AND b.nome_normalizado = translate(lower(trim(ba.neighborhood)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
    )
  ) THEN
    RAISE EXCEPTION 'Limpeza abortada: existe bairro avulso sem bairro canônico.';
  END IF;

  -- Preço de Política sem preço correspondente no Produto.
  IF EXISTS (
    SELECT 1
    FROM precos_politicas_entrega_propria pp
    JOIN politicas_entrega_propria p ON p.id = pp.politica_id
    WHERE NOT EXISTS (
      SELECT 1
      FROM product_own_delivery_prices pop
      WHERE pop.product_id = p.produto_id
        AND (
          (pp.tipo_destino = 'cidade' AND pop.destination_type = 'cidade' AND pop.city_id = pp.cidade_id)
          OR (pp.tipo_destino = 'regiao' AND pop.destination_type = 'region' AND pop.region_id = pp.regiao_id)
          OR (pp.tipo_destino = 'cep' AND pop.destination_type = 'cep-especifico' AND pop.cep_especifico_id = pp.cep_especifico_id)
          OR (pp.tipo_destino = 'bairro' AND pop.destination_type IN ('bairro', 'bairro-avulso') AND pop.bairro_id IS NOT NULL)
        )
    )
  ) THEN
    RAISE EXCEPTION 'Limpeza abortada: existe preço de Política não absorvido pelo Produto.';
  END IF;

  -- Preço de bairro antigo que ainda dependa somente do bairro avulso.
  IF EXISTS (
    SELECT 1
    FROM product_own_delivery_prices
    WHERE bairro_avulso_id IS NOT NULL
      AND bairro_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Limpeza abortada: existe preço vinculado apenas a bairro avulso.';
  END IF;
END $$;
--> statement-breakpoint

-- Normaliza o marcador físico transitório para o nível canônico. O CHECK
-- vigente (0046) aceita 'bairro' com o mesmo formato de referências.
UPDATE product_own_delivery_prices
SET destination_type = 'bairro',
    bairro_avulso_id = NULL,
    updated_at = now()
WHERE destination_type = 'bairro-avulso';
--> statement-breakpoint

-- Índices e CHECKs antigos criados fora da cadeia versionada em bancos
-- históricos. Duplicam os índices únicos e o CHECK de valores atuais. Em banco
-- criado do zero eles não existem, por isso IF EXISTS.
DROP INDEX IF EXISTS "product_own_delivery_prices_product_bairro_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "product_own_delivery_prices_product_region_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "product_own_delivery_prices_product_city_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "product_own_delivery_prices_product_cep_idx";
--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" DROP CONSTRAINT IF EXISTS "product_own_delivery_prices_scheduled_min_days_check";
--> statement-breakpoint
ALTER TABLE "product_own_delivery_prices" DROP CONSTRAINT IF EXISTS "product_own_delivery_prices_scheduled_price_check";
