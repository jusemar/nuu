import "server-only";

import {
  ARMAZENAR_RESPOSTAS_NA_OPENAI,
  MODELO_ESCALONAMENTO_ATENDENTE_IA,
  MODELO_PRINCIPAL_ATENDENTE_IA,
} from "../constants/configuracao-atendente";
import { configuracaoAtendenteIaAmbienteSchema } from "../schemas/configuracao-atendente.schema";
import { configuracaoContextoSchema } from "../schemas/configuracao-contexto.schema";
import { configuracaoFerramentasProtegidasSchema } from "../schemas/configuracao-ferramentas-protegidas.schema";
import { configuracaoRagSchema } from "../schemas/configuracao-rag.schema";
import { configuracaoSegurancaObservabilidadeSchema } from "../schemas/configuracao-seguranca-observabilidade.schema";
import { configuracaoTransferenciaHumanaSchema } from "../schemas/transferencia-humana.schema";

export function obterConfiguracaoAtendenteIa() {
  const flags = configuracaoAtendenteIaAmbienteSchema.parse(process.env);
  const contexto = configuracaoContextoSchema.parse(process.env);
  const rag = configuracaoRagSchema.parse(process.env);
  const ferramentasProtegidas = configuracaoFerramentasProtegidasSchema.parse(process.env);
  const transferenciaHumana = configuracaoTransferenciaHumanaSchema.parse(process.env);
  const segurancaObservabilidade = configuracaoSegurancaObservabilidadeSchema.parse(process.env);

  return {
    ...flags,
    ...contexto,
    ...rag,
    ...ferramentasProtegidas,
    ...transferenciaHumana,
    ...segurancaObservabilidade,
    modeloPrincipal: MODELO_PRINCIPAL_ATENDENTE_IA,
    modeloEscalonamento: MODELO_ESCALONAMENTO_ATENDENTE_IA,
    armazenarRespostasNaOpenAi: ARMAZENAR_RESPOSTAS_NA_OPENAI,
  } as const;
}
