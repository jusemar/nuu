import "server-only";

import { sql } from "drizzle-orm";

import { dbTransacional } from "@/db/transaction";

import type { SituacaoComissao } from "../../lib/painel-comissoes/situacao-comissao";
import { filtrosComissoesSchema } from "../../schemas/painel-comissoes/painel.schema";
import type {
  LinhaComissao,
  ResultadoPainelComissoes,
} from "../../types/painel-comissoes/painel.types";
import { obterAcessoPainelComissoes } from "./acesso-painel";
import { colunasListagem, montarConsultaBase } from "./consulta-base";
export type RegistroListagem = {
  id: string;
  created_at: Date | string;
  numero_pedido: string;
  nome_produto: string;
  sku_produto: string | null;
  fornecedor: string;
  representante: string;
  pedido_id: string;
  situacao: SituacaoComissao;
  quitado_centavos: string | null;
  quantidade: number;
  vendido_centavos: string;
  comissao_centavos: string;
};
/** DTO por lista explícita: dados do cliente, custos e configuração atual nunca são serializados. */
export function apresentarLinha(
  r: RegistroListagem,
  gestor: boolean,
): LinhaComissao {
  return {
    id: r.id,
    data: new Date(r.created_at).toISOString(),
    produto: r.nome_produto,
    sku: r.sku_produto,
    pedido: r.numero_pedido,
    quantidade: r.quantidade,
    vendidoCentavos: r.vendido_centavos,
    comissaoCentavos: r.comissao_centavos,
    situacao: r.situacao,
    fornecedor: r.fornecedor,
    quitadoHistoricoCentavos: r.quitado_centavos,
    ...(gestor
      ? { gestao: { representante: r.representante, pedidoId: r.pedido_id } }
      : {}),
  };
}
export async function listarComissoesPainel(
  entrada: unknown = {},
): Promise<ResultadoPainelComissoes> {
  const acesso = await obterAcessoPainelComissoes(),
    f = filtrosComissoesSchema.parse(entrada);
  if (!acesso.gestor && f.representanteId)
    throw new Error("Filtro de titular indisponível.");
  const base = montarConsultaBase(acesso, f),
    porPagina = 20;
  return dbTransacional.transaction(
    async (tx) => {
      const linhas = await tx.execute<RegistroListagem>(
        sql`${base} select ${colunasListagem} from filtradas order by created_at desc,id desc limit ${porPagina} offset ${(f.pagina - 1) * porPagina}`,
      );
      const [t] = (
        await tx.execute<{
          itens: string;
          vendido: string;
          valida: string;
          receber: string;
          invalidada: string;
          quitada: string;
        }>(sql`${base} select count(*)::text as itens,
 coalesce(sum((snapshot->'item'->>'valorLiquidoItemCentavos')::numeric) filter(where situacao in ('a_receber','quitada')),0)::text as vendido,
 coalesce(sum((snapshot->>'comissaoCentavos')::numeric) filter(where situacao in ('a_receber','quitada')),0)::text as valida,
 coalesce(sum((snapshot->>'comissaoCentavos')::numeric) filter(where situacao='a_receber'),0)::text as receber,
 coalesce(sum((snapshot->>'comissaoCentavos')::numeric) filter(where situacao in ('cancelada','estornada')),0)::text as invalidada,
 coalesce(sum(quitado_centavos::numeric),0)::text as quitada from filtradas`)
      ).rows;
      return {
        gestor: acesso.gestor,
        linhas: linhas.rows.map((r) => apresentarLinha(r, acesso.gestor)),
        total: Number(t.itens),
        pagina: f.pagina,
        porPagina,
        totais: {
          itens: t.itens,
          vendidoValido: t.vendido,
          comissaoValida: t.valida,
          aReceber: t.receber,
          invalidada: t.invalidada,
          quitadaHistorica: t.quitada,
        },
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
