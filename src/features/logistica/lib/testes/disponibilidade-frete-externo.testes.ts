import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type {
  ItemLogistico,
  OpcaoFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";
import type {
  ConfiguracaoDisponibilidadeFrete,
  ContextoProdutoDisponibilidadeFrete,
  VolumesDisponibilidadeFrete,
} from "../../types/disponibilidade-frete";
import type {
  CategoriaCadeiaFreteExterno,
  DisponibilidadeFreteExterno,
} from "../../types/disponibilidade-frete-externo";
import { cotarFretePorGruposLogisticos } from "../cotacoes/cotar-frete-por-grupos-logisticos";
import {
  filtrarOpcoesFreteDisponiveis,
  resolverDisponibilidadeOpcaoFrete,
} from "../disponibilidade/resolver-disponibilidade-frete";
import {
  descreverOrigemFreteExterno,
  montarCadeiaCategoriasFreteExterno,
  opcaoEhFreteExterno,
  resolverDisponibilidadeFreteExterno,
} from "../disponibilidade/resolver-disponibilidade-frete-externo";
import { agruparItensPorOrigemExpedicao } from "../grupos-logisticos/agrupar-itens-por-origem-expedicao";

// ---------------------------------------------------------------------------
// Precedência Produto > Categoria > Ancestrais > Padrão da loja
// ---------------------------------------------------------------------------

const racoes = (
  modo: CategoriaCadeiaFreteExterno["modo"],
): CategoriaCadeiaFreteExterno => ({ id: "cat-racoes", nome: "Rações", modo });
const petShop = (
  modo: CategoriaCadeiaFreteExterno["modo"],
): CategoriaCadeiaFreteExterno => ({ id: "cat-pet", nome: "Pet Shop", modo });

descrever("disponibilidade do Frete Externo — precedência", () => {
  verificar("1. produto herda categoria ativada", () => {
    const r = resolverDisponibilidadeFreteExterno({
      modoProduto: "herdar",
      cadeiaCategorias: [racoes("ativado")],
    });
    afirmacoes.equal(r.ativo, true);
    afirmacoes.deepEqual(r.origem, {
      tipo: "categoria",
      categoriaId: "cat-racoes",
      categoriaNome: "Rações",
    });
  });

  verificar("2. produto herda categoria desativada (caso Ração A)", () => {
    const r = resolverDisponibilidadeFreteExterno({
      modoProduto: "herdar",
      cadeiaCategorias: [racoes("desativado")],
    });
    afirmacoes.equal(r.ativo, false);
    afirmacoes.equal(r.valor, "desativado");
    afirmacoes.equal(descreverOrigemFreteExterno(r.origem), "Categoria Rações");
  });

  verificar("3. produto ativado vence categoria desativada (Ração B)", () => {
    const r = resolverDisponibilidadeFreteExterno({
      modoProduto: "ativado",
      cadeiaCategorias: [racoes("desativado")],
    });
    afirmacoes.equal(r.ativo, true);
    afirmacoes.deepEqual(r.origem, { tipo: "produto" });
  });

  verificar("4. produto desativado vence categoria ativada", () => {
    const r = resolverDisponibilidadeFreteExterno({
      modoProduto: "desativado",
      cadeiaCategorias: [racoes("ativado"), petShop("ativado")],
    });
    afirmacoes.equal(r.ativo, false);
    afirmacoes.deepEqual(r.origem, { tipo: "produto" });
  });

  verificar("5. categoria filha vence categoria ancestral", () => {
    const filhaVence = resolverDisponibilidadeFreteExterno({
      modoProduto: "herdar",
      cadeiaCategorias: [racoes("ativado"), petShop("desativado")],
    });
    afirmacoes.equal(filhaVence.ativo, true);
    afirmacoes.equal(filhaVence.origem.tipo, "categoria");

    const herdaAncestral = resolverDisponibilidadeFreteExterno({
      modoProduto: "herdar",
      cadeiaCategorias: [racoes("herdar"), petShop("desativado")],
    });
    afirmacoes.equal(herdaAncestral.ativo, false);
    afirmacoes.deepEqual(herdaAncestral.origem, {
      tipo: "categoria-ancestral",
      categoriaId: "cat-pet",
      categoriaNome: "Pet Shop",
    });
  });

  verificar("6. sem configuração → padrão da loja ativado", () => {
    for (const cadeia of [[], [racoes("herdar"), petShop("herdar")]]) {
      const r = resolverDisponibilidadeFreteExterno({
        modoProduto: "herdar",
        cadeiaCategorias: cadeia,
      });
      afirmacoes.equal(r.ativo, true);
      afirmacoes.equal(descreverOrigemFreteExterno(r.origem), "Padrão da loja");
    }
  });

  verificar("monta a cadeia até a raiz e tolera ciclo acidental", () => {
    const categorias = [
      {
        id: "a",
        nome: "Ração Premium",
        parentId: "b",
        modo: "herdar" as const,
      },
      { id: "b", nome: "Rações", parentId: "c", modo: "desativado" as const },
      { id: "c", nome: "Pet Shop", parentId: "a", modo: "ativado" as const },
    ];
    const cadeia = montarCadeiaCategoriasFreteExterno(categorias, "a");
    afirmacoes.deepEqual(
      cadeia.map((categoria) => categoria.id),
      ["a", "b", "c"],
    );
    afirmacoes.deepEqual(
      montarCadeiaCategoriasFreteExterno(categorias, null),
      [],
    );
  });

  verificar("Entrega Própria e Retirada não são Frete Externo", () => {
    afirmacoes.equal(opcaoEhFreteExterno({ provedor: "frenet" }), true);
    afirmacoes.equal(
      opcaoEhFreteExterno({ provedor: "entrega-propria" }),
      false,
    );
    afirmacoes.equal(opcaoEhFreteExterno({ provedor: "retirada" }), false);
  });
});

// ---------------------------------------------------------------------------
// Gate dentro do motor atual de disponibilidade
// ---------------------------------------------------------------------------

function opcaoFrenet(
  servico: string,
  nome: string,
  transportadora: string,
): OpcaoFrete {
  return {
    identificador: `frenet-${servico}`,
    provedor: "frenet",
    servico,
    nome,
    tipo: "entrega",
    valorEmCentavos: 3000,
    metadados: { transportadora },
  };
}

const PAC = opcaoFrenet("03298", "PAC", "Correios");
const SEDEX = opcaoFrenet("03220", "Sedex", "Correios");
const JADLOG = opcaoFrenet("f-3", "Jadlog Package", "Jadlog");
const ENTREGA_PROPRIA: OpcaoFrete = {
  identificador: "entrega-propria",
  provedor: "entrega-propria",
  servico: "entrega-propria-atual",
  nome: "Entrega rápida",
  tipo: "entrega",
  valorEmCentavos: 700,
};
const PROGRAMADA: OpcaoFrete = {
  ...ENTREGA_PROPRIA,
  identificador: "entrega-propria:programada",
  servico: "entrega-programada",
  nome: "Entrega programada",
  valorEmCentavos: 0,
};
const RETIRADA: OpcaoFrete = {
  identificador: "retirada",
  provedor: "retirada",
  servico: "retirada-atual",
  nome: "Retirada",
  tipo: "retirada",
  valorEmCentavos: 0,
};
const TODAS = [PAC, SEDEX, JADLOG, ENTREGA_PROPRIA, PROGRAMADA, RETIRADA];

function configuracao(
  parcial: Partial<ConfiguracaoDisponibilidadeFrete> = {},
): ConfiguracaoDisponibilidadeFrete {
  return {
    provedores: [
      { identificador: "frenet", ativo: true },
      { identificador: "entrega-propria", ativo: true },
      { identificador: "retirada", ativo: true },
    ],
    transportadoras: [
      {
        identificador: "correios",
        nome: "Correios",
        provedorIdentificador: "frenet",
        ativo: true,
      },
      {
        identificador: "jadlog",
        nome: "Jadlog",
        provedorIdentificador: "frenet",
        ativo: true,
      },
    ],
    servicos: [
      {
        identificador: "03298",
        provedorIdentificador: "frenet",
        transportadoraIdentificador: "correios",
        ativo: true,
      },
      {
        identificador: "03220",
        provedorIdentificador: "frenet",
        transportadoraIdentificador: "correios",
        ativo: true,
      },
      {
        identificador: "f-3",
        provedorIdentificador: "frenet",
        transportadoraIdentificador: "jadlog",
        ativo: true,
      },
    ],
    regrasCategorias: [],
    regrasProdutos: [],
    regrasTiposLogisticos: [],
    ...parcial,
  };
}

function item(
  origemExpedicao: "loja" | "fornecedor",
  produtoId = "produto-racao",
): ItemLogistico {
  return {
    identificador: `item-${produtoId}`,
    produtoId,
    nome: produtoId,
    quantidade: 1,
    pesoEmGramas: 15000,
    dimensoes: { alturaEmCm: 60, larguraEmCm: 40, comprimentoEmCm: 12 },
    origemExpedicao,
    fornecedorProvedor: origemExpedicao === "fornecedor" ? "laquila" : null,
    necessitaEtiquetaFornecedor: origemExpedicao === "fornecedor",
  };
}

const volumesLoja: VolumesDisponibilidadeFrete = {
  itens: [item("loja")],
  pacotes: [],
};

const DESATIVADO: DisponibilidadeFreteExterno = {
  ativo: false,
  valor: "desativado",
  origem: {
    tipo: "categoria",
    categoriaId: "cat-racoes",
    categoriaNome: "Rações",
  },
};
const ATIVADO: DisponibilidadeFreteExterno = {
  ativo: true,
  valor: "ativado",
  origem: { tipo: "produto" },
};

function contexto(
  parcial: Partial<ContextoProdutoDisponibilidadeFrete> = {},
): ContextoProdutoDisponibilidadeFrete {
  return {
    produtoId: "produto-racao",
    categoriaId: "cat-racoes",
    tiposLogisticosIdentificadores: [],
    origemExpedicao: "loja",
    ...parcial,
  };
}

const nomes = (opcoes: OpcaoFrete[]) => opcoes.map((opcao) => opcao.nome);

descrever("disponibilidade do Frete Externo — gate no motor", () => {
  verificar(
    "7/8/9. desativado remove PAC/Sedex/Jadlog e mantém Entrega Própria e Retirada",
    () => {
      const opcoes = filtrarOpcoesFreteDisponiveis({
        opcoes: TODAS,
        contextoProduto: contexto({ freteExterno: DESATIVADO }),
        volumes: volumesLoja,
        configuracao: configuracao(),
      });
      afirmacoes.deepEqual(nomes(opcoes), [
        "Entrega rápida",
        "Entrega programada",
        "Retirada",
      ]);

      const motivo = resolverDisponibilidadeOpcaoFrete({
        opcao: SEDEX,
        contextoProduto: contexto({ freteExterno: DESATIVADO }),
        volumes: volumesLoja,
        configuracao: configuracao(),
      }).motivo;
      afirmacoes.equal(motivo, "frete-externo-desativado");
    },
  );

  verificar(
    "4. desativado bloqueia mesmo sem nenhuma regra específica de bloqueio",
    () => {
      const opcoes = filtrarOpcoesFreteDisponiveis({
        opcoes: [PAC, SEDEX, JADLOG],
        contextoProduto: contexto({
          freteExterno: { ...DESATIVADO, origem: { tipo: "produto" } },
        }),
        volumes: volumesLoja,
        configuracao: configuracao(),
      });
      afirmacoes.deepEqual(opcoes, []);
    },
  );

  verificar(
    "10. ativado não libera tudo: regra de produto continua bloqueando",
    () => {
      const opcoes = filtrarOpcoesFreteDisponiveis({
        opcoes: TODAS,
        contextoProduto: contexto({ freteExterno: ATIVADO }),
        volumes: volumesLoja,
        configuracao: configuracao({
          regrasProdutos: [
            {
              produtoId: "produto-racao",
              efeito: "bloquear",
              provedorIdentificador: "frenet",
              servicoIdentificador: "03220",
            },
          ],
        }),
      });
      afirmacoes.deepEqual(nomes(opcoes), [
        "PAC",
        "Jadlog Package",
        "Entrega rápida",
        "Entrega programada",
        "Retirada",
      ]);
    },
  );

  verificar("10. ativado mantém regra de categoria existente", () => {
    const opcoes = filtrarOpcoesFreteDisponiveis({
      opcoes: [PAC, SEDEX, JADLOG],
      contextoProduto: contexto({ freteExterno: ATIVADO }),
      volumes: volumesLoja,
      configuracao: configuracao({
        regrasCategorias: [
          {
            categoriaId: "cat-racoes",
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            transportadoraIdentificador: "jadlog",
          },
        ],
      }),
    });
    afirmacoes.deepEqual(nomes(opcoes), ["PAC", "Sedex"]);
  });

  verificar("11. ativado mantém classificação logística existente", () => {
    const opcoes = filtrarOpcoesFreteDisponiveis({
      opcoes: [PAC, SEDEX, JADLOG],
      contextoProduto: contexto({
        freteExterno: ATIVADO,
        tiposLogisticosIdentificadores: ["volumoso"],
      }),
      volumes: volumesLoja,
      configuracao: configuracao({
        regrasTiposLogisticos: [
          {
            tipoLogisticoIdentificador: "volumoso",
            efeito: "permitir",
            provedorIdentificador: "frenet",
            transportadoraIdentificador: "jadlog",
          },
        ],
      }),
    });
    afirmacoes.deepEqual(nomes(opcoes), ["Jadlog Package"]);
  });

  verificar("sem gate resolvido mantém o comportamento histórico", () => {
    const opcoes = filtrarOpcoesFreteDisponiveis({
      opcoes: TODAS,
      contextoProduto: contexto(),
      volumes: volumesLoja,
      configuracao: configuracao(),
    });
    afirmacoes.equal(opcoes.length, TODAS.length);
  });

  for (const sku of ["CAP-GENE-862", "CAP-TEXX-653"]) {
    verificar(
      `${sku}: categoria desativada não desliga a logística Laquila`,
      () => {
        // Pelo contexto de origem (PDP e resumo do checkout).
        const peloContexto = filtrarOpcoesFreteDisponiveis({
          opcoes: [PAC, SEDEX, JADLOG],
          contextoProduto: contexto({
            produtoId: sku,
            freteExterno: DESATIVADO,
            origemExpedicao: "fornecedor",
            fornecedorProvedor: "laquila",
          }),
          volumes: { itens: [item("fornecedor", sku)], pacotes: [] },
          configuracao: configuracao(),
        });
        afirmacoes.deepEqual(nomes(peloContexto), [
          "PAC",
          "Sedex",
          "Jadlog Package",
        ]);

        // Pelos itens cotados (revalidação, que não informa a origem no contexto).
        const pelosItens = filtrarOpcoesFreteDisponiveis({
          opcoes: [PAC, SEDEX, JADLOG],
          contextoProduto: contexto({
            produtoId: sku,
            freteExterno: DESATIVADO,
            origemExpedicao: undefined,
          }),
          volumes: { itens: [item("fornecedor", sku)], pacotes: [] },
          configuracao: configuracao(),
        });
        afirmacoes.deepEqual(nomes(pelosItens), [
          "PAC",
          "Sedex",
          "Jadlog Package",
        ]);
      },
    );
  }
});

// ---------------------------------------------------------------------------
// Evita cotação externa desnecessária
// ---------------------------------------------------------------------------

function solicitacao(itens: ItemLogistico[]): SolicitacaoCotacaoFrete {
  return {
    identificador: "cotacao-gate",
    destino: { cep: "30610000", pais: "BR" },
    itens,
    pacotes: itens.map((atual) => ({
      identificador: `pacote-${atual.identificador}`,
      itens: [atual],
      quantidadeVolumes: 1,
      pesoTotalEmGramas: atual.pesoEmGramas,
      dimensoes: atual.dimensoes,
    })),
    gruposLogisticos: agruparItensPorOrigemExpedicao(itens),
    moeda: "BRL",
  };
}

function dependencias(registro: { frenet: string[]; entregas: string[] }) {
  return {
    entregaPropriaAtual: {
      async consultarEntregaPropriaAtual(consulta: { produtoId: string }) {
        registro.entregas.push(consulta.produtoId);
        return { disponivel: true as const, valorEmCentavos: 700 };
      },
    },
    frenet: {
      async consultarCotacao(atual: SolicitacaoCotacaoFrete) {
        registro.frenet.push(
          atual.itens.map((i) => i.origemExpedicao).join("+"),
        );
        return {
          opcoes: [{ ...SEDEX, identificador: `sedex:${atual.identificador}` }],
          avisos: [],
        };
      },
      registrarEvento() {},
    },
  };
}

const configuracaoCotacao = {
  frenet: {
    token: "token-teste",
    cepOrigem: "30140071",
    urlCotacao: "https://frenet.exemplo/cotacao",
    timeoutEmMs: 50,
    ambiente: "teste" as const,
  },
  cepOrigemFornecedorPorProvedor: { laquila: "83430000" },
};

descrever(
  "disponibilidade do Frete Externo — sem cotação desnecessária",
  () => {
    verificar(
      "gate desativado não chama a Frenet e mantém a Entrega Própria",
      async () => {
        const registro = { frenet: [] as string[], entregas: [] as string[] };
        const racao = item("loja");
        const resultado = await cotarFretePorGruposLogisticos(
          solicitacao([racao]),
          dependencias(registro),
          {
            ...configuracaoCotacao,
            itensSemFreteExterno: new Set([racao.identificador]),
          },
        );
        afirmacoes.deepEqual(registro.frenet, []);
        afirmacoes.deepEqual(registro.entregas, ["produto-racao"]);
        afirmacoes.deepEqual(
          resultado.cotacoes[0]!.resultado.opcoes.map(
            (opcao) => opcao.provedor,
          ),
          ["entrega-propria"],
        );
      },
    );

    verificar("gate ativado continua cotando a Frenet", async () => {
      const registro = { frenet: [] as string[], entregas: [] as string[] };
      await cotarFretePorGruposLogisticos(
        solicitacao([item("loja")]),
        dependencias(registro),
        configuracaoCotacao,
      );
      afirmacoes.deepEqual(registro.frenet, ["loja"]);
    });

    verificar(
      "carrinho misto: grupo Laquila continua cotando mesmo com item marcado",
      async () => {
        const registro = { frenet: [] as string[], entregas: [] as string[] };
        const racao = item("loja");
        const capacete = item("fornecedor", "CAP-GENE-862");
        await cotarFretePorGruposLogisticos(
          solicitacao([racao, capacete]),
          dependencias(registro),
          {
            ...configuracaoCotacao,
            itensSemFreteExterno: new Set([
              racao.identificador,
              capacete.identificador,
            ]),
          },
        );
        afirmacoes.deepEqual(registro.frenet, ["fornecedor"]);
      },
    );
  },
);
