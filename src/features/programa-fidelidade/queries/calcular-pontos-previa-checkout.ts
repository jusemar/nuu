import "server-only";

import { eq, inArray } from "drizzle-orm";

import {
  configuracoesProgramaFidelidadeTable,
  regrasCategoriasProgramaFidelidadeTable,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import {
  calcularPontosPreviaCheckout,
  type ItemPreviaPontosCheckout,
} from "../lib/calcular-pontos-previa-checkout";

/** Consulta somente configuração/regras; preços e descontos já chegam da prévia oficial. */
export async function calcularPontosPreviaCheckoutComBanco({
  itens,
  descontoCupomEmCentavos,
  creditoFidelidadeEmCentavos,
}: {
  itens: ItemPreviaPontosCheckout[];
  descontoCupomEmCentavos: number;
  creditoFidelidadeEmCentavos: number;
}) {
  if (itens.length === 0) return "0.0000";

  const categoriasIds = [
    ...new Set(
      itens
        .map((item) => item.categoriaId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const [configuracoes, regras] = await Promise.all([
    dbTransacional
      .select({
        ativo: configuracoesProgramaFidelidadeTable.ativo,
        pontosPorReal: configuracoesProgramaFidelidadeTable.pontosPorReal,
      })
      .from(configuracoesProgramaFidelidadeTable)
      .where(eq(configuracoesProgramaFidelidadeTable.id, "global"))
      .limit(1),
    categoriasIds.length > 0
      ? dbTransacional
          .select({
            categoriaId: regrasCategoriasProgramaFidelidadeTable.categoriaId,
            ativa: regrasCategoriasProgramaFidelidadeTable.ativa,
            pontosPorReal:
              regrasCategoriasProgramaFidelidadeTable.pontosPorReal,
          })
          .from(regrasCategoriasProgramaFidelidadeTable)
          .where(
            inArray(
              regrasCategoriasProgramaFidelidadeTable.categoriaId,
              categoriasIds,
            ),
          )
      : Promise.resolve([]),
  ]);
  const configuracao = configuracoes[0];

  return calcularPontosPreviaCheckout({
    programaAtivo: configuracao?.ativo ?? false,
    pontosPorRealGlobal: configuracao?.pontosPorReal ?? "0.0000",
    regrasCategorias: regras,
    itens,
    descontoCupomEmCentavos,
    creditoFidelidadeEmCentavos,
  });
}
