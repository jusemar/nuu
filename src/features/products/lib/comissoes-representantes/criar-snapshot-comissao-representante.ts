import { z } from "zod";

import { calcularComissaoRepresentanteSchema } from "../../schemas/comissoes-representantes/comissao-representante.schema";
import type {
  EntradaCalculoComissaoRepresentante,
  SnapshotComissaoRepresentante,
} from "../../types/comissoes-representantes/comissao-representante.types";
import { calcularComissaoRepresentante } from "./calcular-comissao-representante";

/** Sem atribuição determinística não há comissão; não escolhe nem enumera representantes. */
export function criarSnapshotComissaoRepresentante(
  entrada:
    | (EntradaCalculoComissaoRepresentante & { ocorridoEm: string })
    | { atribuicao: null },
): SnapshotComissaoRepresentante | null {
  if (entrada.atribuicao === null) {
    z.object({ atribuicao: z.null() }).strict().parse(entrada);
    return null;
  }
  const { ocorridoEm, ...calculo } = entrada;
  const data = z.iso.datetime().parse(ocorridoEm);
  const dados = calcularComissaoRepresentanteSchema.parse(calculo);
  const comissaoCentavos = calcularComissaoRepresentante(dados);
  // Cópias novas e congeladas: editar a configuração original nunca modifica este snapshot.
  return Object.freeze({
    versaoContrato: 1,
    ocorridoEm: data,
    atribuicao: Object.freeze({ ...dados.atribuicao }),
    regra: Object.freeze({
      autorizacaoId: dados.atribuicao.autorizacaoId,
      versao: dados.regra.versao,
      ...dados.regra.regra,
      ativa: true as const,
    }),
    item: Object.freeze({ ...dados.item }),
    comissaoCentavos,
    arredondamento: "meio_para_cima_por_item",
  });
}
