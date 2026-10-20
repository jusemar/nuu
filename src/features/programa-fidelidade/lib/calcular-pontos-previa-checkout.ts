import {
  calcularPontosItensPedido,
  somarPontosItensPedido,
} from "./calcular-pontos-pedido";
import { ratearCreditoFidelidadeEntreItens } from "./calcular-resgate-fidelidade";
import { resolverRegraCategoriaFidelidade } from "./resolver-regra-categoria-fidelidade";

export type ItemPreviaPontosCheckout = {
  id: string;
  categoriaId: string | null;
  valorBrutoEmCentavos: number;
};

export type RegraCategoriaPreviaPontos = {
  categoriaId: string;
  ativa: boolean;
  pontosPorReal: string | null;
};

/**
 * Monta a mesma entrada consumida pela geração pós-pagamento. Cupom e crédito são
 * rateados com os mesmos algoritmos usados ao congelar e processar o pedido.
 */
export function calcularPontosPreviaCheckout({
  programaAtivo,
  pontosPorRealGlobal,
  regrasCategorias,
  itens,
  descontoCupomEmCentavos,
  creditoFidelidadeEmCentavos,
}: {
  programaAtivo: boolean;
  pontosPorRealGlobal: string;
  regrasCategorias: RegraCategoriaPreviaPontos[];
  itens: ItemPreviaPontosCheckout[];
  descontoCupomEmCentavos: number;
  creditoFidelidadeEmCentavos: number;
}) {
  if (!programaAtivo || itens.some((item) => item.categoriaId === null)) {
    return "0.0000";
  }

  const regrasPorCategoria = new Map(
    regrasCategorias.map((regra) => [regra.categoriaId, regra]),
  );
  const itensParaRateio = itens.map((item) => ({
    id: item.id,
    valorBrutoEmCentavos: item.valorBrutoEmCentavos,
  }));
  const creditoPorItem = ratearCreditoFidelidadeEntreItens({
    itens: itensParaRateio,
    descontoCupomEmCentavos,
    creditoFidelidadeEmCentavos,
  });
  const calculos = calcularPontosItensPedido({
    descontoCupomEmCentavos,
    itens: itens.map((item) => {
      const regra = regrasPorCategoria.get(item.categoriaId!);
      const regraEfetiva = resolverRegraCategoriaFidelidade(
        regra,
        pontosPorRealGlobal,
      );
      return {
        ...item,
        categoriaId: item.categoriaId!,
        ativa: regraEfetiva.participa,
        origemRegra: regraEfetiva.origemRegra,
        taxaPontosPorReal: regraEfetiva.pontosPorReal,
        creditoFidelidadeRateadoEmCentavos: creditoPorItem.get(item.id) ?? 0,
      };
    }),
  });

  return somarPontosItensPedido(calculos);
}
