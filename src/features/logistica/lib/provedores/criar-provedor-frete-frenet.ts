import type {
  ProvedorFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";
import { validarOpcoesFrete } from "./validar-opcoes-frete";
import {
  consultarCotacaoFrenet,
  ErroCotacaoFrenet,
  type FuncaoHttpFrenet,
  type ResultadoConsultaCotacaoFrenet,
} from "./frenet/consultar-cotacao-frenet";
import {
  registrarEventoFrenet,
  type EventoFrenet,
} from "./frenet/registrar-evento-frenet";

export type ConfiguracaoProvedorFreteFrenet = {
  ativo?: boolean;
  token: string;
  cepOrigem: string;
  urlCotacao: string;
  timeoutEmMs: number;
  ambiente: "teste" | "producao";
};

export type DependenciasProvedorFreteFrenet = {
  consultarCotacao?: (
    solicitacao: SolicitacaoCotacaoFrete,
    configuracao: ConfiguracaoProvedorFreteFrenet,
  ) => Promise<ResultadoConsultaCotacaoFrenet>;
  funcaoHttp?: FuncaoHttpFrenet;
  registrarEvento?: (evento: EventoFrenet) => void;
};

export type ProvedorFreteFrenet = ProvedorFrete;

function criarErroCotacaoFrenet(erro: unknown) {
  if (erro instanceof ErroCotacaoFrenet) {
    return {
      codigo: erro.codigo,
      mensagem: erro.message,
      provedor: "frenet",
    };
  }

  return {
    codigo: "cotacao-frenet-indisponivel",
    mensagem: "Nao foi possivel cotar a Frenet nesta solicitacao.",
    provedor: "frenet",
  };
}

function obterTipoEventoFrenet(erro: unknown): EventoFrenet["tipo"] {
  if (erro instanceof ErroCotacaoFrenet) {
    if (erro.codigo === "cotacao-frenet-timeout") {
      return "timeout";
    }

    if (erro.codigo === "resposta-frenet-invalida") {
      return "resposta-invalida";
    }
  }

  return "erro-api";
}

export function criarProvedorFreteFrenet(
  configuracao: ConfiguracaoProvedorFreteFrenet,
  dependencias: DependenciasProvedorFreteFrenet = {},
): ProvedorFreteFrenet {
  const consultarCotacao =
    dependencias.consultarCotacao ??
    ((solicitacao, configuracaoAtual) =>
      consultarCotacaoFrenet(
        solicitacao,
        configuracaoAtual,
        dependencias.funcaoHttp,
      ));
  const registrarEvento = dependencias.registrarEvento ?? registrarEventoFrenet;

  return {
    identificador: "frenet",
    nome: "Frenet",
    ativo: configuracao.ativo ?? true,
    async cotarFrete(solicitacao) {
      if (!(configuracao.ativo ?? true)) {
        return {
          sucesso: true,
          solicitacao,
          opcoes: [],
          avisos: ["O provedor Frenet esta inativo."],
        };
      }

      try {
        const resultado = await consultarCotacao(solicitacao, configuracao);
        const validacaoOpcoes = validarOpcoesFrete(resultado.opcoes);

        if (!validacaoOpcoes.valido) {
          registrarEvento({
            tipo: "resposta-invalida",
            cotacaoId: solicitacao.identificador,
            mensagem: "A Frenet retornou opcoes invalidas.",
          });

          return {
            sucesso: false,
            solicitacao,
            opcoes: [],
            erros: [
              {
                codigo: "opcoes-frenet-invalidas",
                mensagem: "A Frenet retornou opcoes de frete invalidas.",
                provedor: "frenet",
              },
            ],
          };
        }

        return {
          sucesso: true,
          solicitacao,
          opcoes: validacaoOpcoes.opcoes,
          avisos: resultado.avisos,
        };
      } catch (erro) {
        const erroCotacao = criarErroCotacaoFrenet(erro);

        registrarEvento({
          tipo: obterTipoEventoFrenet(erro),
          cotacaoId: solicitacao.identificador,
          mensagem: erroCotacao.mensagem,
        });

        return {
          sucesso: false,
          solicitacao,
          opcoes: [],
          erros: [erroCotacao],
        };
      }
    },
  };
}
