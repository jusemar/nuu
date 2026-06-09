import { calcularPrecoProduto } from "../../lib/calculos/calcular-preco-produto";
import { aplicarPromocoesPrecificacao } from "../../lib/calculos/aplicar-promocoes-precificacao";
import type {
  ConfiguracaoPagamentoCalculavel,
  EntradaPrecificacaoProduto,
  PrecosProdutoPorModalidade,
} from "../../types/precificacao.types";
import { buscarConfiguracaoPagamentoAtiva } from "../configuracao-pagamento/buscar-configuracao-pagamento-ativa";

type DependenciasCalcularPrecosProduto = {
  buscarConfiguracao?: () => Promise<ConfiguracaoPagamentoCalculavel>;
  aplicarPromocoes?: (entradas: EntradaPrecificacaoProduto[]) => Promise<
    {
      entrada: EntradaPrecificacaoProduto;
      promocao: NonNullable<EntradaPrecificacaoProduto["promocaoCalculada"]>;
    }[]
  >;
};

function criarPromocaoPrecificacaoInativa(entrada: EntradaPrecificacaoProduto) {
  return {
    ativa: false,
    precoOriginalEmCentavos: entrada.precoBaseEmCentavos,
    precoFinalEmCentavos: entrada.precoBaseEmCentavos,
    descontoAplicadoEmCentavos: 0,
    regraAplicadaId: null,
    tipoDesconto: null,
    valorDesconto: 0,
  } satisfies NonNullable<EntradaPrecificacaoProduto["promocaoCalculada"]>;
}

async function aplicarPromocoesComFallback(
  entradas: EntradaPrecificacaoProduto[],
  aplicarPromocoes: NonNullable<
    DependenciasCalcularPrecosProduto["aplicarPromocoes"]
  >,
) {
  try {
    return await aplicarPromocoes(entradas);
  } catch (error) {
    console.error("Erro ao aplicar promocoes na precificacao", error);

    return entradas.map((entrada) => ({
      entrada,
      promocao: criarPromocaoPrecificacaoInativa(entrada),
    }));
  }
}

export async function calcularPrecosProduto(
  entradas: EntradaPrecificacaoProduto[],
  dependencias: DependenciasCalcularPrecosProduto = {},
): Promise<PrecosProdutoPorModalidade> {
  if (entradas.length === 0) {
    return {};
  }

  const buscarConfiguracao =
    dependencias.buscarConfiguracao ?? buscarConfiguracaoPagamentoAtiva;
  const aplicarPromocoes =
    dependencias.aplicarPromocoes ?? aplicarPromocoesPrecificacao;
  const configuracao = await buscarConfiguracao();
  const entradasComPromocao = await aplicarPromocoesComFallback(
    entradas,
    aplicarPromocoes,
  );

  return Object.fromEntries(
    entradasComPromocao.map(({ entrada, promocao }) => {
      const entradaPrecificada = {
        ...entrada,
        promocaoCalculada: promocao,
      };

      return [
        entrada.modalidade,
        calcularPrecoProduto({
          entrada: entradaPrecificada,
          configuracao,
        }),
      ];
    }),
  );
}
