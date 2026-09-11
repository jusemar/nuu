import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type { SolicitacaoCotacaoFrete } from "../../types/contratos-frete";
import { criarPortaEntregaPropriaAtual } from "../portas/criar-porta-entrega-propria-atual";
import { criarPortaRetiradaAtual } from "../portas/criar-porta-retirada-atual";

const solicitacao: SolicitacaoCotacaoFrete = {
  identificador: "cotacao-atual",
  destino: {
    cep: "30140071",
    pais: "BR",
  },
  itens: [
    {
      identificador: "item-1",
      produtoId: "produto-1",
      origemExpedicao: "loja",
      fornecedorProvedor: null,
      necessitaEtiquetaFornecedor: false,
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
  gruposLogisticos: [],
  moeda: "BRL",
};

descrever("portas do fluxo atual", () => {
  verificar("transforma entrega propria atual em opcao de frete", async () => {
    const porta = criarPortaEntregaPropriaAtual({
      async consultarEntregaPropriaAtual(consulta) {
        afirmacoes.deepEqual(consulta, {
          produtoId: "produto-1",
          cep: "30140071",
        });

        return {
          disponivel: true,
          valorEmCentavos: 2200,
          descricao: "Destino atendido",
        };
      },
    });
    const opcoes = await porta(solicitacao);

    afirmacoes.equal(opcoes.length, 1);
    afirmacoes.equal(opcoes[0]?.valorEmCentavos, 2200);
    afirmacoes.equal(opcoes[0]?.provedor, "entrega-propria");
  });

  verificar("preserva frete zero como uma opcao gratuita valida", async () => {
    const porta = criarPortaEntregaPropriaAtual({
      async consultarEntregaPropriaAtual() {
        return {
          disponivel: true,
          valorEmCentavos: 0,
          descricao: "Frete gratis definido para o destino",
        };
      },
    });

    const opcoes = await porta(solicitacao);

    afirmacoes.equal(opcoes.length, 1);
    afirmacoes.equal(opcoes[0]?.valorEmCentavos, 0);
    afirmacoes.equal(
      opcoes[0]?.descricao,
      "Frete gratis definido para o destino",
    );
  });

  verificar("permite política somente com entrega programada", async () => {
    const porta = criarPortaEntregaPropriaAtual({
      async consultarEntregaPropriaAtual() {
        return {
          disponivel: true,
          entregaRapidaAtiva: false,
          valorEmCentavos: 0,
          opcoesAdicionais: [
            {
              servico: "entrega-programada",
              nome: "Entrega programada",
              valorEmCentavos: 700,
            },
          ],
        };
      },
    });
    const opcoes = await porta(solicitacao);
    afirmacoes.equal(opcoes.length, 1);
    afirmacoes.equal(opcoes[0]?.servico, "entrega-programada");
    afirmacoes.equal(opcoes[0]?.valorEmCentavos, 700);
  });

  verificar("mantem destino sem regra fora das opcoes", async () => {
    const porta = criarPortaEntregaPropriaAtual({
      async consultarEntregaPropriaAtual() {
        return {
          disponivel: false,
          motivo: "Consulte o vendedor",
        };
      },
    });

    const opcoes = await porta(solicitacao);

    afirmacoes.deepEqual(opcoes, []);
  });

  verificar(
    "nao mistura entrega propria atual com multiplos itens",
    async () => {
      const porta = criarPortaEntregaPropriaAtual({
        async consultarEntregaPropriaAtual() {
          throw new Error("nao deve consultar");
        },
      });
      const opcoes = await porta({
        ...solicitacao,
        itens: [...solicitacao.itens, solicitacao.itens[0]!],
      });

      afirmacoes.deepEqual(opcoes, []);
    },
  );

  verificar("transforma retirada atual em opcao gratuita", async () => {
    const porta = criarPortaRetiradaAtual({
      async listarRetiradasAtuais() {
        return [
          {
            identificador: "modelo-retirada-1",
            nome: "Retirada Local",
            descricao: "Apos confirmacao",
          },
        ];
      },
    });
    const opcoes = await porta(solicitacao);

    afirmacoes.equal(opcoes.length, 1);
    afirmacoes.equal(opcoes[0]?.tipo, "retirada");
    afirmacoes.equal(opcoes[0]?.valorEmCentavos, 0);
  });
});
