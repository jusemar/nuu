import { calcularComissaoRepresentanteSchema } from "../../schemas/comissoes-representantes/comissao-representante.schema";
import type { EntradaCalculoComissaoRepresentante } from "../../types/comissoes-representantes/comissao-representante.types";

/** Puro: não consulta preço atual, autorização, frete ou taxas. Toda atribuição é explícita. */
export function calcularComissaoRepresentante(
  entrada: EntradaCalculoComissaoRepresentante,
) {
  const dados = calcularComissaoRepresentanteSchema.parse(entrada);
  for (const chave of [
    "representanteId",
    "representanteFornecedorId",
    "fornecedorId",
    "produtoId",
    "autorizacaoId",
  ] as const) {
    if (dados.atribuicao[chave] !== dados.regra.atribuicao[chave])
      throw new Error(
        "A regra não pertence à atribuição explícita desta venda.",
      );
  }
  if (!dados.regra.ativa) throw new Error("A comissão está inativa.");
  const regra = dados.regra.regra;
  // BigInt impede perda de precisão na multiplicação. Meio centavo arredonda para cima.
  const centavos =
    regra.tipo === "percentual"
      ? (BigInt(dados.item.valorLiquidoItemCentavos) * BigInt(regra.valor) +
          BigInt(5000)) /
        BigInt(10000)
      : BigInt(regra.valor) * BigInt(dados.item.quantidade);
  if (centavos > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("Comissão excede o limite monetário seguro.");
  return Number(centavos);
}
