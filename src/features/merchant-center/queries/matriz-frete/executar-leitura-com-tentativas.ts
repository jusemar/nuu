import "server-only";

function possuiFalhaTransitóriaDeConexão(erro: unknown): boolean {
  let atual = erro;
  for (let nivel = 0; nivel < 6 && atual instanceof Error; nivel += 1) {
    if (/fetch failed|error connecting to database/i.test(atual.message)) {
      return true;
    }
    atual = (atual as Error & { cause?: unknown }).cause;
  }
  return false;
}

/** Repete apenas leituras após falha transitória do transporte HTTP do Neon. */
export async function executarLeituraComTentativas<T>(
  leitura: () => Promise<T>,
  maximoTentativas = 3,
): Promise<T> {
  let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= maximoTentativas; tentativa += 1) {
    try {
      return await leitura();
    } catch (erro) {
      ultimoErro = erro;
      if (
        !possuiFalhaTransitóriaDeConexão(erro) ||
        tentativa === maximoTentativas
      ) {
        throw erro;
      }
      await new Promise((resolver) => setTimeout(resolver, tentativa * 500));
    }
  }
  throw ultimoErro;
}
