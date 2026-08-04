const CHAVES_SENSIVEIS =
  /authorization|cookie|senha|password|token|secret|api.?key|prompt|raciocinio|argumentos|payload|conteudo|email|telefone|cpf/i;

export function sanitizarLogAdministrativo(
  entrada: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entrada).flatMap(([chave, valor]) => {
      if (CHAVES_SENSIVEIS.test(chave)) return [];
      if (valor && typeof valor === "object" && !Array.isArray(valor)) {
        return [
          [chave, sanitizarLogAdministrativo(valor as Record<string, unknown>)],
        ];
      }
      if (typeof valor === "string")
        return [[chave, mascararDadosPessoaisAdmin(valor, 240)]];
      return [[chave, valor]];
    }),
  );
}
import { mascararDadosPessoaisAdmin } from "../sanitizacao/mascarar-dados-pessoais-admin";
