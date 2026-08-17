import { ratearCupomEntreItens } from "./calcular-pontos-pedido";

const ESCALA_PONTOS = BigInt(10_000);

function pontosParaUnidades(valor: string) {
  const [inteira = "0", decimal = ""] = valor.split(".");
  return (
    BigInt(inteira) * ESCALA_PONTOS + BigInt(decimal.padEnd(4, "0").slice(0, 4))
  );
}

function unidadesParaPontos(unidades: bigint) {
  return `${unidades / ESCALA_PONTOS}.${String(unidades % ESCALA_PONTOS).padStart(4, "0")}`;
}

export function calcularCreditoPontos({
  pontos,
  pontosConversao,
  valorCreditoEmCentavos,
}: {
  pontos: string;
  pontosConversao: string;
  valorCreditoEmCentavos: number;
}) {
  return Number(
    (pontosParaUnidades(pontos) * BigInt(valorCreditoEmCentavos)) /
      pontosParaUnidades(pontosConversao),
  );
}

export function calcularLimitesResgate({
  saldoDisponivel,
  pontosConversao,
  valorCreditoEmCentavos,
  baseElegivelEmCentavos,
  totalAntesJurosEmCentavos,
  valorMinimoPagamentoEmCentavos,
}: {
  saldoDisponivel: string;
  pontosConversao: string;
  valorCreditoEmCentavos: number;
  baseElegivelEmCentavos: number;
  totalAntesJurosEmCentavos: number;
  valorMinimoPagamentoEmCentavos: number;
}) {
  const limiteCreditoEmCentavos = Math.max(
    Math.min(
      baseElegivelEmCentavos,
      totalAntesJurosEmCentavos - valorMinimoPagamentoEmCentavos,
    ),
    0,
  );
  const unidadesPorCredito =
    (BigInt(limiteCreditoEmCentavos) * pontosParaUnidades(pontosConversao)) /
    BigInt(valorCreditoEmCentavos);
  const maximoUnidades =
    unidadesPorCredito < pontosParaUnidades(saldoDisponivel)
      ? unidadesPorCredito
      : pontosParaUnidades(saldoDisponivel);

  return {
    limiteCreditoEmCentavos,
    maximoPontos: unidadesParaPontos(maximoUnidades),
  };
}

export function ratearCreditoFidelidadeEntreItens({
  itens,
  descontoCupomEmCentavos,
  creditoFidelidadeEmCentavos,
}: {
  itens: Array<{ id: string; valorBrutoEmCentavos: number }>;
  descontoCupomEmCentavos: number;
  creditoFidelidadeEmCentavos: number;
}) {
  const cupom = ratearCupomEntreItens({ itens, descontoCupomEmCentavos });
  const bases = itens.map((item) => ({
    id: item.id,
    valorBrutoEmCentavos: Math.max(
      item.valorBrutoEmCentavos - (cupom.get(item.id) ?? 0),
      0,
    ),
  }));
  return ratearCupomEntreItens({
    itens: bases,
    descontoCupomEmCentavos: creditoFidelidadeEmCentavos,
  });
}
