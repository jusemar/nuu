import { esquemaOpcaoFrete } from "../../schemas/contratos-frete";
import type { OpcaoFrete } from "../../types/contratos-frete";

export type ResultadoValidacaoOpcoesFrete =
  | {
      valido: true;
      opcoes: OpcaoFrete[];
    }
  | {
      valido: false;
    };

export function validarOpcoesFrete(
  opcoes: unknown,
): ResultadoValidacaoOpcoesFrete {
  const validacao = esquemaOpcaoFrete.array().safeParse(opcoes);

  if (!validacao.success) {
    return {
      valido: false,
    };
  }

  return {
    valido: true,
    opcoes: validacao.data,
  };
}
