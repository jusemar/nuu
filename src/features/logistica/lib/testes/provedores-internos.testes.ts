import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import { criarProvedorFreteEntregaPropria } from "../provedores/criar-provedor-frete-entrega-propria";
import { criarProvedorFreteRetirada } from "../provedores/criar-provedor-frete-retirada";
import type { SolicitacaoCotacaoFrete } from "../../types/contratos-frete";

const solicitacao: SolicitacaoCotacaoFrete = {
  identificador: "cotacao-1",
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

descrever("provedores internos de frete", () => {
  verificar("valida opcoes da entrega propria", async () => {
    const provedor = criarProvedorFreteEntregaPropria({
      async listarOpcoesEntregaPropria() {
        return [
          {
            identificador: "entrega-1",
            provedor: "entrega-propria",
            servico: "entrega-propria-atual",
            nome: "Entrega Propria",
            tipo: "entrega",
            valorEmCentavos: 1800,
          },
        ];
      },
    });
    const resultado = await provedor.cotarFrete(solicitacao);

    afirmacoes.equal(resultado.sucesso, true);

    if (!resultado.sucesso) return;

    afirmacoes.equal(resultado.opcoes.length, 1);
    afirmacoes.equal(resultado.opcoes[0]?.valorEmCentavos, 1800);
  });

  verificar("rejeita opcoes invalidas da entrega propria", async () => {
    const provedor = criarProvedorFreteEntregaPropria({
      async listarOpcoesEntregaPropria() {
        return [
          {
            identificador: "entrega-invalida",
            provedor: "entrega-propria",
            servico: "entrega-propria-atual",
            nome: "Entrega Invalida",
            tipo: "entrega",
            valorEmCentavos: -1,
          },
        ];
      },
    });
    const resultado = await provedor.cotarFrete(solicitacao);

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(
      resultado.erros[0]?.codigo,
      "opcoes-entrega-propria-invalidas",
    );
  });

  verificar("retorna aviso quando retirada esta inativa", async () => {
    const provedor = criarProvedorFreteRetirada(
      {
        async listarOpcoesRetirada() {
          throw new Error("nao deve consultar");
        },
      },
      { ativo: false },
    );
    const resultado = await provedor.cotarFrete(solicitacao);

    afirmacoes.equal(resultado.sucesso, true);

    if (!resultado.sucesso) return;

    afirmacoes.deepEqual(resultado.opcoes, []);
    afirmacoes.deepEqual(resultado.avisos, [
      "O provedor de retirada esta inativo.",
    ]);
  });

  verificar("retorna erro controlado quando retirada falha", async () => {
    const provedor = criarProvedorFreteRetirada({
      async listarOpcoesRetirada() {
        throw new Error("falha controlada");
      },
    });
    const resultado = await provedor.cotarFrete(solicitacao);

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(
      resultado.erros[0]?.codigo,
      "cotacao-retirada-indisponivel",
    );
  });
});
