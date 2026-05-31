"use server";

import { db } from "@/db/connection";
import {
  produtosTiposLogisticosTable,
  regrasProdutosFreteTable,
  servicosFreteTable,
  tiposLogisticosTable,
  transportadorasFreteTable,
  provedoresFreteTable,
} from "@/db/schema";
import { erroConexaoLogisticaIndisponivel } from "@/features/admin/logistica/lib/erro-tabela-logistica-ausente";
import { eq } from "drizzle-orm";

export async function buscarResumoLogisticaProduto(produtoId?: string) {
  try {
    const tiposDisponiveis = await db
      .select({
        id: tiposLogisticosTable.id,
        nome: tiposLogisticosTable.nome,
        ativo: tiposLogisticosTable.ativo,
      })
      .from(tiposLogisticosTable);

    if (!produtoId) {
      return {
        tiposDisponiveis,
        tiposVinculados: [],
        regrasProduto: [],
      };
    }

    const [tiposVinculados, regrasProduto] = await Promise.all([
      db
        .select({
          vinculoId: produtosTiposLogisticosTable.id,
          tipoLogisticoId: produtosTiposLogisticosTable.tipoLogisticoId,
          tipoLogisticoNome: tiposLogisticosTable.nome,
        })
        .from(produtosTiposLogisticosTable)
        .innerJoin(
          tiposLogisticosTable,
          eq(
            produtosTiposLogisticosTable.tipoLogisticoId,
            tiposLogisticosTable.id,
          ),
        )
        .where(eq(produtosTiposLogisticosTable.produtoId, produtoId)),
      db
        .select({
          id: regrasProdutosFreteTable.id,
          efeito: regrasProdutosFreteTable.efeito,
          ativo: regrasProdutosFreteTable.ativo,
          provedorNome: provedoresFreteTable.nome,
          transportadoraNome: transportadorasFreteTable.nome,
          servicoNome: servicosFreteTable.nome,
        })
        .from(regrasProdutosFreteTable)
        .leftJoin(
          provedoresFreteTable,
          eq(regrasProdutosFreteTable.provedorFreteId, provedoresFreteTable.id),
        )
        .leftJoin(
          transportadorasFreteTable,
          eq(
            regrasProdutosFreteTable.transportadoraFreteId,
            transportadorasFreteTable.id,
          ),
        )
        .leftJoin(
          servicosFreteTable,
          eq(regrasProdutosFreteTable.servicoFreteId, servicosFreteTable.id),
        )
        .where(eq(regrasProdutosFreteTable.produtoId, produtoId)),
    ]);

    return {
      tiposDisponiveis,
      tiposVinculados,
      regrasProduto,
    };
  } catch (erro) {
    if (erroConexaoLogisticaIndisponivel(erro)) {
      return {
        tiposDisponiveis: [],
        tiposVinculados: [],
        regrasProduto: [],
      };
    }
    throw erro;
  }
}
