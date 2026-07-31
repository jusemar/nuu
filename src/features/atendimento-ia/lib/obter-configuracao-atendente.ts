import "server-only";

import {
  ARMAZENAR_RESPOSTAS_NA_OPENAI,
  MODELO_ESCALONAMENTO_ATENDENTE_IA,
  MODELO_PRINCIPAL_ATENDENTE_IA,
} from "../constants/configuracao-atendente";
import { configuracaoAtendenteIaAmbienteSchema } from "../schemas/configuracao-atendente.schema";

export function obterConfiguracaoAtendenteIa() {
  const flags = configuracaoAtendenteIaAmbienteSchema.parse(process.env);

  return {
    ...flags,
    modeloPrincipal: MODELO_PRINCIPAL_ATENDENTE_IA,
    modeloEscalonamento: MODELO_ESCALONAMENTO_ATENDENTE_IA,
    armazenarRespostasNaOpenAi: ARMAZENAR_RESPOSTAS_NA_OPENAI,
  } as const;
}
