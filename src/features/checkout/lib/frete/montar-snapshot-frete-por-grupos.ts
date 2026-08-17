import type {
  ResumoCheckoutCalculado,
  SelecaoEntregaGrupoCheckout,
} from "../../types/checkout.types";
import type {
  SnapshotFreteCheckoutVersao2,
  SnapshotItemGrupoEntrega,
} from "../../types/snapshot-frete.types";
import { formatarPrazoOpcaoEntrega } from "./normalizar-dados-opcao-entrega";

type ResultadoMontagemSnapshot =
  | { sucesso: true; snapshot: SnapshotFreteCheckoutVersao2 }
  | { sucesso: false; mensagem: string };

function falhar(mensagem: string): ResultadoMontagemSnapshot {
  return { sucesso: false, mensagem };
}

export function montarSnapshotFretePorGrupos({
  resumoRevalidado,
  selecoesRecebidas,
  itensPedido,
  cep,
}: {
  resumoRevalidado: ResumoCheckoutCalculado | null;
  selecoesRecebidas: Array<
    Pick<
      SelecaoEntregaGrupoCheckout,
      | "chaveGrupo"
      | "identificador"
      | "cep"
      | "valorEmCentavos"
      | "provedor"
      | "servico"
    >
  >;
  itensPedido: SnapshotItemGrupoEntrega[];
  cep: string;
}): ResultadoMontagemSnapshot {
  const cepNormalizado = cep.replace(/\D/g, "");

  if (!resumoRevalidado || cepNormalizado.length !== 8) {
    return falhar("Confirme o CEP e as formas de entrega novamente.");
  }

  const selecoesPorGrupo = new Map(
    selecoesRecebidas.map((selecao) => [selecao.chaveGrupo, selecao]),
  );
  if (selecoesPorGrupo.size !== selecoesRecebidas.length) {
    return falhar("Existe mais de uma seleção para a mesma entrega.");
  }

  const gruposCotados = new Set(
    resumoRevalidado.cotacoesEntrega.map((cotacao) => cotacao.chaveGrupo),
  );
  if (
    gruposCotados.size === 0 ||
    gruposCotados.size !== selecoesPorGrupo.size ||
    [...selecoesPorGrupo.keys()].some((chave) => !gruposCotados.has(chave))
  ) {
    return falhar(
      "A composição das entregas mudou. Revise as formas de entrega.",
    );
  }

  const itensPedidoPorId = new Map(
    itensPedido.map((item) => [item.itemCarrinhoId, item]),
  );
  const grupos = [] as SnapshotFreteCheckoutVersao2["grupos"];

  for (const cotacao of resumoRevalidado.cotacoesEntrega) {
    const selecao = selecoesPorGrupo.get(cotacao.chaveGrupo);
    const grupo = resumoRevalidado.gruposLogisticos.find(
      (atual) => atual.chave === cotacao.chaveGrupo,
    );
    const opcao = cotacao.opcoes.find(
      (atual) => atual.identificador === selecao?.identificador,
    );

    if (
      !selecao ||
      selecao.cep.replace(/\D/g, "") !== cepNormalizado ||
      !grupo ||
      !opcao
    ) {
      return falhar(
        "Uma forma de entrega mudou ou não está mais disponível. Selecione novamente.",
      );
    }
    if (
      selecao.valorEmCentavos !== opcao.valorEmCentavos ||
      selecao.provedor !== opcao.provedor ||
      selecao.servico !== opcao.servico
    ) {
      return falhar(
        "Os dados da forma de entrega mudaram. Selecione a opção novamente.",
      );
    }

    const itensGrupo = grupo.itens.flatMap((item) => {
      const itemPedido = itensPedidoPorId.get(item.id);
      return itemPedido ? [itemPedido] : [];
    });
    if (itensGrupo.length !== grupo.itens.length || itensGrupo.length === 0) {
      return falhar(
        "Os produtos de uma entrega mudaram. Revise o carrinho antes de continuar.",
      );
    }

    grupos.push({
      chaveGrupo: grupo.chave,
      cepOrigem: cotacao.cepOrigem,
      origemExpedicao: grupo.origemExpedicao,
      fornecedorProvedor: grupo.fornecedorProvedor,
      necessitaEtiquetaFornecedor: grupo.necessitaEtiquetaFornecedor,
      itens: itensGrupo,
      entrega: {
        identificadorOpcao: opcao.identificador,
        tipo: opcao.tipo,
        provedor: opcao.provedor,
        servicoId: opcao.servico,
        servicoNome: opcao.nome,
        transportadora: opcao.transportadora,
        valorEmCentavos: opcao.valorEmCentavos,
        prazo: formatarPrazoOpcaoEntrega(opcao),
        metadadosRelevantes: opcao.metadadosRelevantes,
      },
    });
  }

  const valorTotalEmCentavos = grupos.reduce(
    (total, grupo) => total + grupo.entrega.valorEmCentavos,
    0,
  );

  return {
    sucesso: true,
    snapshot: {
      versao: "2",
      cep: cepNormalizado,
      valorTotalEmCentavos,
      grupos,
    },
  };
}
