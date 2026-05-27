import afirmacoes from "node:assert/strict";
import { describe as descrever, it as verificar } from "node:test";

import { orquestrarCotacaoFrete } from "../cotacoes/orquestrar-cotacao-frete";
import type {
  OpcaoFrete,
  ProvedorFrete,
  ResultadoCotacaoFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";

const solicitacao: SolicitacaoCotacaoFrete = {
  identificador: "cotacao-orquestrada",
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

const opcaoEntrega: OpcaoFrete = {
  identificador: "entrega-1",
  provedor: "entrega-propria",
  servico: "entrega-propria-atual",
  nome: "Entrega Propria",
  tipo: "entrega",
  valorEmCentavos: 1800,
};

const opcaoRetirada: OpcaoFrete = {
  identificador: "retirada-1",
  provedor: "retirada",
  servico: "retirada-atual",
  nome: "Retirada",
  tipo: "retirada",
  valorEmCentavos: 0,
};

function criarProvedorTeste(
  identificador: string,
  cotarFrete: ProvedorFrete["cotarFrete"],
): ProvedorFrete {
  return {
    identificador,
    nome: `Provedor ${identificador}`,
    ativo: true,
    cotarFrete,
  };
}

function criarResultadoComOpcoes(opcoes: OpcaoFrete[]): ResultadoCotacaoFrete {
  return {
    sucesso: true,
    solicitacao,
    opcoes,
    avisos: [],
  };
}

descrever("orquestrarCotacaoFrete", () => {
  verificar("cota solicitacao valida com um provedor", async () => {
    const resultado = await orquestrarCotacaoFrete(solicitacao, [
      criarProvedorTeste("entrega", async () =>
        criarResultadoComOpcoes([opcaoEntrega]),
      ),
    ]);

    afirmacoes.equal(resultado.sucesso, true);
    afirmacoes.deepEqual(resultado.opcoes, [opcaoEntrega]);
  });

  verificar("consulta multiplos provedores", async () => {
    const provedoresConsultados: string[] = [];
    const resultado = await orquestrarCotacaoFrete(solicitacao, [
      criarProvedorTeste("entrega", async () => {
        provedoresConsultados.push("entrega");
        return criarResultadoComOpcoes([opcaoEntrega]);
      }),
      criarProvedorTeste("retirada", async () => {
        provedoresConsultados.push("retirada");
        return criarResultadoComOpcoes([opcaoRetirada]);
      }),
    ]);

    afirmacoes.deepEqual(provedoresConsultados.sort(), ["entrega", "retirada"]);
    afirmacoes.equal(resultado.opcoes.length, 2);
  });

  verificar("avisa quando um provedor nao retorna opcoes", async () => {
    const resultado = await orquestrarCotacaoFrete(solicitacao, [
      criarProvedorTeste("sem-opcoes", async () => criarResultadoComOpcoes([])),
    ]);

    afirmacoes.equal(resultado.sucesso, true);

    if (!resultado.sucesso) return;

    afirmacoes.deepEqual(resultado.opcoes, []);
    afirmacoes.deepEqual(resultado.avisos, [
      "O provedor Provedor sem-opcoes nao retornou opcoes de frete.",
    ]);
  });

  verificar("consolida erro controlado de um provedor", async () => {
    const resultado = await orquestrarCotacaoFrete(solicitacao, [
      criarProvedorTeste("com-erro", async () => ({
        sucesso: false,
        solicitacao,
        opcoes: [],
        erros: [
          {
            codigo: "cep-nao-atendido",
            mensagem: "O destino nao e atendido.",
            provedor: "com-erro",
          },
        ],
      })),
    ]);

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(resultado.erros[0]?.codigo, "cep-nao-atendido");
  });

  verificar("nao quebra quando um provedor lanca excecao", async () => {
    const resultado = await orquestrarCotacaoFrete(solicitacao, [
      criarProvedorTeste("indisponivel", async () => {
        throw new Error("falha externa");
      }),
    ]);

    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(resultado.erros[0]?.codigo, "provedor-frete-indisponivel");
    afirmacoes.equal(resultado.erros[0]?.provedor, "indisponivel");
  });

  verificar("recusa solicitacao invalida antes de cotar", async () => {
    let quantidadeCotacoes = 0;
    const resultado = await orquestrarCotacaoFrete(
      {
        ...solicitacao,
        itens: [],
      },
      [
        criarProvedorTeste("nao-consultar", async () => {
          quantidadeCotacoes += 1;
          return criarResultadoComOpcoes([opcaoEntrega]);
        }),
      ],
    );

    afirmacoes.equal(quantidadeCotacoes, 0);
    afirmacoes.equal(resultado.sucesso, false);

    if (resultado.sucesso) return;

    afirmacoes.equal(
      resultado.erros[0]?.codigo,
      "solicitacao-cotacao-invalida",
    );
  });

  verificar("mantem opcoes validas quando outro provedor falha", async () => {
    const resultado = await orquestrarCotacaoFrete(solicitacao, [
      criarProvedorTeste("entrega", async () =>
        criarResultadoComOpcoes([opcaoEntrega]),
      ),
      criarProvedorTeste("retirada-indisponivel", async () => {
        throw new Error("falha");
      }),
    ]);

    afirmacoes.equal(resultado.sucesso, false);
    afirmacoes.deepEqual(resultado.opcoes, [opcaoEntrega]);
  });
});
