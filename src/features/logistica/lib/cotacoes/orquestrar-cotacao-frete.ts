import {
  esquemaResultadoCotacaoFrete,
  esquemaSolicitacaoCotacaoFrete,
} from "../../schemas/contratos-frete";
import type {
  ErroCotacaoFrete,
  OpcaoFrete,
  ProvedorFrete,
  ResultadoCotacaoFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";

type ConsolidacaoProvedorFrete = {
  opcoes: OpcaoFrete[];
  erros: ErroCotacaoFrete[];
  avisos: string[];
};

function criarErroSolicitacaoInvalida(): ErroCotacaoFrete {
  return {
    codigo: "solicitacao-cotacao-invalida",
    mensagem: "A solicitacao de cotacao de frete e invalida.",
  };
}

function criarErroProvedorIndisponivel(
  provedor: ProvedorFrete,
): ErroCotacaoFrete {
  return {
    codigo: "provedor-frete-indisponivel",
    mensagem: `O provedor ${provedor.nome} nao concluiu a cotacao.`,
    provedor: provedor.identificador,
  };
}

function criarErroResultadoProvedorInvalido(
  provedor: ProvedorFrete,
): ErroCotacaoFrete {
  return {
    codigo: "resultado-provedor-frete-invalido",
    mensagem: `O provedor ${provedor.nome} retornou uma cotacao invalida.`,
    provedor: provedor.identificador,
  };
}

function criarAvisoProvedorInativo(provedor: ProvedorFrete): string {
  return `O provedor ${provedor.nome} esta inativo.`;
}

function criarAvisoProvedorSemOpcoes(provedor: ProvedorFrete): string {
  return `O provedor ${provedor.nome} nao retornou opcoes de frete.`;
}

async function cotarComProvedor(
  solicitacao: SolicitacaoCotacaoFrete,
  provedor: ProvedorFrete,
): Promise<ConsolidacaoProvedorFrete> {
  if (!provedor.ativo) {
    return {
      opcoes: [],
      erros: [],
      avisos: [criarAvisoProvedorInativo(provedor)],
    };
  }

  try {
    const resultado = await provedor.cotarFrete(solicitacao);
    const validacaoResultado =
      esquemaResultadoCotacaoFrete.safeParse(resultado);

    if (!validacaoResultado.success) {
      return {
        opcoes: [],
        erros: [criarErroResultadoProvedorInvalido(provedor)],
        avisos: [],
      };
    }

    const resultadoValidado = validacaoResultado.data as ResultadoCotacaoFrete;

    if (resultadoValidado.sucesso === false) {
      return {
        opcoes: resultadoValidado.opcoes,
        erros: resultadoValidado.erros,
        avisos: [],
      };
    }

    return {
      opcoes: resultadoValidado.opcoes,
      erros: [],
      avisos:
        resultadoValidado.opcoes.length === 0
          ? [...resultadoValidado.avisos, criarAvisoProvedorSemOpcoes(provedor)]
          : resultadoValidado.avisos,
    };
  } catch {
    return {
      opcoes: [],
      erros: [criarErroProvedorIndisponivel(provedor)],
      avisos: [],
    };
  }
}

export async function orquestrarCotacaoFrete(
  solicitacao: SolicitacaoCotacaoFrete,
  provedores: ProvedorFrete[],
): Promise<ResultadoCotacaoFrete> {
  const validacaoSolicitacao =
    esquemaSolicitacaoCotacaoFrete.safeParse(solicitacao);

  if (!validacaoSolicitacao.success) {
    return {
      sucesso: false,
      solicitacao,
      opcoes: [],
      erros: [criarErroSolicitacaoInvalida()],
    };
  }

  const solicitacaoValidada =
    validacaoSolicitacao.data as SolicitacaoCotacaoFrete;
  const cotacoes = await Promise.all(
    provedores.map((provedor) =>
      cotarComProvedor(solicitacaoValidada, provedor),
    ),
  );

  const consolidacao = cotacoes.reduce<ConsolidacaoProvedorFrete>(
    (resultado, cotacao) => ({
      opcoes: [...resultado.opcoes, ...cotacao.opcoes],
      erros: [...resultado.erros, ...cotacao.erros],
      avisos: [...resultado.avisos, ...cotacao.avisos],
    }),
    {
      opcoes: [],
      erros: [],
      avisos: [],
    },
  );

  if (consolidacao.erros.length > 0) {
    return {
      sucesso: false,
      solicitacao: solicitacaoValidada,
      opcoes: consolidacao.opcoes,
      erros: consolidacao.erros,
    };
  }

  return {
    sucesso: true,
    solicitacao: solicitacaoValidada,
    opcoes: consolidacao.opcoes,
    avisos: consolidacao.avisos,
  };
}
