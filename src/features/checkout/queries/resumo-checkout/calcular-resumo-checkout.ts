import "server-only";

import { inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";
import type { ItemCarrinho } from "@/features/carrinho";
import { listarProvedoresExpedicaoProdutos } from "@/features/fornecedores/queries/listar-provedores-expedicao-produtos";
import { consultarEntregaPropriaLoja } from "@/features/logistica";
import { cotarFretePorGruposLogisticos } from "@/features/logistica/lib/cotacoes/cotar-frete-por-grupos-logisticos";
import { filtrarResultadoCotacaoFreteDisponivel } from "@/features/logistica/lib/disponibilidade/filtrar-resultado-cotacao-disponivel";
import { agruparItensPorOrigemExpedicao } from "@/features/logistica/lib/grupos-logisticos/agrupar-itens-por-origem-expedicao";
import { resolverOrigemExpedicaoProduto } from "@/features/logistica/lib/grupos-logisticos/resolver-origem-expedicao-produto";
import { obterCepOrigemLaquila } from "@/features/logistica/lib/origens/obter-cep-origem-laquila";
import { obterConfiguracaoFrenet } from "@/features/logistica/lib/provedores/frenet/obter-configuracao-frenet";
import { resolverItemLogistico } from "@/features/logistica/lib/resolver-item-logistico";
import { buscarDisponibilidadeFreteProduto } from "@/features/logistica/queries/disponibilidade/buscar-disponibilidade-frete-produto";
import type { ItemLogistico } from "@/features/logistica/types/contratos-frete";
import { avaliarPagamentoNaEntregaComBanco } from "@/features/pagamento-na-entrega/queries/avaliar-pagamento-na-entrega-checkout";
import {
  buscarConfiguracaoPagamentoAtiva,
  calcularParcelamentosCartao,
  calcularPrecoProduto,
  formatarPrecoEmReais,
  normalizarModalidadePrecoCanonica,
} from "@/features/precificacao/server";

import { calcularTotalCheckout } from "../../lib/calcular-total-checkout";
import {
  obterTransportadoraOpcaoEntrega,
  resumirMetadadosOpcaoEntrega,
} from "../../lib/frete/normalizar-dados-opcao-entrega";
import { resolverItemVendavelCheckout } from "../../lib/pedidos/normalizar-checkout-visitante";
import {
  calcularFreteItensCheckout,
  resolverFreteItemCheckout,
} from "../../lib/resumo-checkout/calcular-frete-itens-checkout";
import type { ResumoCheckoutCalculado } from "../../types/checkout.types";
import type { SelecaoEntregaGrupoCheckout } from "../../types/checkout.types";

export type CalcularResumoCheckoutParams = {
  itens: ItemCarrinho[];
  cupom?: string;
  /**
   * CEP digitado no checkout. Só chega aqui quando está completo — ver o efeito em
   * `checkout-visitante.tsx`, que evita recalcular a cada tecla.
   */
  cepEntrega?: string | null;
  selecoesEntregaPorGrupo?: Array<
    Pick<SelecaoEntregaGrupoCheckout, "chaveGrupo" | "identificador" | "cep">
  >;
  /** Dados internos usados apenas ao congelar o snapshot dentro da criação do pedido. */
  incluirDadosAuditoriaFrete?: boolean;
};

function criarPacote(item: ItemLogistico) {
  return {
    identificador: `checkout:${item.identificador}`,
    itens: [item],
    quantidadeVolumes: item.quantidade,
    pesoTotalEmGramas: item.pesoEmGramas * item.quantidade,
    dimensoes: item.dimensoes,
  };
}

const configuracaoVisualModalidade: Record<
  string,
  { icone: string; badge: string; badgeBg: string; badgeColor: string }
> = {
  stock: {
    icone: "🏭",
    badge: "Estoque Próprio",
    badgeBg: "#E8F5E9",
    badgeColor: "#2E7D32",
  },
  pre_sale: {
    icone: "⏳",
    badge: "Pré-venda",
    badgeBg: "#FFF3E0",
    badgeColor: "#ED6C02",
  },
  dropshipping: {
    icone: "📦",
    badge: "Dropshipping",
    badgeBg: "#E3F2FD",
    badgeColor: "#0288D1",
  },
  order_basis: {
    icone: "📋",
    badge: "Sob Encomenda",
    badgeBg: "#F3E5F5",
    badgeColor: "#7B1FA2",
  },
};

function obterTituloModalidade({
  tipo,
  descricao,
  prazo,
}: {
  tipo: string;
  descricao: string | null;
  prazo: string | null;
}) {
  const descricaoNormalizada = descricao?.trim();
  const prazoNormalizado = prazo?.trim();

  if (descricaoNormalizada && descricaoNormalizada !== prazoNormalizado) {
    return descricaoNormalizada;
  }

  return configuracaoVisualModalidade[tipo]?.badge || tipo;
}

export async function calcularResumoCheckout({
  itens,
  cupom,
  cepEntrega = null,
  selecoesEntregaPorGrupo = [],
  incluirDadosAuditoriaFrete = false,
}: CalcularResumoCheckoutParams): Promise<ResumoCheckoutCalculado | null> {
  if (itens.length === 0) {
    return null;
  }

  const produtosIds = [...new Set(itens.map((item) => item.produtoId))];
  const [configuracaoPagamento, produtos, provedoresExpedicaoPorProdutoId] =
    await Promise.all([
      buscarConfiguracaoPagamentoAtiva(),
      db.query.productTable.findMany({
        where: inArray(productTable.id, produtosIds),
        with: {
          pricing: true,
          galleryImages: true,
          variants: true,
          modeloRetirada: true,
        },
      }),
      listarProvedoresExpedicaoProdutos(produtosIds),
    ]);

  const itensCalculados = itens.map((item) => {
    const produto = produtos.find(
      (produtoAtual) => produtoAtual.id === item.produtoId,
    );

    if (!produto) {
      throw new Error(`Produto não encontrado: ${item.nome}`);
    }

    const itemVendavel = resolverItemVendavelCheckout({ item, produto });
    const precoSelecionado =
      itemVendavel.tipo === "simple" ? itemVendavel.precoSelecionado : null;
    const precoBaseEmCentavos =
      itemVendavel.tipo === "variant"
        ? itemVendavel.variante.priceInCents
        : precoSelecionado!.hasPromo && precoSelecionado!.promoPrice
          ? precoSelecionado!.promoPrice
          : precoSelecionado!.price;
    const modalidadePreco =
      itemVendavel.tipo === "variant"
        ? `variant:${itemVendavel.variante.id}`
        : precoSelecionado!.type;
    const tipoModalidadeCanonica = normalizarModalidadePrecoCanonica(
      itemVendavel.tipo === "variant"
        ? itemVendavel.precoSelecionado?.type
        : precoSelecionado!.type,
    );
    const precos = calcularPrecoProduto({
      entrada: {
        produtoId: produto.id,
        modalidade: modalidadePreco,
        precoBaseEmCentavos,
      },
      configuracao: configuracaoPagamento,
    });
    const frete = resolverFreteItemCheckout(item);
    const visualModalidade =
      configuracaoVisualModalidade[tipoModalidadeCanonica || "stock"] ??
      configuracaoVisualModalidade.stock;
    const tituloItem =
      itemVendavel.tipo === "variant"
        ? itemVendavel.variante.name ||
          Object.values(itemVendavel.variante.attributes).join(" / ") ||
          "Variante"
        : item.modalidadeTitulo ||
          obterTituloModalidade({
            tipo: tipoModalidadeCanonica || precoSelecionado!.type,
            descricao: precoSelecionado!.pricingModalDescription,
            prazo: precoSelecionado!.deliveryDays,
          });
    const prazoModalidade =
      itemVendavel.tipo === "variant"
        ? item.prazoModalidade || "Consulte prazo"
        : precoSelecionado!.deliveryDays || "Consulte prazo";

    return {
      id: item.id,
      produtoId: produto.id,
      categoriaId: produto.categoryId,
      produtoVarianteId:
        itemVendavel.tipo === "variant"
          ? itemVendavel.variante.id
          : itemVendavel.varianteTecnica.id,
      nome: produto.name,
      sku:
        itemVendavel.tipo === "variant"
          ? itemVendavel.variante.sku
          : produto.sku,
      atributosVariante:
        itemVendavel.tipo === "variant"
          ? itemVendavel.variante.attributes
          : undefined,
      imagemUrl: itemVendavel.imagemUrl || "/produto-sem-foto.webp",
      quantidade: item.quantidade,
      varianteId:
        itemVendavel.tipo === "variant"
          ? itemVendavel.variante.id
          : itemVendavel.varianteTecnica.id,
      ...resolverOrigemExpedicaoProduto({
        fornecedorProvedorAtivo:
          provedoresExpedicaoPorProdutoId.get(produto.id) ?? null,
      }),
      modalidade: tituloItem,
      prazoModalidade,
      modalidadeDetalhes: {
        tipo: modalidadePreco,
        titulo: tituloItem,
        badge:
          itemVendavel.tipo === "variant"
            ? "Variante selecionada"
            : visualModalidade.badge,
        badgeBg: visualModalidade.badgeBg,
        badgeColor: visualModalidade.badgeColor,
        icone: visualModalidade.icone,
        precoBaseEmCentavos:
          itemVendavel.tipo === "variant"
            ? itemVendavel.variante.priceInCents
            : precoSelecionado!.price,
        precoBase: formatarPrecoEmReais(
          itemVendavel.tipo === "variant"
            ? itemVendavel.variante.priceInCents
            : precoSelecionado!.price,
        ),
        possuiPromocao:
          itemVendavel.tipo === "simple" && Boolean(precoSelecionado!.hasPromo),
        precoPromocionalEmCentavos:
          itemVendavel.tipo === "simple" ? precoSelecionado!.promoPrice : null,
        precoPromocional:
          itemVendavel.tipo === "simple" && precoSelecionado!.promoPrice
            ? formatarPrecoEmReais(precoSelecionado!.promoPrice)
            : null,
        tipoPromocao:
          itemVendavel.tipo === "simple" ? precoSelecionado!.promoType : null,
        promocaoTerminaEm:
          itemVendavel.tipo === "simple"
            ? precoSelecionado!.promoEndDate
            : null,
        duracaoPromocao:
          itemVendavel.tipo === "simple"
            ? precoSelecionado!.promoDuration
            : null,
        unidadeDuracaoPromocao:
          itemVendavel.tipo === "simple"
            ? precoSelecionado!.promoDurationUnit
            : null,
        precoPrincipal:
          itemVendavel.tipo === "simple" &&
          Boolean(precoSelecionado!.mainCardPrice),
        ativo:
          itemVendavel.tipo === "variant"
            ? itemVendavel.variante.isActive
            : Boolean(precoSelecionado!.isActive),
        garantia: "12 meses",
        origemEnvio: "Brasil",
      },
      frete,
      pix: precos.pix,
      cartao: precos.cartao,
    };
  });

  const gruposLogisticos = agruparItensPorOrigemExpedicao(itensCalculados);
  const cepLimpo = cepEntrega?.replace(/\D/g, "") ?? "";
  const itensLogisticos = itens.flatMap((item) => {
    const produto = produtos.find((atual) => atual.id === item.produtoId);
    if (!produto) return [];
    const variante = produto.variants.find(
      (atual) => atual.id === item.produtoVarianteId,
    );
    const contexto = resolverOrigemExpedicaoProduto({
      fornecedorProvedorAtivo:
        provedoresExpedicaoPorProdutoId.get(produto.id) ?? null,
    });
    const resultado = resolverItemLogistico({
      produto: {
        identificador: produto.id,
        nome: produto.name,
        codigoSku: produto.sku,
        tipo: produto.productKind === "variable" ? "com-variantes" : "simples",
        pesoEmGramas: produto.weight,
        alturaEmCm: produto.height,
        larguraEmCm: produto.width,
        comprimentoEmCm: produto.length,
      },
      variante: variante
        ? {
            identificador: variante.id,
            nome: variante.name,
            codigoSku: variante.sku,
            pesoEmGramas: variante.weightInGrams,
            alturaEmCm: variante.heightInCm,
            larguraEmCm: variante.widthInCm,
            comprimentoEmCm: variante.lengthInCm,
          }
        : null,
      quantidade: item.quantidade,
      identificadorItem: item.id,
      valorDeclaradoEmCentavos: item.precoEmCentavos,
      contextoOrigemExpedicao: contexto,
    });
    return resultado.sucesso ? [resultado.item] : [];
  });
  const gruposCotacao = agruparItensPorOrigemExpedicao(itensLogisticos);
  const disponibilidadesPorProdutoId = new Map(
    cepLimpo.length === 8 && gruposCotacao.length > 0
      ? await Promise.all(
          itensLogisticos.map(
            async (item) =>
              [
                item.produtoId,
                await buscarDisponibilidadeFreteProduto({
                  produtoId: item.produtoId,
                  varianteId: item.varianteId,
                  categoriaId:
                    produtos.find((produto) => produto.id === item.produtoId)
                      ?.categoryId ?? null,
                }),
              ] as const,
          ),
        )
      : [],
  );
  const cotacoesEntrega =
    cepLimpo.length !== 8 || gruposCotacao.length === 0
      ? gruposLogisticos.map((grupo) => ({
          chaveGrupo: grupo.chave,
          cepOrigem: "",
          opcoes: [],
          mensagemErro:
            cepLimpo.length === 8
              ? "Não foi possível cotar esta entrega."
              : "Informe o CEP para ver as formas de entrega.",
        }))
      : (
          await cotarFretePorGruposLogisticos(
            {
              identificador: `checkout:${cepLimpo}:${itens
                .map((item) => `${item.id}:${item.quantidade}`)
                .join("|")}`,
              destino: { cep: cepLimpo, pais: "BR" },
              itens: itensLogisticos,
              pacotes: itensLogisticos.map(criarPacote),
              gruposLogisticos: gruposCotacao,
              moeda: "BRL",
            },
            {
              entregaPropriaAtual: {
                async consultarEntregaPropriaAtual({ produtoId, cep }) {
                  const entrega = await consultarEntregaPropriaLoja({
                    produtoId,
                    cep,
                  });
                  return entrega.disponivel
                    ? {
                        disponivel: true as const,
                        valorEmCentavos: entrega.valorEmCentavos,
                        descricao: entrega.prazoEntrega ?? entrega.descricao,
                        opcoesAdicionais: entrega.entregaProgramada
                          ? [
                              {
                                servico: "entrega-programada",
                                nome: "Entrega programada",
                                valorEmCentavos:
                                  entrega.entregaProgramada.valorEmCentavos,
                                descricao:
                                  entrega.entregaProgramada.promessa.texto,
                              },
                            ]
                          : [],
                      }
                    : { disponivel: false as const, motivo: entrega.mensagem };
                },
              },
              retiradaAtual: {
                async listarRetiradasAtuais(solicitacao) {
                  const modelos = solicitacao.itens.map((item) => {
                    const produto = produtos.find(
                      (atual) => atual.id === item.produtoId,
                    );
                    return produto?.allowsPickup &&
                      produto.modeloRetirada?.ativo
                      ? produto.modeloRetirada
                      : null;
                  });
                  if (modelos.some((modelo) => !modelo)) return [];
                  const primeiro = modelos[0];
                  if (
                    !primeiro ||
                    modelos.some((modelo) => modelo?.id !== primeiro.id)
                  ) {
                    return [];
                  }
                  return [
                    {
                      identificador: primeiro.id,
                      nome: primeiro.nome,
                      descricao: primeiro.prazoTexto || primeiro.mensagem,
                    },
                  ];
                },
              },
            },
            {
              frenet: obterConfiguracaoFrenet(),
              cepOrigemFornecedorPorProvedor: {
                laquila: obterCepOrigemLaquila(),
              },
            },
          )
        ).cotacoes.map((cotacao) => {
          const resultadoDisponivel = cotacao.itens.reduce(
            (resultado, item) => {
              const disponibilidade = disponibilidadesPorProdutoId.get(
                item.produtoId,
              );
              return disponibilidade
                ? filtrarResultadoCotacaoFreteDisponivel(
                    resultado,
                    disponibilidade,
                  )
                : resultado;
            },
            cotacao.resultado,
          );

          return {
            chaveGrupo: cotacao.chaveGrupo,
            cepOrigem: cotacao.cepOrigem,
            opcoes: resultadoDisponivel.opcoes.map((opcao) => ({
              identificador: opcao.identificador,
              nome: opcao.nome,
              descricao: opcao.descricao ?? null,
              prazoMinimoEmDiasUteis: opcao.prazoMinimoEmDiasUteis ?? null,
              prazoMaximoEmDiasUteis: opcao.prazoMaximoEmDiasUteis ?? null,
              valorEmCentavos: opcao.valorEmCentavos,
              tipo: opcao.tipo,
              provedor: opcao.provedor,
              servico: opcao.servico,
              transportadora: incluirDadosAuditoriaFrete
                ? obterTransportadoraOpcaoEntrega(opcao)
                : null,
              metadadosRelevantes: incluirDadosAuditoriaFrete
                ? resumirMetadadosOpcaoEntrega(opcao.metadados)
                : null,
            })),
            mensagemErro:
              resultadoDisponivel.opcoes.length > 0
                ? null
                : "Nenhuma forma de entrega está disponível para esta entrega.",
          };
        });

  const opcoesValidas = new Map(
    cotacoesEntrega.flatMap((cotacao) =>
      cotacao.opcoes.map(
        (opcao) =>
          [`${cotacao.chaveGrupo}:${opcao.identificador}`, opcao] as const,
      ),
    ),
  );
  const freteSelecionadoEmCentavos = selecoesEntregaPorGrupo.reduce(
    (total, selecao) =>
      total +
      (opcoesValidas.get(`${selecao.chaveGrupo}:${selecao.identificador}`)
        ?.valorEmCentavos ?? 0),
    0,
  );
  const freteEmCentavos =
    selecoesEntregaPorGrupo.length > 0
      ? freteSelecionadoEmCentavos
      : calcularFreteItensCheckout({ itens });
  const itensPix = itensCalculados.map((item) => ({
    precoEmCentavos: item.pix.valorEmCentavos,
    quantidade: item.quantidade,
  }));
  const itensCartao = itensCalculados.map((item) => ({
    precoEmCentavos: item.cartao.valorEmCentavos,
    quantidade: item.quantidade,
  }));
  const totaisPix = calcularTotalCheckout({
    itens: itensPix,
    freteEmCentavos,
    cupom,
  });
  const totaisCartao = calcularTotalCheckout({
    itens: itensCartao,
    freteEmCentavos,
    cupom,
  });
  const parcelamentosCartao = calcularParcelamentosCartao({
    valorEmCentavos: totaisCartao.totalEmCentavos,
    configuracao: configuracaoPagamento,
  });

  // Avaliação de pagamento na entrega. Roda DEPOIS dos totais porque a faixa de valor e o
  // teto de dinheiro dependem do total já calculado.
  //
  // A base é o total do PIX: pagar na entrega não tem acréscimo de gateway, então cobrar o
  // valor do cartão seria cobrar juros de uma maquininha que a loja não usa.
  //
  // O frete vem do carrinho, que é editável pelo usuário — por isso este resultado é só
  // exibição e carrega `exigeRevalidacao`. A decisão vinculante é refeita na criação do
  // pedido, a partir do snapshot produzido pelo servidor.
  const avaliacaoNaEntrega = await avaliarPagamentoNaEntregaComBanco({
    // "carrinho" e não "checkout", ainda que isto rode na página de checkout: o contexto
    // descreve a QUALIDADE DA FONTE, não a tela. O frete aqui vem do carrinho, que mora no
    // localStorage e o usuário consegue editar. Declarar "checkout" faria o motor tratar a
    // decisão como final e devolver `exigeRevalidacao: false` — exatamente a garantia que
    // não temos. Quem passa "checkout" é a criação do pedido, com o snapshot do servidor.
    contexto: "carrinho",
    itens: itens.map((item) => ({
      itemCarrinhoId: item.id,
      produtoId: item.produtoId,
      varianteId: item.produtoVarianteId ?? null,
      modalidadeInformada: item.modalidadeTipo ?? null,
      frete:
        item.freteEscolhido === undefined
          ? null
          : {
              provedor: item.freteEscolhido.id,
              servico: item.freteEscolhido.servico ?? "",
              cepCotado: item.freteEscolhido.cep ?? null,
            },
    })),
    totalPedidoEmCentavos: totaisPix.totalEmCentavos,
    cepEntrega,
  });

  return {
    itens: itensCalculados,
    gruposLogisticos,
    cotacoesEntrega,
    pagamentos: {
      pix: {
        ativo: configuracaoPagamento.pixAtivo,
        totalEmCentavos: totaisPix.totalEmCentavos,
        total: formatarPrecoEmReais(totaisPix.totalEmCentavos),
        economiaEmCentavos: Math.max(
          totaisCartao.totalEmCentavos - totaisPix.totalEmCentavos,
          0,
        ),
      },
      cartao: {
        ativo: configuracaoPagamento.cartaoAtivo,
        totalEmCentavos: totaisCartao.totalEmCentavos,
        total: formatarPrecoEmReais(totaisCartao.totalEmCentavos),
        parcelamentos: parcelamentosCartao,
      },
      naEntrega: {
        ativo: avaliacaoNaEntrega.elegivel,
        totalEmCentavos: totaisPix.totalEmCentavos,
        total: formatarPrecoEmReais(totaisPix.totalEmCentavos),
        formasPermitidas: avaliacaoNaEntrega.formasPermitidas,
        motivos: avaliacaoNaEntrega.motivos,
        observacoesCliente:
          avaliacaoNaEntrega.regrasAplicadas?.observacoesCliente ?? null,
        exigeTroco: avaliacaoNaEntrega.limites.exigeTroco,
        exigeRevalidacao: avaliacaoNaEntrega.exigeRevalidacao,
      },
    },
    totaisPorFormaPagamento: {
      pix: totaisPix,
      cartao: totaisCartao,
      // Mesma base do PIX, pelo mesmo motivo: sem acréscimo de gateway.
      naEntrega: totaisPix,
    },
  };
}
