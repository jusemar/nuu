import "server-only";

import { sql } from "drizzle-orm";
import { z } from "zod";

import { dbTransacional } from "@/db/transaction";

import { exigirGestorRepresentantes } from "../representantes/exigir-gestor-representantes";
import {
  type AtendimentoElegivelJaaa,
  consultaElegiveisJaaa,
} from "./elegibilidade-atendimento";
/** Consulta apenas ao abrir a configuração de um produto, sem N+1 da listagem. */
export async function buscarAtendimentoProdutoJaaaGestor(entrada: unknown) {
  await exigirGestorRepresentantes();
  const id = z.uuid().parse(entrada);
  const [opcoes, atual] = await Promise.all([
    dbTransacional.execute<AtendimentoElegivelJaaa>(
      consultaElegiveisJaaa({ produtoId: id }),
    ),
    dbTransacional.execute<{ autorizacao_id: string | null }>(
      sql`select autorizacao_id from atendimentos_jaaa_produtos where produto_id=${id}`,
    ),
  ]);
  return {
    opcoes: opcoes.rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      fornecedor: r.fornecedor,
    })),
    selecionado: atual.rows[0]?.autorizacao_id ?? null,
  };
}
