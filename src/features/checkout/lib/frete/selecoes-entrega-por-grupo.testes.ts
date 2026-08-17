import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type {
  CotacaoEntregaGrupoCheckout,
  OpcaoEntregaCheckout,
  SelecaoEntregaGrupoCheckout,
} from "../../types/checkout.types";
import {
  reconciliarSelecoesEntregaPorGrupo,
  somarSelecoesEntrega,
  todasEntregasSelecionadas,
} from "./selecoes-entrega-por-grupo";

function opcao(
  identificador: string,
  valorEmCentavos: number,
  provedor = "frenet",
): OpcaoEntregaCheckout {
  return {
    identificador,
    nome: identificador,
    descricao: null,
    prazoMinimoEmDiasUteis: 2,
    prazoMaximoEmDiasUteis: 4,
    valorEmCentavos,
    tipo: provedor === "retirada" ? "retirada" : "entrega",
    provedor,
    servico: identificador,
    transportadora: provedor === "frenet" ? "Correios" : null,
    metadadosRelevantes: null,
  };
}

function cotacao(
  chaveGrupo: string,
  opcoes: OpcaoEntregaCheckout[],
): CotacaoEntregaGrupoCheckout {
  return {
    chaveGrupo,
    cepOrigem: "30668635",
    opcoes,
    mensagemErro: opcoes.length ? null : "Erro",
  };
}

function selecionar(
  chaveGrupo: string,
  atual: OpcaoEntregaCheckout,
): SelecaoEntregaGrupoCheckout {
  return { ...atual, chaveGrupo, cep: "30140071" };
}

descrever("seleções de entrega por grupo", () => {
  verificar(
    "soma Frenet de loja e fornecedor com valores independentes",
    () => {
      afirmacoes.equal(
        somarSelecoesEntrega([
          selecionar("loja", opcao("pac-loja", 1200)),
          selecionar("fornecedor", opcao("pac-fornecedor", 2150)),
        ]),
        3350,
      );
    },
  );

  verificar("retirada da loja não zera o frete do fornecedor", () => {
    afirmacoes.equal(
      somarSelecoesEntrega([
        selecionar("loja", opcao("retirada", 0, "retirada")),
        selecionar("fornecedor", opcao("sedex", 2500)),
      ]),
      2500,
    );
  });

  verificar("entregas próprias são somadas separadamente", () => {
    afirmacoes.equal(
      somarSelecoesEntrega([
        selecionar("loja", opcao("propria-loja", 1000, "entrega-propria")),
        selecionar(
          "fornecedor",
          opcao("propria-fornecedor", 800, "entrega-propria"),
        ),
      ]),
      1800,
    );
  });

  verificar("trocar uma opção altera somente a parcela daquele grupo", () => {
    const fornecedor = selecionar("fornecedor", opcao("pac-fornecedor", 900));
    const antes = [selecionar("loja", opcao("pac-loja", 1000)), fornecedor];
    const depois = [selecionar("loja", opcao("sedex-loja", 1700)), fornecedor];
    afirmacoes.equal(
      somarSelecoesEntrega(depois) - somarSelecoesEntrega(antes),
      700,
    );
  });

  verificar("grupo sem seleção impede finalizar", () => {
    const cotacoes = [
      cotacao("loja", [opcao("pac-loja", 1000)]),
      cotacao("fornecedor", [opcao("pac-fornecedor", 900)]),
    ];
    afirmacoes.equal(
      todasEntregasSelecionadas({
        cotacoes,
        selecoes: [selecionar("loja", cotacoes[0]!.opcoes[0]!)],
      }),
      false,
    );
  });

  verificar("falha de um grupo preserva seleção válida do outro", () => {
    const pacLoja = opcao("pac-loja", 1000);
    const resultado = reconciliarSelecoesEntregaPorGrupo({
      cotacoes: [cotacao("loja", [pacLoja]), cotacao("fornecedor", [])],
      selecoesAtuais: [
        selecionar("loja", pacLoja),
        selecionar("fornecedor", opcao("pac-fornecedor", 900)),
      ],
      cep: "30140071",
    });
    afirmacoes.deepEqual(resultado, [selecionar("loja", pacLoja)]);
  });

  verificar(
    "nova cotação invalida opção incompatível e remove grupo órfão",
    () => {
      const resultado = reconciliarSelecoesEntregaPorGrupo({
        cotacoes: [cotacao("loja", [opcao("sedex-loja", 1700)])],
        selecoesAtuais: [
          selecionar("loja", opcao("pac-loja", 1000)),
          selecionar("grupo-removido", opcao("pac-antigo", 900)),
        ],
        cep: "01310100",
      });
      afirmacoes.deepEqual(resultado, []);
    },
  );

  verificar(
    "preserva a mesma identidade no mesmo grupo com preço recotado",
    () => {
      const nova = opcao("pac-loja", 1400);
      const [resultado] = reconciliarSelecoesEntregaPorGrupo({
        cotacoes: [cotacao("loja", [nova])],
        selecoesAtuais: [selecionar("loja", opcao("pac-loja", 1000))],
        cep: "01310100",
      });
      afirmacoes.equal(resultado?.valorEmCentavos, 1400);
      afirmacoes.equal(resultado?.cep, "01310100");
    },
  );
});
