import { calcularPontosPorValor } from "./calcular-pontos-pedido";

export type RegraFidelidadeVitrine = {
  programaAtivo: boolean;
  categoriaAtiva: boolean;
  pontosPorReal: string;
};

export type ProdutoParaPontuacaoVitrine = {
  chave: string;
  categoriaId: string;
  precoEmCentavos: number;
};

export type RegraCategoriaPontuacaoVitrine = {
  categoriaId: string;
  ativa: boolean;
  pontosPorReal: string | null;
};

/**
 * Reaproveita o mesmo cálculo determinístico da geração real de pontos.
 * A vitrine recebe o preço líquido promocional já resolvido pela precificação;
 * cupom, frete, juros e resgate continuam exclusivos do checkout.
 */
export function calcularPontosProdutoVitrine({
  precoEmCentavos,
  regra,
}: {
  precoEmCentavos: number;
  regra: RegraFidelidadeVitrine;
}) {
  if (
    !regra.programaAtivo ||
    !regra.categoriaAtiva ||
    !Number.isInteger(precoEmCentavos) ||
    precoEmCentavos <= 0
  ) {
    return null;
  }

  const pontos = calcularPontosPorValor({
    valorEmCentavos: precoEmCentavos,
    taxaPontosPorReal: regra.pontosPorReal,
  });

  return pontos === "0.0000" ? null : pontos;
}

export function formatarPontosProdutoVitrine(pontos: string) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 4,
  }).format(Number(pontos));
}

export function resolverPontosVitrineProdutos({
  produtos,
  configuracao,
  regrasCategorias,
}: {
  produtos: ProdutoParaPontuacaoVitrine[];
  configuracao: { ativo: boolean; pontosPorReal: string } | null;
  regrasCategorias: RegraCategoriaPontuacaoVitrine[];
}) {
  if (!configuracao?.ativo) return {};

  const regrasPorCategoria = new Map(
    regrasCategorias.map((regra) => [regra.categoriaId, regra]),
  );

  return Object.fromEntries(
    produtos.flatMap((produto) => {
      const regraCategoria = regrasPorCategoria.get(produto.categoriaId);
      const pontos = calcularPontosProdutoVitrine({
        precoEmCentavos: produto.precoEmCentavos,
        regra: {
          programaAtivo: configuracao.ativo,
          categoriaAtiva: regraCategoria?.ativa ?? true,
          pontosPorReal:
            regraCategoria?.pontosPorReal ?? configuracao.pontosPorReal,
        },
      });

      return pontos ? [[produto.chave, pontos] as const] : [];
    }),
  );
}
