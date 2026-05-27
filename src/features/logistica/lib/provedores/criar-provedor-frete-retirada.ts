import type {
  OpcaoFrete,
  ProvedorFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";
import { validarOpcoesFrete } from "./validar-opcoes-frete";

export type DependenciasProvedorFreteRetirada = {
  listarOpcoesRetirada: (
    solicitacao: SolicitacaoCotacaoFrete,
  ) => Promise<OpcaoFrete[]>;
};

export type ConfiguracaoProvedorFreteRetirada = {
  ativo?: boolean;
};

export type ProvedorFreteRetirada = ProvedorFrete;

export function criarProvedorFreteRetirada(
  dependencias: DependenciasProvedorFreteRetirada,
  configuracao: ConfiguracaoProvedorFreteRetirada = {},
): ProvedorFreteRetirada {
  return {
    identificador: "retirada",
    nome: "Retirada",
    ativo: configuracao.ativo ?? true,
    async cotarFrete(solicitacao) {
      if (!(configuracao.ativo ?? true)) {
        return {
          sucesso: true,
          solicitacao,
          opcoes: [],
          avisos: ["O provedor de retirada esta inativo."],
        };
      }

      try {
        const opcoes = await dependencias.listarOpcoesRetirada(solicitacao);
        const validacaoOpcoes = validarOpcoesFrete(opcoes);

        if (!validacaoOpcoes.valido) {
          return {
            sucesso: false,
            solicitacao,
            opcoes: [],
            erros: [
              {
                codigo: "opcoes-retirada-invalidas",
                mensagem: "A retirada retornou opcoes de frete invalidas.",
                provedor: "retirada",
              },
            ],
          };
        }

        return {
          sucesso: true,
          solicitacao,
          opcoes: validacaoOpcoes.opcoes,
          avisos: [],
        };
      } catch {
        return {
          sucesso: false,
          solicitacao,
          opcoes: [],
          erros: [
            {
              codigo: "cotacao-retirada-indisponivel",
              mensagem: "Nao foi possivel cotar a retirada nesta solicitacao.",
              provedor: "retirada",
            },
          ],
        };
      }
    },
  };
}
