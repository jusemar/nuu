import "server-only";

import { sql, type SQLWrapper } from "drizzle-orm";

import { productTable } from "@/db/schema";
import { obterAmbienteAplicacaoLaquila } from "@/features/fornecedores/integracoes/laquila/lib/ambiente-laquila";

type ColunasLogisticaProduto = {
  id: SQLWrapper;
  peso: SQLWrapper;
  altura: SQLWrapper;
  largura: SQLWrapper;
  comprimento: SQLWrapper;
  tiposEntrega: SQLWrapper;
  permiteRetirada: SQLWrapper;
};

const colunasProdutoPadrao: ColunasLogisticaProduto = {
  id: productTable.id,
  peso: productTable.weight,
  altura: productTable.height,
  largura: productTable.width,
  comprimento: productTable.length,
  tiposEntrega: productTable.allowedDeliveryTypes,
  permiteRetirada: productTable.allowsPickup,
};

/** Colunas do alias fixo usado pela consulta SQL da busca do cabeçalho. */
export function colunasLogisticaProdutoAliasP(): ColunasLogisticaProduto {
  return {
    id: sql.raw("p.id"),
    peso: sql.raw("p.weight_in_grams"),
    altura: sql.raw("p.height_in_cm"),
    largura: sql.raw("p.width_in_cm"),
    comprimento: sql.raw("p.length_in_cm"),
    tiposEntrega: sql.raw("p.allowed_delivery_types"),
    permiteRetirada: sql.raw("p.allows_pickup"),
  };
}

/**
 * Espelho SQL da validação de domínio para filtrar a vitrine sem N+1.
 * Produtos apenas para retirada não precisam de pacote; qualquer modalidade
 * de envio continua exigindo peso, dimensões e uma origem reconhecida.
 */
export function condicaoProdutoLogisticamenteElegivel(
  colunas: ColunasLogisticaProduto = colunasProdutoPadrao,
) {
  const ambiente = obterAmbienteAplicacaoLaquila();
  const tipos = sql`coalesce(${colunas.tiposEntrega}, ARRAY[]::text[])`;
  const possuiEnvio = sql`cardinality(${tipos}) > 0`;
  const somenteRetirada = sql`
    coalesce(${colunas.permiteRetirada}, false) = true
    AND cardinality(${tipos}) = 0
  `;
  const pacoteValido = sql`
    ${colunas.peso} > 0
    AND ${colunas.altura} > 0
    AND ${colunas.largura} > 0
    AND ${colunas.comprimento} > 0
  `;
  const tiposValidos = sql`
    NOT EXISTS (
      SELECT 1
      FROM unnest(${tipos}) AS tipo_entrega(valor)
      WHERE tipo_entrega.valor NOT IN ('own', 'supplier', 'carrier')
    )
  `;
  const possuiVinculoLaquila = sql`
    EXISTS (
      SELECT 1
      FROM fornecedor_produto_vinculos vinculo_logistico
      INNER JOIN fornecedor_integracoes_api integracao_logistica
        ON integracao_logistica.fornecedor_id = vinculo_logistico.fornecedor_id
      WHERE vinculo_logistico.produto_id = ${colunas.id}
        AND integracao_logistica.provedor = 'laquila'
        AND integracao_logistica.ambiente = ${ambiente}
    )
  `;
  const laquilaValida = sql`
    'supplier' = ANY(${tipos})
    AND NOT ('own' = ANY(${tipos}))
    AND EXISTS (
      SELECT 1
      FROM fornecedor_produto_vinculos vinculo_laquila_valido
      INNER JOIN fornecedor_integracoes_api integracao_laquila_valida
        ON integracao_laquila_valida.fornecedor_id = vinculo_laquila_valido.fornecedor_id
      WHERE vinculo_laquila_valido.produto_id = ${colunas.id}
        AND vinculo_laquila_valido.status = 'ativo'
        AND nullif(trim(vinculo_laquila_valido.codigo_fornecedor), '') IS NOT NULL
        AND integracao_laquila_valida.provedor = 'laquila'
        AND integracao_laquila_valida.ambiente = ${ambiente}
    )
  `;

  return sql<boolean>`
    (
      (${somenteRetirada})
      OR ((${possuiEnvio}) AND (${pacoteValido}) AND (${tiposValidos}))
    )
    AND (NOT (${possuiVinculoLaquila}) OR (${laquilaValida}))
  `;
}
