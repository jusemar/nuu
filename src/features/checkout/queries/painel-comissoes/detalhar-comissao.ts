import "server-only";

import { sql } from "drizzle-orm";
import { z } from "zod";

import { dbTransacional } from "@/db/transaction";

import type { DetalheComissao } from "../../types/painel-comissoes/painel.types";
import { obterAcessoPainelComissoes } from "./acesso-painel";
import { colunasListagem, montarConsultaBase } from "./consulta-base";
import { apresentarLinha, type RegistroListagem } from "./listar-comissoes";
export async function detalharComissaoPainel(
  entrada: unknown,
): Promise<DetalheComissao> {
  const id = z.uuid().parse(entrada),
    acesso = await obterAcessoPainelComissoes();
  const base = montarConsultaBase(acesso, {}, id);
  const [r] = (
    await dbTransacional.execute<
      RegistroListagem & {
        unitario: string;
        desconto: string;
        tipo: "fixa" | "percentual";
        valor: number;
        versao: string;
        data_quitacao: Date | string | null;
        quitacao_registrada_em: Date | string | null;
        referencia: string | null;
        observacao: string | null;
      }
    >(
      sql`${base} select ${colunasListagem},snapshot->'item'->>'precoUnitarioVendidoCentavos' as unitario,snapshot->'item'->>'descontoItemCentavos' as desconto,snapshot->'regra'->>'tipo' as tipo,(snapshot->'regra'->>'valor')::int as valor,snapshot->'regra'->>'versao' as versao,data_quitacao,quitacao_registrada_em,referencia,observacao from filtradas`,
    )
  ).rows;
  if (!r) throw new Error("Comissão indisponível.");
  const eventos = (
    await dbTransacional.execute<{ tipo: string; created_at: Date | string }>(
      sql`select tipo,created_at from checkout_item_comissao_eventos where comissao_id=${id} order by created_at,id`,
    )
  ).rows;
  let responsavel = "";
  if (acesso.gestor && r.quitado_centavos !== null)
    responsavel =
      (
        await dbTransacional.execute<{ nome: string }>(
          sql`select u.name as nome from checkout_item_comissao_quitacoes q join administradores a on a.id=q.responsavel_administrador_id join "user" u on u.id=a.usuario_id where q.comissao_id=${id}`,
        )
      ).rows[0]?.nome ?? "";
  return {
    linha: apresentarLinha(r, acesso.gestor),
    precoUnitarioCentavos: r.unitario,
    descontoCentavos: r.desconto,
    regra: { tipo: r.tipo, valor: r.valor, versao: r.versao },
    eventos: eventos.map((e) => ({
      tipo: e.tipo,
      data: new Date(e.created_at).toISOString(),
    })),
    quitacao:
      r.data_quitacao && r.quitado_centavos !== null
        ? {
            data: new Date(r.data_quitacao).toISOString(),
            registradaEm: new Date(r.quitacao_registrada_em!).toISOString(),
            valorCentavos: r.quitado_centavos,
            ...(acesso.gestor
              ? {
                  gestao: {
                    responsavel,
                    referencia: r.referencia,
                    observacao: r.observacao,
                  },
                }
              : {}),
          }
        : null,
    gestor: acesso.gestor,
    podeQuitar: acesso.gestor && r.situacao === "a_receber",
  };
}
