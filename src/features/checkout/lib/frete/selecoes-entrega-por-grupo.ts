import type {
  CotacaoEntregaGrupoCheckout,
  SelecaoEntregaGrupoCheckout,
} from "../../types/checkout.types";

export function reconciliarSelecoesEntregaPorGrupo({
  cotacoes,
  selecoesAtuais,
  cep,
}: {
  cotacoes: CotacaoEntregaGrupoCheckout[];
  selecoesAtuais: SelecaoEntregaGrupoCheckout[];
  cep: string;
}) {
  const selecoesPorChave = new Map(
    selecoesAtuais.map((selecao) => [selecao.chaveGrupo, selecao]),
  );

  return cotacoes.flatMap((cotacao) => {
    const atual = selecoesPorChave.get(cotacao.chaveGrupo);
    if (!atual) return [];

    const opcaoAtual = cotacao.opcoes.find(
      (opcao) => opcao.identificador === atual.identificador,
    );
    if (!opcaoAtual) return [];

    return [{ ...opcaoAtual, chaveGrupo: cotacao.chaveGrupo, cep }];
  });
}

export function todasEntregasSelecionadas({
  cotacoes,
  selecoes,
}: {
  cotacoes: CotacaoEntregaGrupoCheckout[];
  selecoes: SelecaoEntregaGrupoCheckout[];
}) {
  const chavesSelecionadas = new Set(
    selecoes.map((selecao) => selecao.chaveGrupo),
  );

  return (
    cotacoes.length > 0 &&
    cotacoes.every(
      (cotacao) =>
        cotacao.opcoes.length > 0 &&
        chavesSelecionadas.has(cotacao.chaveGrupo),
    )
  );
}

export function somarSelecoesEntrega(
  selecoes: SelecaoEntregaGrupoCheckout[],
) {
  return selecoes.reduce(
    (total, selecao) => total + selecao.valorEmCentavos,
    0,
  );
}
