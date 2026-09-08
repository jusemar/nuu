import "server-only";

import { createHash } from "node:crypto";

const JANELA_MS = 10 * 60 * 1_000;
const MAXIMO_TENTATIVAS = 5;

type RegistroLimite = { inicio: number; tentativas: number };

const estadoGlobal = globalThis as typeof globalThis & {
  __limitesFormularioContato?: Map<string, RegistroLimite>;
};

const limites =
  estadoGlobal.__limitesFormularioContato ?? new Map<string, RegistroLimite>();
estadoGlobal.__limitesFormularioContato = limites;

function gerarChaveAnonima(enderecoIp: string) {
  const segredo = process.env.TURNSTILE_SECRET_KEY ?? "contato";
  return createHash("sha256").update(`${segredo}:${enderecoIp}`).digest("hex");
}

/**
 * Limite local por instância, suficiente para conter rajadas e complementado
 * pelo desafio do Turnstile, que realiza a proteção distribuída.
 */
export function consumirTentativaContato(
  enderecoIp: string,
  agora = Date.now(),
) {
  const chave = gerarChaveAnonima(enderecoIp);
  const registro = limites.get(chave);

  if (!registro || agora - registro.inicio >= JANELA_MS) {
    limites.set(chave, { inicio: agora, tentativas: 1 });
    return true;
  }

  if (registro.tentativas >= MAXIMO_TENTATIVAS) return false;

  registro.tentativas += 1;
  return true;
}
