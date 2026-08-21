import "server-only";

import { analisarMatrizFreteMerchant } from "../../lib/analisar-matriz-frete-merchant";
import type { RelatorioMatrizFreteMerchant } from "../../types/matriz-frete-merchant";
import { cotarProdutoMatrizFreteMerchant } from "./cotar-produto-matriz-frete";
import { executarLeituraComTentativas } from "./executar-leitura-com-tentativas";
import { listarAlvosMatrizFreteMerchant } from "./listar-alvos-matriz-frete";
import { listarProdutosPadraoMatrizFreteMerchant } from "./listar-produtos-padrao-matriz-frete";

export type OpcoesMatrizFreteMerchant = {
  maximoProdutos: number;
  maximoAlvos: number;
  concorrencia: number;
  intervaloEntreCotacoesMs: number;
};

export async function gerarMatrizFreteMerchant(
  opcoes: OpcoesMatrizFreteMerchant,
): Promise<RelatorioMatrizFreteMerchant> {
  const [todosProdutos, dadosAlvos] = await Promise.all([
    executarLeituraComTentativas(listarProdutosPadraoMatrizFreteMerchant),
    executarLeituraComTentativas(() =>
      listarAlvosMatrizFreteMerchant(opcoes.maximoAlvos),
    ),
  ]);
  const produtos = todosProdutos.slice(0, opcoes.maximoProdutos);
  const alvos = dadosAlvos.alvos;
  const cache = new Map<
    string,
    ReturnType<typeof cotarProdutoMatrizFreteMerchant>
  >();
  const resultados = await analisarMatrizFreteMerchant({
    produtos,
    alvos,
    concorrencia: opcoes.concorrencia,
    intervaloEntreCotacoesMs: opcoes.intervaloEntreCotacoesMs,
    cotar(entrada) {
      const chave = `${entrada.produto.produtoId}:${entrada.produto.varianteId ?? "simples"}:${entrada.endereco.cep}`;
      const existente = cache.get(chave);
      if (existente) return existente;
      const cotacao = cotarProdutoMatrizFreteMerchant(entrada);
      cache.set(chave, cotacao);
      return cotacao;
    },
  });

  return {
    geradoEm: new Date().toISOString(),
    criterio:
      "Uma região é segura na amostra somente quando todos os itens Merchant sem shipping_label têm entrega em todos os CEPs representativos.",
    limites: opcoes,
    catalogo: {
      quantidadeItensPadraoEncontrados: todosProdutos.length,
      quantidadeItensAnalisados: produtos.length,
      produtosTruncados: produtos.length < todosProdutos.length,
    },
    regioes: {
      quantidadeAlvosEncontrados: dadosAlvos.quantidadeTotal,
      quantidadeAlvosAnalisados: alvos.length,
      alvosTruncados: alvos.length < dadosAlvos.quantidadeTotal,
    },
    resultados,
    limitacoes: [
      "Faixas usam primeiro, ponto central disponível e último CEP conhecidos; exceções por CEP e bairros avulsos são alvos separados.",
      "A análise não consulta ViaCEP e não cria cache: alvos sem endereço local são reportados como não analisáveis.",
      "Frenet é consultada pelo orquestrador oficial; os limites podem tornar o relatório parcial e isso fica indicado nos metadados.",
      "Prazo numérico permanece nulo quando o provedor central fornece apenas uma descrição textual.",
    ],
  };
}
