import { mascararDadosPessoaisAdmin } from "../sanitizacao/mascarar-dados-pessoais-admin";

const PADROES_SENSIVEIS =
  /(?:prompt|racioc[ií]nio|payload|sess[aã]o|token|senha|api[_ -]?key)/gi;
const CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

export function prepararEvidenciaSanitizada(descricao: string) {
  const semCamposSensíveis = descricao
    .replace(PADROES_SENSIVEIS, "[REMOVIDO]")
    .replace(CPF, "***.***.***-**");
  return mascararDadosPessoaisAdmin(semCamposSensíveis, 1_000);
}
