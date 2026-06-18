import type {
  MapeamentoColunaFornecedor,
  ResultadoParserFornecedor,
} from "../types/fornecedores.types";
import { lerPlanilhaFornecedor } from "./parser-planilha-fornecedor.service";

export function detectarColunasPlanilhaFornecedor(
  buffer: Buffer,
  opcoes: {
    mapeamentoSalvo?: MapeamentoColunaFornecedor[];
    mapeamentoConfirmado?: MapeamentoColunaFornecedor[];
  } = {},
): ResultadoParserFornecedor {
  return lerPlanilhaFornecedor(buffer, opcoes);
}
