-- Migração de dados da Entrega Própria para o modelo unificado.
--
-- Estratégia de rollback antes do cutover do código:
-- 1. remover somente preços criados a partir das políticas, identificados pelo
--    relatório prévio/backup transacional;
-- 2. restaurar os valores anteriores dos preços atualizados;
-- 3. apagar agendas e bairros canônicos; e
-- 4. limpar as novas FKs. As tabelas antigas são preservadas nesta fase para
--    manter o deployment atual funcionando durante o rollout.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM shipping_regions r
    LEFT JOIN cities c
      ON lower(trim(c.name)) = lower(trim(r.city))
     AND upper(c.state_uf) = upper(r.state)
    WHERE c.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Migração abortada: existe região sem cidade canônica.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM politicas_entrega_propria p
    WHERE p.escopo <> 'produto'
  ) THEN
    RAISE EXCEPTION 'Migração abortada: política de categoria exige etapa futura.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM bairros_avulsos ba
    LEFT JOIN cities c
      ON lower(trim(c.name)) = lower(trim(ba.city))
     AND upper(c.state_uf) = upper(ba.state)
    WHERE c.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Migração abortada: existe bairro avulso sem cidade canônica.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT
        c.id,
        translate(lower(trim(rb.neighborhood)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'),
        count(DISTINCT rb.regiao_id) AS regioes
      FROM regiao_bairros rb
      JOIN shipping_regions r ON r.id = rb.regiao_id
      JOIN cities c
        ON lower(trim(c.name)) = lower(trim(r.city))
       AND upper(c.state_uf) = upper(r.state)
      GROUP BY 1, 2
      HAVING count(DISTINCT rb.regiao_id) > 1
    ) bairros_ambiguos
  ) THEN
    RAISE EXCEPTION 'Migração abortada: bairro vinculado a mais de uma região da mesma cidade.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM precos_politicas_entrega_propria pp
    WHERE pp.tipo_destino = 'uf'
  ) THEN
    RAISE EXCEPTION 'Migração abortada: agenda geográfica não possui nível UF.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT
        pp.tipo_destino,
        coalesce(pp.cep_especifico_id, pp.bairro_avulso_id, pp.regiao_id, pp.cidade_id) AS destino_id,
        count(DISTINCT (p.dias_atendidos::text, p.horario_corte)) AS agendas_distintas
      FROM precos_politicas_entrega_propria pp
      JOIN politicas_entrega_propria p ON p.id = pp.politica_id
      WHERE p.ativa AND pp.ativa
      GROUP BY 1, 2
    ) conflitos
    WHERE conflitos.agendas_distintas > 1
  ) THEN
    RAISE EXCEPTION 'Migração abortada: políticas divergentes para a mesma geografia.';
  END IF;
END $$;
--> statement-breakpoint

UPDATE shipping_regions r
SET city_id = c.id
FROM cities c
WHERE lower(trim(c.name)) = lower(trim(r.city))
  AND upper(c.state_uf) = upper(r.state)
  AND r.city_id IS DISTINCT FROM c.id;
--> statement-breakpoint

INSERT INTO bairros_entrega_propria (
  nome,
  nome_normalizado,
  cidade_id,
  regiao_id,
  ativo,
  created_at,
  updated_at
)
SELECT DISTINCT ON (
  c.id,
  translate(lower(trim(rb.neighborhood)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
)
  trim(rb.neighborhood),
  translate(lower(trim(rb.neighborhood)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'),
  c.id,
  rb.regiao_id,
  r.is_active,
  now(),
  now()
FROM regiao_bairros rb
JOIN shipping_regions r ON r.id = rb.regiao_id
JOIN cities c
  ON lower(trim(c.name)) = lower(trim(r.city))
 AND upper(c.state_uf) = upper(r.state)
ORDER BY
  c.id,
  translate(lower(trim(rb.neighborhood)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'),
  rb.id
ON CONFLICT (cidade_id, nome_normalizado) DO UPDATE
SET
  regiao_id = excluded.regiao_id,
  ativo = excluded.ativo,
  updated_at = now();
--> statement-breakpoint

INSERT INTO bairros_entrega_propria (
  nome,
  nome_normalizado,
  cidade_id,
  regiao_id,
  ativo,
  created_at,
  updated_at
)
SELECT
  trim(ba.neighborhood),
  translate(lower(trim(ba.neighborhood)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'),
  c.id,
  NULL,
  ba.is_active,
  ba.created_at,
  ba.updated_at
FROM bairros_avulsos ba
JOIN cities c
  ON lower(trim(c.name)) = lower(trim(ba.city))
 AND upper(c.state_uf) = upper(ba.state)
ON CONFLICT (cidade_id, nome_normalizado) DO UPDATE
SET
  ativo = excluded.ativo,
  updated_at = greatest(bairros_entrega_propria.updated_at, excluded.updated_at);
--> statement-breakpoint

UPDATE product_own_delivery_prices pop
SET bairro_id = b.id
FROM bairros_avulsos ba
JOIN cities c
  ON lower(trim(c.name)) = lower(trim(ba.city))
 AND upper(c.state_uf) = upper(ba.state)
JOIN bairros_entrega_propria b
  ON b.cidade_id = c.id
 AND b.nome_normalizado = translate(lower(trim(ba.neighborhood)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
WHERE pop.bairro_avulso_id = ba.id
  AND pop.bairro_id IS DISTINCT FROM b.id;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM product_own_delivery_prices
    WHERE destination_type = 'bairro-avulso'
      AND bairro_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Migração abortada: preço de bairro legado sem identidade canônica.';
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM product_own_delivery_prices
    GROUP BY product_id,
      CASE WHEN destination_type IN ('bairro', 'bairro-avulso') THEN 'bairro' ELSE destination_type END,
      CASE WHEN destination_type = 'region' THEN region_id END,
      CASE WHEN destination_type IN ('bairro', 'bairro-avulso') THEN bairro_id END,
      CASE WHEN destination_type = 'cep-especifico' THEN cep_especifico_id END,
      CASE WHEN destination_type = 'cidade' THEN city_id END
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Migração abortada: existem preços duplicados para o mesmo produto e destino.';
  END IF;
END $$;
--> statement-breakpoint

-- As agendas regionais existentes têm precedência sobre o calendário que
-- estava duplicado nas políticas. Isso preserva Barreiro e Pampulha.
INSERT INTO agendas_geograficas_entrega_propria (
  tipo_destino,
  regiao_id,
  ativa,
  dias_atendidos,
  horario_corte,
  created_at,
  updated_at
)
SELECT
  'regiao',
  r.id,
  true,
  array_agg(DISTINCT s.day_of_week ORDER BY s.day_of_week),
  r.horario_corte,
  r.created_at,
  r.updated_at
FROM shipping_regions r
JOIN shipping_region_slots s
  ON s.region_id = r.id
 AND s.is_active
WHERE r.agenda_ativa
  AND r.horario_corte IS NOT NULL
GROUP BY r.id
HAVING count(DISTINCT s.day_of_week) > 0
ON CONFLICT (regiao_id) WHERE tipo_destino = 'regiao' DO NOTHING;
--> statement-breakpoint

-- Cidades presentes nas políticas passam a fornecer a agenda de fallback.
INSERT INTO agendas_geograficas_entrega_propria (
  tipo_destino,
  cidade_id,
  ativa,
  dias_atendidos,
  horario_corte,
  created_at,
  updated_at
)
SELECT DISTINCT ON (pp.cidade_id)
  'cidade',
  pp.cidade_id,
  true,
  p.dias_atendidos,
  p.horario_corte,
  p.created_at,
  p.updated_at
FROM precos_politicas_entrega_propria pp
JOIN politicas_entrega_propria p ON p.id = pp.politica_id
WHERE p.ativa
  AND pp.ativa
  AND pp.tipo_destino = 'cidade'
  AND p.horario_corte IS NOT NULL
  AND cardinality(p.dias_atendidos) > 0
ORDER BY pp.cidade_id, p.created_at
ON CONFLICT (cidade_id) WHERE tipo_destino = 'cidade' DO NOTHING;
--> statement-breakpoint

-- Um destino regional sem agenda própria herda a cidade. Quando a política
-- continha região com agenda e não havia calendário regional, preservamos seu
-- comportamento como override geográfico.
INSERT INTO agendas_geograficas_entrega_propria (
  tipo_destino,
  regiao_id,
  ativa,
  dias_atendidos,
  horario_corte,
  created_at,
  updated_at
)
SELECT DISTINCT ON (pp.regiao_id)
  'regiao',
  pp.regiao_id,
  true,
  p.dias_atendidos,
  p.horario_corte,
  p.created_at,
  p.updated_at
FROM precos_politicas_entrega_propria pp
JOIN politicas_entrega_propria p ON p.id = pp.politica_id
WHERE p.ativa
  AND pp.ativa
  AND pp.tipo_destino = 'regiao'
  AND p.horario_corte IS NOT NULL
  AND cardinality(p.dias_atendidos) > 0
ORDER BY pp.regiao_id, p.created_at
ON CONFLICT (regiao_id) WHERE tipo_destino = 'regiao' DO NOTHING;
--> statement-breakpoint

-- Atualiza primeiro os destinos que já existiam no cadastro comercial do
-- produto. A política era a vencedora no runtime, portanto seus preços são a
-- referência para manter equivalência no motor único.
UPDATE product_own_delivery_prices pop
SET
  shipping_price = coalesce(pp.preco_rapida_em_centavos, pop.shipping_price),
  rapid_delivery_active = p.entrega_rapida_ativa AND pp.preco_rapida_em_centavos IS NOT NULL,
  scheduled_delivery_active = p.entrega_programada_ativa AND pp.preco_programada_em_centavos IS NOT NULL,
  scheduled_delivery_min_days = CASE
    WHEN p.entrega_programada_ativa AND pp.preco_programada_em_centavos IS NOT NULL
      THEN p.prazo_minimo_programada_dias
    ELSE NULL
  END,
  scheduled_delivery_price = CASE
    WHEN p.entrega_programada_ativa AND pp.preco_programada_em_centavos IS NOT NULL
      THEN pp.preco_programada_em_centavos
    ELSE NULL
  END,
  is_active = p.ativa AND pp.ativa,
  updated_at = greatest(p.updated_at, pp.updated_at)
FROM precos_politicas_entrega_propria pp
JOIN politicas_entrega_propria p ON p.id = pp.politica_id
WHERE p.produto_id = pop.product_id
  AND (
    (pp.tipo_destino = 'cidade' AND pop.destination_type = 'cidade' AND pop.city_id = pp.cidade_id)
    OR (pp.tipo_destino = 'regiao' AND pop.destination_type = 'region' AND pop.region_id = pp.regiao_id)
    OR (pp.tipo_destino = 'cep' AND pop.destination_type = 'cep-especifico' AND pop.cep_especifico_id = pp.cep_especifico_id)
    OR (pp.tipo_destino = 'bairro' AND pop.bairro_id = (
      SELECT b.id
      FROM bairros_avulsos ba
      JOIN cities c ON lower(trim(c.name)) = lower(trim(ba.city)) AND upper(c.state_uf) = upper(ba.state)
      JOIN bairros_entrega_propria b ON b.cidade_id = c.id AND b.nome_normalizado = translate(lower(trim(ba.neighborhood)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
      WHERE ba.id = pp.bairro_avulso_id
    ))
  );
--> statement-breakpoint

INSERT INTO product_own_delivery_prices (
  product_id,
  destination_type,
  region_id,
  bairro_id,
  cep_especifico_id,
  city_id,
  shipping_price,
  rapid_delivery_active,
  delivery_deadline,
  scheduled_delivery_active,
  scheduled_delivery_min_days,
  scheduled_delivery_price,
  is_active,
  created_at,
  updated_at
)
SELECT
  p.produto_id,
  CASE pp.tipo_destino
    WHEN 'regiao' THEN 'region'
    WHEN 'bairro' THEN 'bairro'
    WHEN 'cep' THEN 'cep-especifico'
    ELSE pp.tipo_destino
  END,
  pp.regiao_id,
  CASE WHEN pp.tipo_destino = 'bairro' THEN (
    SELECT b.id
    FROM bairros_avulsos ba
    JOIN cities c ON lower(trim(c.name)) = lower(trim(ba.city)) AND upper(c.state_uf) = upper(ba.state)
    JOIN bairros_entrega_propria b ON b.cidade_id = c.id AND b.nome_normalizado = translate(lower(trim(ba.neighborhood)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
    WHERE ba.id = pp.bairro_avulso_id
  ) END,
  pp.cep_especifico_id,
  pp.cidade_id,
  coalesce(pp.preco_rapida_em_centavos, 0),
  p.entrega_rapida_ativa AND pp.preco_rapida_em_centavos IS NOT NULL,
  NULL,
  p.entrega_programada_ativa AND pp.preco_programada_em_centavos IS NOT NULL,
  CASE
    WHEN p.entrega_programada_ativa AND pp.preco_programada_em_centavos IS NOT NULL
      THEN p.prazo_minimo_programada_dias
    ELSE NULL
  END,
  CASE
    WHEN p.entrega_programada_ativa AND pp.preco_programada_em_centavos IS NOT NULL
      THEN pp.preco_programada_em_centavos
    ELSE NULL
  END,
  p.ativa AND pp.ativa,
  least(p.created_at, pp.created_at),
  greatest(p.updated_at, pp.updated_at)
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
      OR (pp.tipo_destino = 'bairro' AND pop.bairro_id = (
        SELECT b.id
        FROM bairros_avulsos ba
        JOIN cities c ON lower(trim(c.name)) = lower(trim(ba.city)) AND upper(c.state_uf) = upper(ba.state)
        JOIN bairros_entrega_propria b ON b.cidade_id = c.id AND b.nome_normalizado = translate(lower(trim(ba.neighborhood)), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
        WHERE ba.id = pp.bairro_avulso_id
      ))
    )
);
--> statement-breakpoint

DO $$
DECLARE
  politicas_total integer;
  precos_migrados integer;
BEGIN
  SELECT count(*) INTO politicas_total FROM precos_politicas_entrega_propria;
  SELECT count(*) INTO precos_migrados
  FROM precos_politicas_entrega_propria pp
  JOIN politicas_entrega_propria p ON p.id = pp.politica_id
  WHERE EXISTS (
    SELECT 1
    FROM product_own_delivery_prices pop
    WHERE pop.product_id = p.produto_id
      AND (
        (pp.tipo_destino = 'cidade' AND pop.destination_type = 'cidade' AND pop.city_id = pp.cidade_id)
        OR (pp.tipo_destino = 'regiao' AND pop.destination_type = 'region' AND pop.region_id = pp.regiao_id)
        OR (pp.tipo_destino = 'cep' AND pop.destination_type = 'cep-especifico' AND pop.cep_especifico_id = pp.cep_especifico_id)
        OR (pp.tipo_destino = 'bairro' AND pop.bairro_id IS NOT NULL)
      )
  );

  IF precos_migrados <> politicas_total THEN
    RAISE EXCEPTION 'Migração incompleta: % de % preços absorvidos.', precos_migrados, politicas_total;
  END IF;

  IF EXISTS (SELECT 1 FROM shipping_regions WHERE city_id IS NULL) THEN
    RAISE EXCEPTION 'Migração incompleta: região sem city_id.';
  END IF;
END $$;
