import {
  cotarFreteFluxoAtual,
  filtrarResultadoCotacaoFreteDisponivel,
  type DisponibilidadeFreteProduto,
  type EntradaCotacaoFreteFluxoAtual,
  type ItemLogistico,
  type OpcaoFrete,
  type PacoteEnvio,
  type ResultadoCotacaoFrete,
  type RetiradaAtualDisponivel,
} from "@/features/logistica";
import type { ItemCarrinho } from "@/features/carrinho";

type ModalidadeFreteCarrinho = "retirada" | "entrega-propria" | "frenet";

export type ProdutoRevalidacaoFreteCheckout = {
  id: string;
  categoryId?: string | null;
  name: string;
  sku: string;
  productKind?: string | null;
  weight?: number | null;
  height?: number | null;
  width?: number | null;
  length?: number | null;
  allowsOwnDelivery?: boolean | null;
  allowsPickup?: boolean | null;
  prazoRetiradaCustom?: string | null;
  modeloRetirada?: {
    id: string;
    nome: string;
    prazoTexto: string;
    mensagem: string | null;
    ativo: boolean | null;
  } | null;
  variants?: VarianteRevalidacaoFreteCheckout[];
};

type VarianteRevalidacaoFreteCheckout = {
  id: string;
  sku: string;
  name: string | null;
  weightInGrams: number | null;
  heightInCm: number | null;
  widthInCm: number | null;
  lengthInCm: number | null;
};

export type ConsultaEntregaPropriaRevalidacaoCheckout =
  | {
      disponivel: true;
      valorEmCentavos: number;
      descricao?: string | null;
    }
  | {
      disponivel: false;
      motivo?: string | null;
    };

export type DependenciasRevalidacaoFreteCheckout = {
  cotarFreteLogistica?: (
    entrada: EntradaCotacaoFreteFluxoAtual,
  ) => Promise<ResultadoCotacaoFrete>;
  consultarEntregaPropriaAtual: (entrada: {
    produto: ProdutoRevalidacaoFreteCheckout;
    cep: string;
  }) => Promise<ConsultaEntregaPropriaRevalidacaoCheckout>;
  buscarDisponibilidadeFreteProduto?: (entrada: {
    produtoId: string;
    categoriaId?: string | null;
  }) => Promise<DisponibilidadeFreteProduto>;
};

export type ResultadoRevalidacaoFreteCheckout =
  | {
      sucesso: true;
      freteEmCentavos: number;
      fallbackAcionado: boolean;
      snapshotFrete: SnapshotFreteCheckout;
    }
  | {
      sucesso: false;
      codigo:
        | "cep-checkout-invalido"
        | "cep-frete-divergente"
        | "modalidade-frete-invalida"
        | "produto-frete-invalido"
        | "frete-indisponivel"
        | "valor-frete-divergente";
      mensagem: string;
      exigeNovaConfirmacao: boolean;
    };

export type SnapshotFreteCheckout = {
  versao: "1";
  cep: string;
  valorTotalEmCentavos: number;
  fallbackAcionado: boolean;
  itens: SnapshotItemFreteCheckout[];
};

export type SnapshotItemFreteCheckout = {
  itemCarrinhoId: string;
  produtoId: string;
  varianteId: string | null;
  provedor: string;
  servico: string;
  modalidade: string;
  valorEmCentavos: number;
  prazo: string | null;
  itensLogisticos: ItemLogistico[];
  pacotes: PacoteEnvio[];
  metadataResumida: Record<string, unknown> | null;
  fallbackAcionado: boolean;
};

type ModalidadeItemCheckout = {
  id: ModalidadeFreteCarrinho;
  valorInformadoEmCentavos: number;
  cepInformado?: string;
  servico?: string;
};

function limparCep(cep: string) {
  return cep.replace(/\D/g, "");
}

function criarFalha(
  codigo: Extract<
    ResultadoRevalidacaoFreteCheckout,
    { sucesso: false }
  >["codigo"],
  mensagem: string,
): ResultadoRevalidacaoFreteCheckout {
  return {
    sucesso: false,
    codigo,
    mensagem,
    exigeNovaConfirmacao: true,
  };
}

function obterRetiradasAtuais(
  produto: ProdutoRevalidacaoFreteCheckout,
): RetiradaAtualDisponivel[] {
  if (!produto.allowsPickup || !produto.modeloRetirada?.ativo) {
    return [];
  }

  return [
    {
      identificador: produto.modeloRetirada.id,
      nome: produto.modeloRetirada.nome,
      descricao:
        produto.prazoRetiradaCustom ||
        produto.modeloRetirada.prazoTexto ||
        produto.modeloRetirada.mensagem,
    },
  ];
}

function montarProdutoAtual(produto: ProdutoRevalidacaoFreteCheckout) {
  return {
    identificadorProduto: produto.id,
    nomeProduto: produto.name,
    codigoSkuProduto: produto.sku,
    tipoProdutoAtual:
      produto.productKind === "variable"
        ? ("variable" as const)
        : ("simple" as const),
    pesoProdutoEmGramas: produto.weight,
    alturaProdutoEmCm: produto.height,
    larguraProdutoEmCm: produto.width,
    comprimentoProdutoEmCm: produto.length,
  };
}

function montarVarianteAtual(
  item: ItemCarrinho,
  produto: ProdutoRevalidacaoFreteCheckout,
) {
  if (produto.productKind !== "variable") {
    return null;
  }

  const variante = produto.variants?.find(
    (varianteAtual) => varianteAtual.id === item.produtoVarianteId,
  );

  if (!variante) {
    return null;
  }

  return {
    identificadorVariante: variante.id,
    nomeVariante: variante.name,
    codigoSkuVariante: variante.sku,
    pesoVarianteEmGramas: variante.weightInGrams,
    alturaVarianteEmCm: variante.heightInCm,
    larguraVarianteEmCm: variante.widthInCm,
    comprimentoVarianteEmCm: variante.lengthInCm,
  };
}

function resolverModalidadeItem(
  item: ItemCarrinho,
): ModalidadeItemCheckout | null {
  if (!item.freteEscolhido) {
    return null;
  }

  return {
    id: item.freteEscolhido.id,
    valorInformadoEmCentavos: item.freteEscolhido.valorEmCentavos,
    cepInformado: item.freteEscolhido.cep,
    servico: item.freteEscolhido.servico,
  };
}

function validarValorInformado(
  modalidade: ModalidadeItemCheckout,
  valorRevalidadoEmCentavos: number,
) {
  return modalidade.valorInformadoEmCentavos === valorRevalidadoEmCentavos;
}

function obterOpcaoCotada(
  resultado: ResultadoCotacaoFrete,
  modalidade: ModalidadeItemCheckout,
) {
  if (modalidade.id === "retirada") {
    return resultado.opcoes.find((opcao) => opcao.tipo === "retirada");
  }

  if (modalidade.id === "entrega-propria") {
    return resultado.opcoes.find(
      (opcao) =>
        opcao.tipo === "entrega" && opcao.provedor === "entrega-propria",
    );
  }

  if (modalidade.id === "frenet" && modalidade.servico) {
    return resultado.opcoes.find(
      (opcao) =>
        opcao.tipo === "entrega" &&
        opcao.provedor === "frenet" &&
        opcao.servico === modalidade.servico,
    );
  }

  return null;
}

function resumirMetadataFrete(metadados?: Record<string, unknown> | null) {
  if (!metadados) {
    return null;
  }

  const registros = Object.entries(metadados)
    .filter(([, valor]) => {
      return (
        typeof valor === "string" ||
        typeof valor === "number" ||
        typeof valor === "boolean" ||
        valor === null
      );
    })
    .slice(0, 12);

  return registros.length > 0 ? Object.fromEntries(registros) : null;
}

function montarSnapshotItemFrete({
  item,
  produto,
  opcao,
  itensLogisticos,
  pacotes,
  fallbackAcionado,
}: {
  item: ItemCarrinho;
  produto: ProdutoRevalidacaoFreteCheckout;
  opcao: OpcaoFrete;
  itensLogisticos: ItemLogistico[];
  pacotes: PacoteEnvio[];
  fallbackAcionado: boolean;
}): SnapshotItemFreteCheckout {
  return {
    itemCarrinhoId: item.id,
    produtoId: produto.id,
    varianteId: item.produtoVarianteId ?? null,
    provedor: opcao.provedor,
    servico: opcao.servico,
    modalidade: opcao.tipo,
    valorEmCentavos: opcao.valorEmCentavos,
    prazo:
      opcao.descricao ||
      (opcao.prazoMinimoEmDiasUteis || opcao.prazoMaximoEmDiasUteis
        ? `${opcao.prazoMinimoEmDiasUteis ?? opcao.prazoMaximoEmDiasUteis} a ${opcao.prazoMaximoEmDiasUteis ?? opcao.prazoMinimoEmDiasUteis} dias uteis`
        : null),
    itensLogisticos,
    pacotes,
    metadataResumida: resumirMetadataFrete(opcao.metadados),
    fallbackAcionado,
  };
}

async function cotarItemComNovaLogistica({
  item,
  produto,
  cep,
  dependencias,
}: {
  item: ItemCarrinho;
  produto: ProdutoRevalidacaoFreteCheckout;
  cep: string;
  dependencias: DependenciasRevalidacaoFreteCheckout;
}) {
  const entrada: EntradaCotacaoFreteFluxoAtual = {
    produtoAtual: montarProdutoAtual(produto),
    varianteAtual: montarVarianteAtual(item, produto),
    quantidade: item.quantidade,
    cep,
    valorDeclaradoEmCentavos: item.precoEmCentavos,
    retiradasAtuais: obterRetiradasAtuais(produto),
  };

  if (produto.allowsOwnDelivery) {
    entrada.consultarEntregaPropriaAtual = () =>
      dependencias.consultarEntregaPropriaAtual({ produto, cep });
  }

  return (dependencias.cotarFreteLogistica ?? cotarFreteFluxoAtual)(entrada);
}

async function revalidarModalidadePelaLogistica({
  modalidade,
  item,
  produto,
  cep,
  dependencias,
}: {
  modalidade: ModalidadeItemCheckout;
  item: ItemCarrinho;
  produto: ProdutoRevalidacaoFreteCheckout;
  cep: string;
  dependencias: DependenciasRevalidacaoFreteCheckout;
}) {
  const cotacao = await cotarItemComNovaLogistica({
    item,
    produto,
    cep,
    dependencias,
  });
  const disponibilidade = dependencias.buscarDisponibilidadeFreteProduto
    ? await dependencias.buscarDisponibilidadeFreteProduto({
        produtoId: produto.id,
        categoriaId: produto.categoryId,
      })
    : null;
  const cotacaoDisponivel = disponibilidade
    ? filtrarResultadoCotacaoFreteDisponivel(cotacao, disponibilidade)
    : cotacao;
  const opcao = obterOpcaoCotada(cotacaoDisponivel, modalidade);

  if (opcao) {
    return {
      disponivel: true as const,
      valorEmCentavos: opcao.valorEmCentavos,
      fallbackAcionado: false,
      snapshot: montarSnapshotItemFrete({
        item,
        produto,
        opcao,
        itensLogisticos: cotacaoDisponivel.solicitacao.itens,
        pacotes: cotacaoDisponivel.solicitacao.pacotes,
        fallbackAcionado: false,
      }),
    };
  }

  return {
    disponivel: false as const,
    fallbackAcionado: false,
  };
}

export async function revalidarFreteCheckout({
  itens,
  produtos,
  cepFinal,
  dependencias,
}: {
  itens: ItemCarrinho[];
  produtos: ProdutoRevalidacaoFreteCheckout[];
  cepFinal: string;
  dependencias: DependenciasRevalidacaoFreteCheckout;
}): Promise<ResultadoRevalidacaoFreteCheckout> {
  const cep = limparCep(cepFinal);

  if (cep.length !== 8) {
    return criarFalha("cep-checkout-invalido", "Confirme o CEP de entrega.");
  }

  let freteEmCentavos = 0;
  let fallbackAcionado = false;
  const snapshotsItens: SnapshotItemFreteCheckout[] = [];

  for (const item of itens) {
    const produto = produtos.find(
      (produtoAtual) => produtoAtual.id === item.produtoId,
    );
    const modalidade = resolverModalidadeItem(item);

    if (
      !produto ||
      !modalidade ||
      !Number.isInteger(item.quantidade) ||
      item.quantidade < 1
    ) {
      return criarFalha(
        "produto-frete-invalido",
        "Revise os produtos do carrinho antes de continuar.",
      );
    }

    if (modalidade.cepInformado && limparCep(modalidade.cepInformado) !== cep) {
      return criarFalha(
        "cep-frete-divergente",
        "O CEP do frete mudou. Confirme a entrega novamente.",
      );
    }

    if (
      modalidade.id !== "retirada" &&
      modalidade.id !== "entrega-propria" &&
      modalidade.id !== "frenet"
    ) {
      return criarFalha(
        "modalidade-frete-invalida",
        "Selecione uma forma de entrega válida.",
      );
    }

    let freteRevalidado: Awaited<
      ReturnType<typeof revalidarModalidadePelaLogistica>
    >;

    try {
      freteRevalidado = await revalidarModalidadePelaLogistica({
        modalidade,
        item,
        produto,
        cep,
        dependencias,
      });
    } catch {
      return criarFalha(
        "frete-indisponivel",
        "A forma de entrega escolhida não está mais disponível.",
      );
    }

    if (!freteRevalidado.disponivel) {
      return criarFalha(
        "frete-indisponivel",
        "A forma de entrega escolhida não está mais disponível.",
      );
    }

    if (!validarValorInformado(modalidade, freteRevalidado.valorEmCentavos)) {
      return criarFalha(
        "valor-frete-divergente",
        "O valor do frete mudou. Confirme a entrega novamente.",
      );
    }

    freteEmCentavos += freteRevalidado.valorEmCentavos;
    fallbackAcionado ||= freteRevalidado.fallbackAcionado;
    snapshotsItens.push(freteRevalidado.snapshot);
  }

  return {
    sucesso: true,
    freteEmCentavos,
    fallbackAcionado,
    snapshotFrete: {
      versao: "1",
      cep,
      valorTotalEmCentavos: freteEmCentavos,
      fallbackAcionado,
      itens: snapshotsItens,
    },
  };
}
