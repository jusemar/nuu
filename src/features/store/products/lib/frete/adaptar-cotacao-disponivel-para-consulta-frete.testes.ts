import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type {
  DisponibilidadeFreteProduto,
  ResultadoCotacaoFrete,
} from "@/features/logistica";

import { adaptarCotacaoDisponivelParaConsultaFrete } from "./adaptar-cotacao-disponivel-para-consulta-frete";

const resultado: ResultadoCotacaoFrete = {
  sucesso: true,
  solicitacao: {
    identificador: "cotacao-loja",
    destino: { cep: "30140071", pais: "BR" },
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
  },
  opcoes: [
    {
      identificador: "sedex",
      provedor: "frenet",
      servico: "sedex",
      nome: "Sedex",
      tipo: "entrega",
      valorEmCentavos: 2500,
    },
    {
      identificador: "expresso",
      provedor: "frenet",
      servico: "expresso",
      nome: "Expresso",
      tipo: "entrega",
      valorEmCentavos: 3500,
    },
  ],
  avisos: [],
};

const disponibilidade: DisponibilidadeFreteProduto = {
  contextoProduto: {
    produtoId: "produto-1",
    categoriaId: "categoria-1",
    tiposLogisticosIdentificadores: [],
  },
  configuracao: {
    provedores: [{ identificador: "frenet", ativo: true }],
    transportadoras: [],
    servicos: [
      {
        identificador: "sedex",
        provedorIdentificador: "frenet",
        ativo: true,
      },
      {
        identificador: "expresso",
        provedorIdentificador: "frenet",
        ativo: true,
      },
    ],
    regrasCategorias: [],
    regrasProdutos: [
      {
        produtoId: "produto-1",
        efeito: "bloquear",
        provedorIdentificador: "frenet",
        servicoIdentificador: "expresso",
      },
    ],
    regrasTiposLogisticos: [],
  },
};

descrever("adaptarCotacaoDisponivelParaConsultaFrete", () => {
  verificar("filtra a cotacao da loja antes do BuyBox", () => {
    const consulta = adaptarCotacaoDisponivelParaConsultaFrete(
      resultado,
      disponibilidade,
    );

    afirmacoes.deepEqual(
      consulta.opcoesEntrega?.map((opcao) => opcao.servico),
      ["sedex"],
    );
  });
});
