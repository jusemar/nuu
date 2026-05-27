import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type { ItemCarrinho } from "@/features/carrinho";
import type {
  DisponibilidadeFreteProduto,
  EntradaCotacaoFreteFluxoAtual,
  ResultadoCotacaoFrete,
} from "@/features/logistica";

import {
  revalidarFreteCheckout,
  type DependenciasRevalidacaoFreteCheckout,
  type ProdutoRevalidacaoFreteCheckout,
} from "./revalidar-frete-checkout";

const produtoSimples: ProdutoRevalidacaoFreteCheckout = {
  id: "produto-simples",
  name: "Produto simples",
  sku: "SKU-SIMPLES",
  productKind: "simple",
  weight: 500,
  height: 5,
  width: 10,
  length: 15,
  allowsOwnDelivery: true,
};

const produtoComVariante: ProdutoRevalidacaoFreteCheckout = {
  id: "produto-variante",
  name: "Produto com variante",
  sku: "SKU-PAI",
  productKind: "variable",
  allowsOwnDelivery: true,
  variants: [
    {
      id: "variante-1",
      sku: "SKU-VARIANTE",
      name: "Variante",
      weightInGrams: 700,
      heightInCm: 7,
      widthInCm: 12,
      lengthInCm: 20,
    },
  ],
};

const produtoComRetirada: ProdutoRevalidacaoFreteCheckout = {
  ...produtoSimples,
  allowsPickup: true,
  modeloRetirada: {
    id: "retirada-1",
    nome: "Retirada local",
    prazoTexto: "Apos pagamento",
    mensagem: null,
    ativo: true,
  },
};

function criarItem({
  produtoId = produtoSimples.id,
  varianteId,
  modalidade = "entrega-propria",
  valorEmCentavos = 1800,
  cep = "30140071",
  servico,
}: {
  produtoId?: string;
  varianteId?: string;
  modalidade?: "retirada" | "entrega-propria" | "frenet";
  valorEmCentavos?: number;
  cep?: string;
  servico?: string;
} = {}): ItemCarrinho {
  return {
    id: `item:${produtoId}`,
    produtoId,
    produtoVarianteId: varianteId,
    nome: "Produto",
    imagemUrl: "/produto.webp",
    precoEmCentavos: 10000,
    quantidade: 1,
    freteEscolhido: {
      id: modalidade,
      nome: "Frete escolhido",
      prazo: "Hoje",
      valorEmCentavos,
      cep,
      servico,
    },
  };
}

function criarResultadoCotacao(
  entrada: EntradaCotacaoFreteFluxoAtual,
  opcoes: ResultadoCotacaoFrete["opcoes"],
): ResultadoCotacaoFrete {
  const pesoEmGramas =
    entrada.varianteAtual?.pesoVarianteEmGramas ??
    entrada.produtoAtual.pesoProdutoEmGramas ??
    0;
  const dimensoes = {
    alturaEmCm:
      entrada.varianteAtual?.alturaVarianteEmCm ??
      entrada.produtoAtual.alturaProdutoEmCm ??
      0,
    larguraEmCm:
      entrada.varianteAtual?.larguraVarianteEmCm ??
      entrada.produtoAtual.larguraProdutoEmCm ??
      0,
    comprimentoEmCm:
      entrada.varianteAtual?.comprimentoVarianteEmCm ??
      entrada.produtoAtual.comprimentoProdutoEmCm ??
      0,
  };
  const itemLogistico = {
    identificador: "item-logistico-1",
    produtoId: entrada.produtoAtual.identificadorProduto,
    varianteId: entrada.varianteAtual?.identificadorVariante ?? null,
    nome:
      entrada.varianteAtual?.nomeVariante ?? entrada.produtoAtual.nomeProduto,
    quantidade: entrada.quantidade,
    pesoEmGramas,
    dimensoes,
  };

  return {
    sucesso: true,
    solicitacao: {
      identificador: `cotacao:${entrada.produtoAtual.identificadorProduto}`,
      destino: {
        cep: entrada.cep,
        pais: "BR",
      },
      itens: [itemLogistico],
      pacotes: [
        {
          identificador: "pacote-1",
          itens: [itemLogistico],
          quantidadeVolumes: entrada.quantidade,
          pesoTotalEmGramas: pesoEmGramas * entrada.quantidade,
          dimensoes,
        },
      ],
      moeda: "BRL",
    },
    opcoes,
    avisos: [],
  };
}

function criarDependencias(
  cotarFreteLogistica: DependenciasRevalidacaoFreteCheckout["cotarFreteLogistica"],
  buscarDisponibilidadeFreteProduto: DependenciasRevalidacaoFreteCheckout["buscarDisponibilidadeFreteProduto"] = async ({
    produtoId,
    categoriaId,
  }) => criarDisponibilidadeVazia(produtoId, categoriaId),
): DependenciasRevalidacaoFreteCheckout {
  return {
    cotarFreteLogistica,
    buscarDisponibilidadeFreteProduto,
    async consultarEntregaPropriaAtual() {
      return {
        disponivel: true,
        valorEmCentavos: 1800,
        descricao: "Entrega atual",
      };
    },
  };
}

function criarDisponibilidadeVazia(
  produtoId: string,
  categoriaId?: string | null,
): DisponibilidadeFreteProduto {
  return {
    contextoProduto: {
      produtoId,
      categoriaId: categoriaId ?? null,
      tiposLogisticosIdentificadores: [],
    },
    configuracao: {
      provedores: [
        { identificador: "entrega-propria", ativo: true },
        { identificador: "retirada", ativo: true },
        { identificador: "frenet", ativo: true },
      ],
      transportadoras: [],
      servicos: [],
      regrasCategorias: [],
      regrasProdutos: [],
      regrasTiposLogisticos: [],
    },
  };
}

function criarOpcaoEntrega(valorEmCentavos = 1800) {
  return {
    identificador: "entrega-1",
    provedor: "entrega-propria",
    servico: "entrega-propria-atual",
    nome: "Entrega propria",
    tipo: "entrega" as const,
    valorEmCentavos,
    descricao: "Hoje",
    metadados: {
      origem: "fluxo-atual",
      detalheInterno: {
        ignorado: true,
      },
    },
  };
}

function criarOpcaoFrenet(valorEmCentavos = 2490) {
  return {
    identificador: "frenet-sedex",
    provedor: "frenet",
    servico: "SEDEX",
    nome: "Sedex",
    tipo: "entrega" as const,
    valorEmCentavos,
    descricao: "3 dias uteis",
    metadados: {
      transportadora: "Correios",
      valorOriginal: 29.9,
      detalheInterno: {
        ignorado: true,
      },
    },
  };
}

descrever("revalidarFreteCheckout", () => {
  verificar("revalida entrega propria de produto simples", async () => {
    const resultado = await revalidarFreteCheckout({
      itens: [criarItem()],
      produtos: [produtoSimples],
      cepFinal: "30140-071",
      dependencias: criarDependencias(async (entrada) =>
        criarResultadoCotacao(entrada, [criarOpcaoEntrega()]),
      ),
    });

    afirmacoes.equal(resultado.sucesso, true);
    if (resultado.sucesso) {
      afirmacoes.equal(resultado.freteEmCentavos, 1800);
      afirmacoes.equal(resultado.fallbackAcionado, false);
      afirmacoes.equal(
        resultado.snapshotFrete.itens[0]?.provedor,
        "entrega-propria",
      );
      afirmacoes.equal(
        resultado.snapshotFrete.itens[0]?.itensLogisticos[0]?.pesoEmGramas,
        500,
      );
      afirmacoes.equal(
        resultado.snapshotFrete.itens[0]?.pacotes[0]?.dimensoes.comprimentoEmCm,
        15,
      );
      afirmacoes.deepEqual(resultado.snapshotFrete.itens[0]?.metadataResumida, {
        origem: "fluxo-atual",
      });
    }
  });

  verificar("leva a variante selecionada para a cotacao oficial", async () => {
    let varianteCotada: string | null | undefined;

    const resultado = await revalidarFreteCheckout({
      itens: [
        criarItem({
          produtoId: produtoComVariante.id,
          varianteId: "variante-1",
        }),
      ],
      produtos: [produtoComVariante],
      cepFinal: "30140071",
      dependencias: criarDependencias(async (entrada) => {
        varianteCotada = entrada.varianteAtual?.identificadorVariante;
        return criarResultadoCotacao(entrada, [criarOpcaoEntrega()]);
      }),
    });

    afirmacoes.equal(resultado.sucesso, true);
    afirmacoes.equal(varianteCotada, "variante-1");
    if (resultado.sucesso) {
      afirmacoes.equal(
        resultado.snapshotFrete.itens[0]?.itensLogisticos[0]?.varianteId,
        "variante-1",
      );
    }
  });

  verificar("revalida retirada disponivel", async () => {
    const resultado = await revalidarFreteCheckout({
      itens: [
        criarItem({
          modalidade: "retirada",
          valorEmCentavos: 0,
        }),
      ],
      produtos: [produtoComRetirada],
      cepFinal: "30140071",
      dependencias: criarDependencias(async (entrada) =>
        criarResultadoCotacao(entrada, [
          {
            identificador: "retirada-1",
            provedor: "retirada",
            servico: "retirada-atual",
            nome: "Retirada",
            tipo: "retirada",
            valorEmCentavos: 0,
          },
        ]),
      ),
    });

    afirmacoes.equal(resultado.sucesso, true);
    if (resultado.sucesso) {
      afirmacoes.equal(resultado.freteEmCentavos, 0);
      afirmacoes.equal(
        resultado.snapshotFrete.itens[0]?.modalidade,
        "retirada",
      );
    }
  });

  verificar("revalida servico Frenet selecionado", async () => {
    const resultado = await revalidarFreteCheckout({
      itens: [
        criarItem({
          modalidade: "frenet",
          valorEmCentavos: 2490,
          servico: "SEDEX",
        }),
      ],
      produtos: [produtoSimples],
      cepFinal: "30140071",
      dependencias: criarDependencias(async (entrada) =>
        criarResultadoCotacao(entrada, [criarOpcaoFrenet()]),
      ),
    });

    afirmacoes.equal(resultado.sucesso, true);
    if (resultado.sucesso) {
      afirmacoes.equal(resultado.snapshotFrete.itens[0]?.provedor, "frenet");
      afirmacoes.equal(resultado.snapshotFrete.itens[0]?.servico, "SEDEX");
      afirmacoes.equal(resultado.snapshotFrete.itens[0]?.prazo, "3 dias uteis");
      afirmacoes.equal(
        resultado.snapshotFrete.itens[0]?.pacotes[0]?.pesoTotalEmGramas,
        500,
      );
      afirmacoes.equal(
        resultado.snapshotFrete.itens[0]?.itensLogisticos[0]?.produtoId,
        "produto-simples",
      );
      afirmacoes.deepEqual(resultado.snapshotFrete.itens[0]?.metadataResumida, {
        transportadora: "Correios",
        valorOriginal: 29.9,
      });
    }
  });

  verificar("bloqueia servico indisponivel pela regra carregada", async () => {
    const resultado = await revalidarFreteCheckout({
      itens: [
        criarItem({
          modalidade: "frenet",
          valorEmCentavos: 2490,
          servico: "SEDEX",
        }),
      ],
      produtos: [produtoSimples],
      cepFinal: "30140071",
      dependencias: criarDependencias(
        async (entrada) => criarResultadoCotacao(entrada, [criarOpcaoFrenet()]),
        async ({ produtoId, categoriaId }) => ({
          ...criarDisponibilidadeVazia(produtoId, categoriaId),
          configuracao: {
            ...criarDisponibilidadeVazia(produtoId, categoriaId).configuracao,
            servicos: [
              {
                identificador: "SEDEX",
                provedorIdentificador: "frenet",
                ativo: true,
              },
            ],
            regrasProdutos: [
              {
                produtoId,
                efeito: "bloquear",
                provedorIdentificador: "frenet",
                servicoIdentificador: "SEDEX",
              },
            ],
          },
        }),
      ),
    });

    afirmacoes.equal(resultado.sucesso, false);
    if (!resultado.sucesso) {
      afirmacoes.equal(resultado.codigo, "frete-indisponivel");
    }
  });

  verificar(
    "preserva entrega selecionada se outro provider falha",
    async () => {
      const resultado = await revalidarFreteCheckout({
        itens: [criarItem()],
        produtos: [produtoSimples],
        cepFinal: "30140071",
        dependencias: criarDependencias(async (entrada) => {
          const cotacao = criarResultadoCotacao(entrada, [criarOpcaoEntrega()]);

          return {
            sucesso: false,
            solicitacao: cotacao.solicitacao,
            opcoes: cotacao.opcoes,
            erros: [
              {
                codigo: "cotacao-frenet-timeout",
                mensagem: "A cotacao da Frenet excedeu o tempo limite.",
                provedor: "frenet",
              },
            ],
          };
        }),
      });

      afirmacoes.equal(resultado.sucesso, true);
    },
  );

  verificar("bloqueia CEP divergente entre checkout e frete", async () => {
    const resultado = await revalidarFreteCheckout({
      itens: [criarItem({ cep: "01310930" })],
      produtos: [produtoSimples],
      cepFinal: "30140071",
      dependencias: criarDependencias(async (entrada) =>
        criarResultadoCotacao(entrada, [criarOpcaoEntrega()]),
      ),
    });

    afirmacoes.deepEqual(resultado, {
      sucesso: false,
      codigo: "cep-frete-divergente",
      mensagem: "O CEP do frete mudou. Confirme a entrega novamente.",
      exigeNovaConfirmacao: true,
    });
  });

  verificar("bloqueia valor divergente", async () => {
    const resultado = await revalidarFreteCheckout({
      itens: [criarItem({ valorEmCentavos: 1 })],
      produtos: [produtoSimples],
      cepFinal: "30140071",
      dependencias: criarDependencias(async (entrada) =>
        criarResultadoCotacao(entrada, [criarOpcaoEntrega(1800)]),
      ),
    });

    afirmacoes.equal(resultado.sucesso, false);
    if (!resultado.sucesso) {
      afirmacoes.equal(resultado.codigo, "valor-frete-divergente");
    }
  });

  verificar("bloqueia modalidade manipulada", async () => {
    const itemManipulado = {
      ...criarItem(),
      freteEscolhido: {
        ...criarItem().freteEscolhido,
        id: "forjada",
      },
    } as unknown as ItemCarrinho;

    const resultado = await revalidarFreteCheckout({
      itens: [itemManipulado],
      produtos: [produtoSimples],
      cepFinal: "30140071",
      dependencias: criarDependencias(async (entrada) =>
        criarResultadoCotacao(entrada, [criarOpcaoEntrega()]),
      ),
    });

    afirmacoes.equal(resultado.sucesso, false);
    if (!resultado.sucesso) {
      afirmacoes.equal(resultado.codigo, "modalidade-frete-invalida");
    }
  });

  verificar("bloqueia produto manipulado no carrinho", async () => {
    const resultado = await revalidarFreteCheckout({
      itens: [criarItem({ produtoId: "produto-forjado" })],
      produtos: [produtoSimples],
      cepFinal: "30140071",
      dependencias: criarDependencias(async (entrada) =>
        criarResultadoCotacao(entrada, [criarOpcaoEntrega()]),
      ),
    });

    afirmacoes.equal(resultado.sucesso, false);
    if (!resultado.sucesso) {
      afirmacoes.equal(resultado.codigo, "produto-frete-invalido");
    }
  });

  verificar("bloqueia quando a cotacao oficial falha", async () => {
    const resultado = await revalidarFreteCheckout({
      itens: [criarItem()],
      produtos: [produtoSimples],
      cepFinal: "30140071",
      dependencias: criarDependencias(async () => {
        throw new Error("nova indisponivel");
      }),
    });

    afirmacoes.equal(resultado.sucesso, false);
    if (!resultado.sucesso) {
      afirmacoes.equal(resultado.codigo, "frete-indisponivel");
    }
  });
});
