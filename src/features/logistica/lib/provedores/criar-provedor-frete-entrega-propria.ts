import type {
  OpcaoFrete,
  ProvedorFrete,
  SolicitacaoCotacaoFrete,
} from "../../types/contratos-frete";
import { validarOpcoesFrete } from "./validar-opcoes-frete";

export type DependenciasProvedorFreteEntregaPropria = {
  listarOpcoesEntregaPropria: (
    solicitacao: SolicitacaoCotacaoFrete,
  ) => Promise<OpcaoFrete[]>;
};

export type ConfiguracaoProvedorFreteEntregaPropria = {
  ativo?: boolean;
};

export type ProvedorFreteEntregaPropria = ProvedorFrete;

export function criarProvedorFreteEntregaPropria(
  dependencias: DependenciasProvedorFreteEntregaPropria,
  configuracao: ConfiguracaoProvedorFreteEntregaPropria = {},
): ProvedorFreteEntregaPropria {
  return {
    identificador: "entrega-propria",
    nome: "Entrega Propria",
    ativo: configuracao.ativo ?? true,
    async cotarFrete(solicitacao) {
      if (!(configuracao.ativo ?? true)) {
        return {
          sucesso: true,
          solicitacao,
          opcoes: [],
          avisos: ["O provedor de entrega propria esta inativo."],
        };
      }

      try {
        const opcoes =
          await dependencias.listarOpcoesEntregaPropria(solicitacao);
        const validacaoOpcoes = validarOpcoesFrete(opcoes);

        if (!validacaoOpcoes.valido) {
          return {
            sucesso: false,
            solicitacao,
            opcoes: [],
            erros: [
              {
                codigo: "opcoes-entrega-propria-invalidas",
                mensagem:
                  "A entrega propria retornou opcoes de frete invalidas.",
                provedor: "entrega-propria",
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
              codigo: "cotacao-entrega-propria-indisponivel",
              mensagem:
                "Nao foi possivel cotar a entrega propria nesta solicitacao.",
              provedor: "entrega-propria",
            },
          ],
        };
      }
    },
  };
}
