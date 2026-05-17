import { calcularPrecoProduto } from "../../lib/calculos/calcular-preco-produto";
import type {
  EntradaPrecificacaoProduto,
  PrecosProdutoPorModalidade,
} from "../../types/precificacao.types";
import { buscarConfiguracaoPagamentoAtiva } from "../configuracao-pagamento/buscar-configuracao-pagamento-ativa";

export async function calcularPrecosProduto(
  entradas: EntradaPrecificacaoProduto[],
): Promise<PrecosProdutoPorModalidade> {
  const configuracao = await buscarConfiguracaoPagamentoAtiva();

  return Object.fromEntries(
    entradas.map((entrada) => [
      entrada.modalidade,
      calcularPrecoProduto({
        entrada,
        configuracao,
      }),
    ]),
  );
}
