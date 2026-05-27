import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import { cotarFreteInterno } from "../cotacoes/cotar-frete-interno";
import type { SolicitacaoCotacaoFrete } from "../../types/contratos-frete";

const solicitacao: SolicitacaoCotacaoFrete = {
  identificador: "cotacao-interna",
  destino: {
    cep: "30140071",
    pais: "BR",
  },
  itens: [
    {
      identificador: "item-1",
      produtoId: "produto-1",
      nome: "Produto",
      quantidade: 1,
      pesoEmGramas: 500,
      dimensoes: {
        alturaEmCm: 5,
        larguraEmCm: 10,
        comprimentoEmCm: 15,
      },
    },
  ],
  pacotes: [],
  moeda: "BRL",
};

const configuracaoFrenet = {
  token: "token-frenet",
  cepOrigem: "30140071",
  urlCotacao: "https://api.frenet.com.br/shipping/quote",
  timeoutEmMs: 50,
  ambiente: "teste" as const,
};

descrever("cotarFreteInterno", () => {
  verificar("compoe cotacao com entrega propria", async () => {
    const resultado = await cotarFreteInterno(solicitacao, {
      entregaPropriaAtual: {
        async consultarEntregaPropriaAtual(consulta) {
          afirmacoes.deepEqual(consulta, {
            produtoId: "produto-1",
            cep: "30140071",
          });

          return {
            disponivel: true,
            valorEmCentavos: 2100,
          };
        },
      },
    });

    afirmacoes.equal(resultado.sucesso, true);
    afirmacoes.equal(resultado.opcoes.length, 1);
    afirmacoes.equal(resultado.opcoes[0]?.provedor, "entrega-propria");
  });

  verificar("compoe cotacao com retirada", async () => {
    const resultado = await cotarFreteInterno(solicitacao, {
      retiradaAtual: {
        async listarRetiradasAtuais() {
          return [
            {
              identificador: "retirada-loja",
              nome: "Retirada na loja",
            },
          ];
        },
      },
    });

    afirmacoes.equal(resultado.sucesso, true);
    afirmacoes.equal(resultado.opcoes.length, 1);
    afirmacoes.equal(resultado.opcoes[0]?.tipo, "retirada");
  });

  verificar("compoe entrega propria e retirada juntas", async () => {
    const resultado = await cotarFreteInterno(solicitacao, {
      entregaPropriaAtual: {
        async consultarEntregaPropriaAtual() {
          return {
            disponivel: true,
            valorEmCentavos: 1900,
          };
        },
      },
      retiradaAtual: {
        async listarRetiradasAtuais() {
          return [
            {
              identificador: "retirada-balcao",
              nome: "Retirada no balcao",
            },
          ];
        },
      },
    });

    afirmacoes.equal(resultado.sucesso, true);
    afirmacoes.deepEqual(resultado.opcoes.map((opcao) => opcao.tipo).sort(), [
      "entrega",
      "retirada",
    ]);
  });

  verificar("compoe Frenet com entrega propria e retirada", async () => {
    const resultado = await cotarFreteInterno(
      solicitacao,
      {
        entregaPropriaAtual: {
          async consultarEntregaPropriaAtual() {
            return {
              disponivel: true,
              valorEmCentavos: 1900,
            };
          },
        },
        retiradaAtual: {
          async listarRetiradasAtuais() {
            return [
              {
                identificador: "retirada-balcao",
                nome: "Retirada no balcao",
              },
            ];
          },
        },
        frenet: {
          async consultarCotacao() {
            return {
              opcoes: [
                {
                  identificador: "frenet:sedex",
                  provedor: "frenet",
                  servico: "SEDEX",
                  nome: "Sedex",
                  tipo: "entrega",
                  valorEmCentavos: 2490,
                  prazoMinimoEmDiasUteis: 3,
                  prazoMaximoEmDiasUteis: 3,
                },
              ],
              avisos: [],
            };
          },
        },
      },
      {
        frenet: configuracaoFrenet,
      },
    );

    afirmacoes.equal(resultado.sucesso, true);
    afirmacoes.deepEqual(
      resultado.opcoes.map((opcao) => opcao.provedor).sort(),
      ["entrega-propria", "frenet", "retirada"],
    );
  });

  verificar("retorna cotacao vazia sem provedores disponiveis", async () => {
    const resultado = await cotarFreteInterno(solicitacao, {});

    afirmacoes.equal(resultado.sucesso, true);

    if (!resultado.sucesso) return;

    afirmacoes.deepEqual(resultado.opcoes, []);
    afirmacoes.deepEqual(resultado.avisos, []);
  });

  verificar("preserva erro controlado do provider interno", async () => {
    const resultado = await cotarFreteInterno(solicitacao, {
      entregaPropriaAtual: {
        async consultarEntregaPropriaAtual() {
          throw new Error("falha na porta atual");
        },
      },
    });

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(
      resultado.erros[0]?.codigo,
      "cotacao-entrega-propria-indisponivel",
    );
  });

  verificar("preserva opcoes internas quando a Frenet falha", async () => {
    const resultado = await cotarFreteInterno(
      solicitacao,
      {
        retiradaAtual: {
          async listarRetiradasAtuais() {
            return [
              {
                identificador: "retirada-balcao",
                nome: "Retirada no balcao",
              },
            ];
          },
        },
        frenet: {
          async consultarCotacao() {
            throw new Error("falha externa");
          },
          registrarEvento() {},
        },
      },
      {
        frenet: configuracaoFrenet,
      },
    );

    afirmacoes.equal(resultado.sucesso, false);
    afirmacoes.equal(resultado.opcoes[0]?.provedor, "retirada");

    if (resultado.sucesso) return;

    afirmacoes.equal(resultado.erros[0]?.codigo, "cotacao-frenet-indisponivel");
  });

  verificar("rejeita solicitacao invalida antes das portas", async () => {
    let quantidadeConsultas = 0;
    const resultado = await cotarFreteInterno(
      {
        ...solicitacao,
        itens: [],
      },
      {
        retiradaAtual: {
          async listarRetiradasAtuais() {
            quantidadeConsultas += 1;
            return [];
          },
        },
      },
    );

    afirmacoes.equal(quantidadeConsultas, 0);
    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(
      resultado.erros[0]?.codigo,
      "solicitacao-cotacao-invalida",
    );
  });

  verificar("consolida multiplas opcoes de retirada", async () => {
    const resultado = await cotarFreteInterno(solicitacao, {
      retiradaAtual: {
        async listarRetiradasAtuais() {
          return [
            {
              identificador: "retirada-centro",
              nome: "Retirada Centro",
            },
            {
              identificador: "retirada-deposito",
              nome: "Retirada Deposito",
            },
          ];
        },
      },
    });

    afirmacoes.equal(resultado.sucesso, true);
    afirmacoes.equal(resultado.opcoes.length, 2);
    afirmacoes.deepEqual(
      resultado.opcoes.map((opcao) => opcao.identificador),
      ["retirada:retirada-centro", "retirada:retirada-deposito"],
    );
  });
});
