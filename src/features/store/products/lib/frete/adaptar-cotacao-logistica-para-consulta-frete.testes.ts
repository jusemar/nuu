import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type { ResultadoCotacaoFrete } from "@/features/logistica";
import { adaptarCotacaoLogisticaParaConsultaFrete } from "./adaptar-cotacao-logistica-para-consulta-frete";

const solicitacao = {
  identificador: "cotacao-1",
  destino: {
    cep: "30140071",
    pais: "BR" as const,
  },
  itens: [],
  pacotes: [],
  moeda: "BRL" as const,
};

descrever("adaptarCotacaoLogisticaParaConsultaFrete", () => {
  verificar("adapta entrega propria da logistica para resposta atual", () => {
    const resultadoNovo: ResultadoCotacaoFrete = {
      sucesso: true,
      solicitacao,
      avisos: [],
      opcoes: [
        {
          identificador: "entrega-1",
          provedor: "entrega-propria",
          servico: "entrega-propria-atual",
          nome: "Entrega Propria",
          tipo: "entrega",
          valorEmCentavos: 2400,
          descricao: "Entrega atendida",
          metadados: {
            nivelEntregaPropriaAtual: "cep-especifico",
            bairro: "Centro",
            cidade: "Belo Horizonte",
            uf: "MG",
            endereco: {
              cep: "30140071",
              logradouro: "Rua A",
              bairro: "Centro",
              cidade: "Belo Horizonte",
              uf: "MG",
            },
          },
        },
      ],
    };

    const resultado = adaptarCotacaoLogisticaParaConsultaFrete(resultadoNovo);

    afirmacoes.equal(resultado.found, true);
    if (resultado.found) {
      afirmacoes.equal(resultado.shippingPrice, 2400);
      afirmacoes.equal(resultado.level, "cep-especifico");
      afirmacoes.equal(resultado.endereco.cidade, "Belo Horizonte");
    }
  });

  verificar("mantem falha compativel quando a cotacao nao tem entrega", () => {
    const resultado = adaptarCotacaoLogisticaParaConsultaFrete({
      sucesso: true,
      solicitacao,
      opcoes: [],
      avisos: [],
    });

    afirmacoes.deepEqual(resultado, {
      found: false,
      message: "Consulte o vendedor",
      opcoesEntrega: [],
    });
  });

  verificar("mantem falha controlada da logistica no formato publico", () => {
    const resultado = adaptarCotacaoLogisticaParaConsultaFrete({
      sucesso: false,
      solicitacao,
      opcoes: [],
      erros: [
        {
          codigo: "variante-obrigatoria",
          mensagem: "Selecione uma variante.",
        },
      ],
    });

    afirmacoes.deepEqual(resultado, {
      found: false,
      message: "Selecione uma variante.",
      opcoesEntrega: [],
    });
  });

  verificar("expõe servico Frenet para a loja", () => {
    const resultado = adaptarCotacaoLogisticaParaConsultaFrete({
      sucesso: true,
      solicitacao,
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
    });

    afirmacoes.deepEqual(resultado, {
      found: false,
      message: "Consulte o vendedor",
      opcoesEntrega: [
        {
          identificador: "frenet:sedex",
          provedor: "frenet",
          servico: "SEDEX",
          nome: "Sedex",
          prazo: "3 dias uteis",
          valorEmCentavos: 2490,
        },
      ],
    });
  });

  verificar(
    "mantem retirada fora da resposta publica da entrega propria",
    () => {
      const resultado = adaptarCotacaoLogisticaParaConsultaFrete({
        sucesso: true,
        solicitacao,
        opcoes: [
          {
            identificador: "retirada-1",
            provedor: "retirada",
            servico: "retirada-atual",
            nome: "Retirada",
            tipo: "retirada",
            valorEmCentavos: 0,
          },
        ],
        avisos: [],
      });

      afirmacoes.deepEqual(resultado, {
        found: false,
        message: "Consulte o vendedor",
        opcoesEntrega: [],
      });
    },
  );
});
