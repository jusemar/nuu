import "dotenv/config";

import { sql } from "drizzle-orm";

import { db } from "@/db/connection";

const FILTRO_PRODUTO_FISICO = sql`coalesce(lower(p.product_type), '') not in ('digital', 'servico', 'serviço', 'service')`;
const FILTRO_PRODUTO_FISICO_VARIANTE = sql`coalesce(lower(p.product_type), '') not in ('digital', 'servico', 'serviço', 'service')`;

async function executar() {
  const resumoAntes = await db.execute(sql`
    select
      count(*)::int as total_fisicos,
      count(*) filter (
        where coalesce(p.weight_in_grams, 0) = 0
           or coalesce(p.height_in_cm, 0) = 0
           or coalesce(p.width_in_cm, 0) = 0
           or coalesce(p.length_in_cm, 0) = 0
      )::int as fisicos_com_medidas_pendentes
    from product p
    where ${FILTRO_PRODUTO_FISICO};
  `);

  const updateProdutos = await db.execute(sql`
    update product p
    set
      weight_in_grams = case when coalesce(p.weight_in_grams, 0) = 0 then 1000 else p.weight_in_grams end,
      height_in_cm = case when coalesce(p.height_in_cm, 0) = 0 then 10 else p.height_in_cm end,
      width_in_cm = case when coalesce(p.width_in_cm, 0) = 0 then 20 else p.width_in_cm end,
      length_in_cm = case when coalesce(p.length_in_cm, 0) = 0 then 30 else p.length_in_cm end,
      updated_at = now()
    where ${FILTRO_PRODUTO_FISICO}
      and (
        coalesce(p.weight_in_grams, 0) = 0
        or coalesce(p.height_in_cm, 0) = 0
        or coalesce(p.width_in_cm, 0) = 0
        or coalesce(p.length_in_cm, 0) = 0
      );
  `);

  const updateVariantes = await db.execute(sql`
    update product_variant pv
    set
      weight_in_grams = case when coalesce(pv.weight_in_grams, 0) = 0 then 1000 else pv.weight_in_grams end,
      height_in_cm = case when coalesce(pv.height_in_cm, 0) = 0 then 10 else pv.height_in_cm end,
      width_in_cm = case when coalesce(pv.width_in_cm, 0) = 0 then 20 else pv.width_in_cm end,
      length_in_cm = case when coalesce(pv.length_in_cm, 0) = 0 then 30 else pv.length_in_cm end,
      updated_at = now()
    from product p
    where pv.product_id = p.id
      and ${FILTRO_PRODUTO_FISICO_VARIANTE}
      and (
        coalesce(pv.weight_in_grams, 0) = 0
        or coalesce(pv.height_in_cm, 0) = 0
        or coalesce(pv.width_in_cm, 0) = 0
        or coalesce(pv.length_in_cm, 0) = 0
      );
  `);

  const produtoValidacao = await db.execute(sql`
    select
      p.id,
      p.name,
      p.slug,
      p.weight_in_grams,
      p.height_in_cm,
      p.width_in_cm,
      p.length_in_cm
    from product p
    where ${FILTRO_PRODUTO_FISICO}
      and p.weight_in_grams = 1000
      and p.height_in_cm = 10
      and p.width_in_cm = 20
      and p.length_in_cm = 30
    order by p.updated_at desc
    limit 1;
  `);

  console.log(
    JSON.stringify(
      {
        resumoAntes: resumoAntes.rows?.[0] ?? null,
        produtosAtualizados: updateProdutos.rowCount ?? 0,
        variantesAtualizadas: updateVariantes.rowCount ?? 0,
        produtoValidacao: produtoValidacao.rows?.[0] ?? null,
      },
      null,
      2,
    ),
  );
}

executar().catch((erro) => {
  console.error("[preencher-medidas-produtos-fisicos]", erro);
  process.exit(1);
});

