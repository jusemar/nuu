import "server-only";

import { sql } from "drizzle-orm";
export type AtendimentoElegivelJaaa = {
  id: string;
  usuario_id: string;
  nome: string;
  fornecedor: string;
  identidade: string;
};
/** A MESMA elegibilidade atende configuração, renderização e clique. Não consulta comissão. */
export function consultaElegiveisJaaa({
  produtoId,
  autorizacaoId,
  publico = false,
  escolhido = false,
  bloquear = false,
}: {
  produtoId: string;
  autorizacaoId?: string;
  publico?: boolean;
  escolhido?: boolean;
  bloquear?: boolean;
}) {
  return sql`select a.id,r.usuario_id,u.name as nome,f.nome as fornecedor,j.identidade
 from autorizacoes_produtos_representantes a
 join representantes_fornecedores r on r.id=a.representante_fornecedor_id
 join fornecedores f on f.id=r.fornecedor_id
 join "user" u on u.id=r.usuario_id
 join administradores ad on ad.usuario_id=r.usuario_id
 join identidades_jaaa_representantes j on j.usuario_id=r.usuario_id
 join product p on p.id=a.produto_id
 join product_pricing pr on pr.product_id=p.id
 join fornecedor_produto_vinculos v on v.produto_id=p.id and v.fornecedor_id=f.id
 where a.produto_id=${produtoId} and a.ativa and r.ativo and f.status='ativo' and ad.status='ativo' and j.ativa
 and p.product_kind='simple' and pr.type='dropshipping' and pr.is_active=true and v.status='ativo'
 and not exists(select 1 from product_pricing outra where outra.product_id=p.id and outra.id<>pr.id)
 and not exists(select 1 from fornecedor_produto_vinculos outro where outro.produto_id=p.id and outro.fornecedor_id=f.id and outro.id<>v.id)
 ${publico ? sql`and p.is_active=true and p.status='published'` : sql``}
 ${autorizacaoId ? sql`and a.id=${autorizacaoId}` : sql``}
 ${escolhido ? sql`and a.id=(select e.autorizacao_id from atendimentos_jaaa_produtos e where e.produto_id=p.id)` : sql``}
 order by u.name,a.id ${bloquear ? sql`for share of a,r,f,ad,j,p,pr,v` : sql``}`;
}
