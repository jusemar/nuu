import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import type { OpcaoFrete } from "../../types/contratos-frete";
import type {
  ConfiguracaoDisponibilidadeFrete,
  ContextoProdutoDisponibilidadeFrete,
  VolumesDisponibilidadeFrete,
} from "../../types/disponibilidade-frete";
import {
  filtrarOpcoesFreteDisponiveis,
  resolverDisponibilidadeOpcaoFrete,
} from "../disponibilidade/resolver-disponibilidade-frete";

const contextoProduto: ContextoProdutoDisponibilidadeFrete = {
  produtoId: "produto-colchao",
  categoriaId: "categoria-quarto",
  tiposLogisticosIdentificadores: ["fragil"],
};

const volumes: VolumesDisponibilidadeFrete = {
  itens: [
    {
      identificador: "item-colchao",
      produtoId: "produto-colchao",
      nome: "Colchao",
      quantidade: 1,
      pesoEmGramas: 7000,
      dimensoes: {
        alturaEmCm: 25,
        larguraEmCm: 90,
        comprimentoEmCm: 190,
      },
    },
  ],
  pacotes: [],
};

const opcaoExpresso: OpcaoFrete = {
  identificador: "frenet-expresso",
  provedor: "frenet",
  servico: "expresso",
  nome: "Expresso",
  tipo: "entrega",
  valorEmCentavos: 4200,
  metadados: {
    transportadora: "Transportadora Nuu",
  },
};

const opcaoEconomico: OpcaoFrete = {
  ...opcaoExpresso,
  identificador: "frenet-economico",
  servico: "economico",
  nome: "Economico",
};

const opcaoEntregaPropria: OpcaoFrete = {
  identificador: "entrega-propria",
  provedor: "entrega-propria",
  servico: "entrega-propria-atual",
  nome: "Entrega Propria",
  tipo: "entrega",
  valorEmCentavos: 1800,
};

const opcaoRetirada: OpcaoFrete = {
  identificador: "retirada",
  provedor: "retirada",
  servico: "retirada-atual",
  nome: "Retirada",
  tipo: "retirada",
  valorEmCentavos: 0,
};

const opcaoPac: OpcaoFrete = {
  identificador: "frenet-pac",
  provedor: "frenet",
  servico: "03298",
  nome: "PAC",
  tipo: "entrega",
  valorEmCentavos: 3200,
  metadados: {
    transportadora: "Correios",
  },
};

const opcaoSedex: OpcaoFrete = {
  identificador: "frenet-sedex",
  provedor: "frenet",
  servico: "03220",
  nome: "Sedex",
  tipo: "entrega",
  valorEmCentavos: 5400,
  metadados: {
    transportadora: "Correios",
  },
};

const opcaoJadlog: OpcaoFrete = {
  identificador: "frenet-jadlog",
  provedor: "frenet",
  servico: "f-3",
  nome: "Jadlog Package",
  tipo: "entrega",
  valorEmCentavos: 4500,
  metadados: {
    transportadora: "Jadlog",
  },
};

function criarConfiguracao(
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
        identificador: "transportadora-nuu",
        nome: "Transportadora Nuu",
        provedorIdentificador: "frenet",
        ativo: true,
      },
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
        identificador: "expresso",
        provedorIdentificador: "frenet",
        transportadoraIdentificador: "transportadora-nuu",
        ativo: true,
      },
      {
        identificador: "economico",
        provedorIdentificador: "frenet",
        transportadoraIdentificador: "transportadora-nuu",
        ativo: true,
      },
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

function filtrar(
  opcoes: OpcaoFrete[],
  configuracao: ConfiguracaoDisponibilidadeFrete,
) {
  return filtrarOpcoesFreteDisponiveis({
    opcoes,
    contextoProduto,
    volumes,
    configuracao,
  });
}

descrever("resolver disponibilidade profissional de frete", () => {
  verificar("produto permite servico especifico", () => {
    const opcoes = filtrar(
      [opcaoExpresso, opcaoEconomico],
      criarConfiguracao({
        regrasProdutos: [
          {
            produtoId: contextoProduto.produtoId,
            efeito: "permitir",
            provedorIdentificador: "frenet",
            servicoIdentificador: "expresso",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(
      opcoes.map((opcao) => opcao.servico),
      ["expresso"],
    );
  });

  verificar("produto bloqueia servico especifico", () => {
    const opcoes = filtrar(
      [opcaoExpresso, opcaoEconomico],
      criarConfiguracao({
        regrasProdutos: [
          {
            produtoId: contextoProduto.produtoId,
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            servicoIdentificador: "expresso",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(
      opcoes.map((opcao) => opcao.servico),
      ["economico"],
    );
  });

  verificar("categoria permite servico", () => {
    const opcoes = filtrar(
      [opcaoExpresso, opcaoEconomico],
      criarConfiguracao({
        regrasCategorias: [
          {
            categoriaId: "categoria-quarto",
            efeito: "permitir",
            provedorIdentificador: "frenet",
            servicoIdentificador: "economico",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(
      opcoes.map((opcao) => opcao.servico),
      ["economico"],
    );
  });

  verificar("categoria bloqueia servico", () => {
    const opcoes = filtrar(
      [opcaoExpresso, opcaoEconomico],
      criarConfiguracao({
        regrasCategorias: [
          {
            categoriaId: "categoria-quarto",
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            servicoIdentificador: "economico",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(
      opcoes.map((opcao) => opcao.servico),
      ["expresso"],
    );
  });

  verificar("categoria colchoes bloqueia PAC e mantem SEDEX e Jadlog", () => {
    const opcoes = filtrar(
      [opcaoPac, opcaoSedex, opcaoJadlog],
      criarConfiguracao({
        regrasCategorias: [
          {
            categoriaId: "categoria-quarto",
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            servicoIdentificador: "03298",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(
      opcoes.map((opcao) => opcao.nome),
      ["Sedex", "Jadlog Package"],
    );
  });

  verificar("produto sobrescreve categoria", () => {
    const opcoes = filtrar(
      [opcaoExpresso],
      criarConfiguracao({
        regrasCategorias: [
          {
            categoriaId: "categoria-quarto",
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            servicoIdentificador: "expresso",
          },
        ],
        regrasProdutos: [
          {
            produtoId: contextoProduto.produtoId,
            efeito: "permitir",
            provedorIdentificador: "frenet",
            servicoIdentificador: "expresso",
          },
        ],
      }),
    );

    afirmacoes.equal(opcoes.length, 1);
  });

  verificar("bloqueio vence permissao no mesmo nivel", () => {
    const opcoes = filtrar(
      [opcaoExpresso],
      criarConfiguracao({
        regrasProdutos: [
          {
            produtoId: contextoProduto.produtoId,
            efeito: "permitir",
            provedorIdentificador: "frenet",
            servicoIdentificador: "expresso",
          },
          {
            produtoId: contextoProduto.produtoId,
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            servicoIdentificador: "expresso",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(opcoes, []);
  });

  verificar("limite de peso bloqueia", () => {
    const resultado = resolverDisponibilidadeOpcaoFrete({
      opcao: opcaoExpresso,
      contextoProduto,
      volumes,
      configuracao: criarConfiguracao({
        transportadoras: [
          {
            identificador: "transportadora-nuu",
            nome: "Transportadora Nuu",
            provedorIdentificador: "frenet",
            ativo: true,
            pesoMaximoEmGramas: 6000,
          },
        ],
      }),
    });

    afirmacoes.equal(resultado.disponivel, false);
    afirmacoes.equal(resultado.motivo, "limite-global-peso");
  });

  verificar("limite de dimensoes bloqueia", () => {
    const resultado = resolverDisponibilidadeOpcaoFrete({
      opcao: opcaoExpresso,
      contextoProduto,
      volumes,
      configuracao: criarConfiguracao({
        servicos: [
          {
            identificador: "expresso",
            provedorIdentificador: "frenet",
            transportadoraIdentificador: "transportadora-nuu",
            ativo: true,
            comprimentoMaximoEmCm: 120,
          },
        ],
      }),
    });

    afirmacoes.equal(resultado.disponivel, false);
    afirmacoes.equal(resultado.motivo, "limite-global-dimensoes");
  });

  verificar("tipo logistico bloqueia servico", () => {
    const opcoes = filtrar(
      [opcaoExpresso, opcaoEconomico],
      criarConfiguracao({
        regrasTiposLogisticos: [
          {
            tipoLogisticoIdentificador: "fragil",
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            servicoIdentificador: "economico",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(
      opcoes.map((opcao) => opcao.servico),
      ["expresso"],
    );
  });

  verificar("produto tem precedencia sobre classificacao e categoria", () => {
    const opcoes = filtrar(
      [opcaoExpresso, opcaoEconomico],
      criarConfiguracao({
        regrasCategorias: [
          {
            categoriaId: "categoria-quarto",
            efeito: "permitir",
            provedorIdentificador: "frenet",
            servicoIdentificador: "economico",
          },
        ],
        regrasProdutos: [
          {
            produtoId: contextoProduto.produtoId,
            efeito: "permitir",
            provedorIdentificador: "frenet",
            servicoIdentificador: "expresso",
          },
        ],
        regrasTiposLogisticos: [
          {
            tipoLogisticoIdentificador: "fragil",
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            servicoIdentificador: "expresso",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(
      opcoes.map((opcao) => opcao.servico),
      ["expresso"],
    );
  });

  verificar("classificacao tem precedencia sobre categoria", () => {
    const opcoes = filtrar(
      [opcaoExpresso],
      criarConfiguracao({
        regrasCategorias: [
          {
            categoriaId: "categoria-quarto",
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            servicoIdentificador: "expresso",
          },
        ],
        regrasTiposLogisticos: [
          {
            tipoLogisticoIdentificador: "fragil",
            efeito: "permitir",
            provedorIdentificador: "frenet",
            servicoIdentificador: "expresso",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(opcoes, [opcaoExpresso]);
  });

  verificar("classificacao produto pesado permite somente Jadlog", () => {
    const opcoes = filtrar(
      [opcaoPac, opcaoSedex, opcaoJadlog],
      criarConfiguracao({
        regrasCategorias: [
          {
            categoriaId: "categoria-quarto",
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            servicoIdentificador: "03298",
          },
        ],
        regrasTiposLogisticos: [
          {
            tipoLogisticoIdentificador: "fragil",
            efeito: "permitir",
            provedorIdentificador: "frenet",
            servicoIdentificador: "f-3",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(
      opcoes.map((opcao) => opcao.nome),
      ["Jadlog Package"],
    );
  });

  verificar("produto especifico vence classificacao e categoria", () => {
    const opcoes = filtrar(
      [opcaoPac, opcaoSedex, opcaoJadlog],
      criarConfiguracao({
        regrasCategorias: [
          {
            categoriaId: "categoria-quarto",
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            servicoIdentificador: "03298",
          },
        ],
        regrasTiposLogisticos: [
          {
            tipoLogisticoIdentificador: "fragil",
            efeito: "permitir",
            provedorIdentificador: "frenet",
            servicoIdentificador: "f-3",
          },
        ],
        regrasProdutos: [
          {
            produtoId: contextoProduto.produtoId,
            efeito: "permitir",
            provedorIdentificador: "frenet",
            servicoIdentificador: "03298",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(
      opcoes.map((opcao) => opcao.nome),
      ["PAC"],
    );
  });

  verificar("classificacao bloqueia transportadora", () => {
    const opcoes = filtrar(
      [opcaoExpresso],
      criarConfiguracao({
        regrasTiposLogisticos: [
          {
            tipoLogisticoIdentificador: "fragil",
            efeito: "bloquear",
            provedorIdentificador: "frenet",
            transportadoraIdentificador: "transportadora-nuu",
          },
        ],
      }),
    );

    afirmacoes.deepEqual(opcoes, []);
  });

  verificar(
    "classificacao de retirada apenas oculta transporte externo",
    () => {
      const opcoes = filtrar(
        [opcaoExpresso, opcaoRetirada],
        criarConfiguracao({
          regrasTiposLogisticos: [
            {
              tipoLogisticoIdentificador: "fragil",
              efeito: "bloquear",
              provedorIdentificador: "frenet",
            },
          ],
        }),
      );

      afirmacoes.deepEqual(opcoes, [opcaoRetirada]);
    },
  );

  verificar("servico Frenet desconhecido nao quebra e fica permitido", () => {
    const resultado = resolverDisponibilidadeOpcaoFrete({
      opcao: {
        ...opcaoExpresso,
        servico: "servico-novo",
      },
      contextoProduto,
      volumes,
      configuracao: criarConfiguracao({
        regrasCategorias: [
          {
            categoriaId: "categoria-quarto",
            efeito: "permitir",
            provedorIdentificador: "frenet",
            servicoIdentificador: "expresso",
          },
        ],
      }),
    });

    afirmacoes.equal(resultado.disponivel, true);
    afirmacoes.equal(resultado.servicoConhecido, false);
  });

  verificar("preserva entrega propria", () => {
    const opcoes = filtrar([opcaoEntregaPropria], criarConfiguracao());

    afirmacoes.deepEqual(opcoes, [opcaoEntregaPropria]);
  });

  verificar("preserva retirada", () => {
    const opcoes = filtrar([opcaoRetirada], criarConfiguracao());

    afirmacoes.deepEqual(opcoes, [opcaoRetirada]);
  });
});
