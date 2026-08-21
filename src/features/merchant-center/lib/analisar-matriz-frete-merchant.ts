import type {
  AlvoMatrizFreteMerchant,
  ProdutoPadraoMatrizFreteMerchant,
  ResultadoAlvoMatrizFreteMerchant,
  ResultadoCotacaoMatrizFreteMerchant,
} from "../types/matriz-frete-merchant";

type EntradaAnalise = {
  produtos: ProdutoPadraoMatrizFreteMerchant[];
  alvos: AlvoMatrizFreteMerchant[];
  concorrencia: number;
  intervaloEntreCotacoesMs: number;
  cotar: (entrada: {
    produto: ProdutoPadraoMatrizFreteMerchant;
    endereco: AlvoMatrizFreteMerchant["amostras"][number];
  }) => Promise<ResultadoCotacaoMatrizFreteMerchant>;
};

type CotacaoIdentificada = ResultadoCotacaoMatrizFreteMerchant & {
  alvoId: string;
  merchantId: string;
  cep: string;
};

const aguardar = (tempoMs: number) =>
  tempoMs > 0
    ? new Promise<void>((resolver) => setTimeout(resolver, tempoMs))
    : Promise.resolve();

function agregarAlvo(
  alvo: AlvoMatrizFreteMerchant,
  produtos: ProdutoPadraoMatrizFreteMerchant[],
  cotacoes: CotacaoIdentificada[],
): ResultadoAlvoMatrizFreteMerchant {
  const impedimentos: ResultadoAlvoMatrizFreteMerchant["impedimentos"] = [];
  let entregaveis = 0;
  let maiorCusto: number | null = null;
  let maiorPrazo: number | null = null;

  if (alvo.amostras.length === 0) {
    for (const produto of produtos) {
      impedimentos.push({
        merchantId: produto.merchantId,
        titulo: produto.titulo,
        cep: null,
        causa:
          alvo.motivoSemAmostra ?? "Alvo sem CEP representativo conhecido.",
      });
    }
  } else {
    for (const produto of produtos) {
      const resultados = cotacoes.filter(
        (item) =>
          item.alvoId === alvo.id && item.merchantId === produto.merchantId,
      );
      const falhas = resultados.filter((item) => !item.entregavel);
      if (resultados.length === alvo.amostras.length && falhas.length === 0) {
        entregaveis += 1;
        for (const resultado of resultados) {
          if (resultado.menorCustoEmCentavos !== null) {
            maiorCusto = Math.max(
              maiorCusto ?? resultado.menorCustoEmCentavos,
              resultado.menorCustoEmCentavos,
            );
          }
          if (resultado.maiorPrazoEmDiasUteis !== null) {
            maiorPrazo = Math.max(
              maiorPrazo ?? resultado.maiorPrazoEmDiasUteis,
              resultado.maiorPrazoEmDiasUteis,
            );
          }
        }
      } else {
        for (const falha of falhas) {
          impedimentos.push({
            merchantId: produto.merchantId,
            titulo: produto.titulo,
            cep: falha.cep,
            causa: falha.causa ?? "Nenhuma opção de entrega válida.",
          });
        }
      }
    }
  }

  const naoEntregaveis = produtos.length - entregaveis;
  return {
    id: alvo.id,
    tipo: alvo.tipo,
    nome: alvo.nome,
    cepsAmostrados: alvo.amostras.map((item) => item.cep),
    quantidadeProdutosAnalisados: produtos.length,
    quantidadeEntregavel: entregaveis,
    quantidadeNaoEntregavel: naoEntregaveis,
    maiorCustoMinimoEmCentavos: maiorCusto,
    maiorPrazoEmDiasUteis: maiorPrazo,
    coberturaPadraoSeguraNaAmostra:
      alvo.amostras.length > 0 && naoEntregaveis === 0,
    impedimentos,
  };
}

export async function analisarMatrizFreteMerchant({
  produtos,
  alvos,
  concorrencia,
  intervaloEntreCotacoesMs,
  cotar,
}: EntradaAnalise) {
  const tarefas = alvos.flatMap((alvo) =>
    produtos.flatMap((produto) =>
      alvo.amostras.map((endereco) => ({ alvo, produto, endereco })),
    ),
  );
  const cotacoes: CotacaoIdentificada[] = [];
  let indice = 0;

  async function executarTrabalhador() {
    while (indice < tarefas.length) {
      const tarefa = tarefas[indice++];
      if (!tarefa) return;
      const resultado = await cotar({
        produto: tarefa.produto,
        endereco: tarefa.endereco,
      });
      cotacoes.push({
        ...resultado,
        alvoId: tarefa.alvo.id,
        merchantId: tarefa.produto.merchantId,
        cep: tarefa.endereco.cep,
      });
      await aguardar(intervaloEntreCotacoesMs);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.max(1, Math.min(concorrencia, tarefas.length || 1)) },
      executarTrabalhador,
    ),
  );

  return alvos.map((alvo) => agregarAlvo(alvo, produtos, cotacoes));
}
