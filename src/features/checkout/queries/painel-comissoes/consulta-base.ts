import "server-only";

import { type SQL, sql } from "drizzle-orm";

import {
  REGRAS_SITUACAO_COMISSAO,
  type SinalComissao,
} from "../../lib/painel-comissoes/situacao-comissao";
import type { FiltrosPainelComissoes } from "../../types/painel-comissoes/painel.types";
/** SQL deriva da mesma política pura usada na quitação: não há regra de status em React. */
export function situacaoComissaoSql() {
  const sinais: Record<SinalComissao, SQL> = {
    confirmada: sql`b.confirmada`,
    cancelada: sql`b.cancelada`,
    estornada: sql`b.estornada`,
    quitada: sql`b.quitada`,
    pedidoCancelado: sql`b.pedido_status='canceled'`,
    pedidoReembolsado: sql`b.pedido_status='refunded'`,
  };
  const regras = REGRAS_SITUACAO_COMISSAO.map(
    (r) =>
      sql`when ${
        "algum" in r
          ? sql.join(
              r.algum.map((s) => sinais[s]),
              sql` or `,
            )
          : sql.join(
              r.nenhum.map((s) => sql`not (${sinais[s]})`),
              sql` and `,
            )
      } then ${r.situacao}`,
  );
  return sql`case ${sql.join(regras, sql` `)} else 'a_receber' end`;
}
export function montarConsultaBase(
  acesso: { gestor: boolean; userId: string },
  f: FiltrosPainelComissoes,
  id?: string,
) {
  const where: SQL[] = [sql`true`];
  if (!acesso.gestor)
    where.push(
      sql`c.representante_usuario_id=${acesso.userId}`,
      sql`exists(select 1 from checkout_item_comissao_eventos ev where ev.comissao_id=c.id and ev.tipo='confirmada')`,
    );
  if (id) where.push(sql`c.id=${id}`);
  if (f.representanteId)
    where.push(sql`c.representante_usuario_id=${f.representanteId}`);
  if (f.fornecedorId) where.push(sql`c.fornecedor_id=${f.fornecedorId}`);
  if (f.de)
    where.push(
      sql`c.created_at>=(${f.de}::timestamp at time zone 'America/Sao_Paulo')`,
    );
  if (f.ate)
    where.push(
      sql`c.created_at<((${f.ate}::date+interval '1 day') at time zone 'America/Sao_Paulo')`,
    );
  if (f.busca)
    where.push(
      sql`(i.nome_produto ilike ${`%${f.busca}%`} or coalesce(i.sku_produto,'') ilike ${`%${f.busca}%`} or p.numero_pedido ilike ${`%${f.busca}%`})`,
    );
  return sql`with base as(
 select c.id,c.pedido_id,c.snapshot,c.created_at,p.numero_pedido,p.status as pedido_status,i.nome_produto,i.sku_produto,u.name as representante,f.nome as fornecedor,
 q.id as quitacao_id,q.valor_em_centavos::text as quitado_centavos,q.data_quitacao,q.created_at as quitacao_registrada_em,${acesso.gestor ? sql`q.referencia,q.observacao` : sql`null::text as referencia,null::text as observacao`},
 exists(select 1 from checkout_item_comissao_eventos e where e.comissao_id=c.id and e.tipo='confirmada') as confirmada,
 exists(select 1 from checkout_item_comissao_eventos e where e.comissao_id=c.id and e.tipo='cancelada') as cancelada,
 exists(select 1 from checkout_item_comissao_eventos e where e.comissao_id=c.id and e.tipo='estornada') as estornada,
 (q.id is not null) as quitada
 from checkout_item_comissoes c join checkout_pedido_itens i on i.id=c.pedido_item_id and i.pedido_id=c.pedido_id
 join checkout_pedidos p on p.id=c.pedido_id join "user" u on u.id=c.representante_usuario_id
 join fornecedores f on f.id=c.fornecedor_id left join checkout_item_comissao_quitacoes q on q.comissao_id=c.id
 where ${sql.join(where, sql` and `)}
 ),situacoes as(select b.*,${situacaoComissaoSql()} as situacao from base b),filtradas as(select * from situacoes ${f.situacao ? sql`where situacao=${f.situacao}` : sql``})`;
}
export const colunasListagem = sql`id,created_at,numero_pedido,nome_produto,sku_produto,fornecedor,representante,pedido_id,situacao,quitado_centavos,(snapshot->'item'->>'quantidade')::int as quantidade,snapshot->'item'->>'valorLiquidoItemCentavos' as vendido_centavos,snapshot->>'comissaoCentavos' as comissao_centavos`;
