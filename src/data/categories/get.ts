import "server-only";

import { isNull } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/connection";
import { categoryTable } from "@/db/table/categories/categories";

const CODIGOS_TRANSITORIOS = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "ENETUNREACH",
  "UND_ERR_CONNECT_TIMEOUT",
]);

function diagnosticarErro(erro: unknown) {
  const mensagens: string[] = [];
  const codigos: string[] = [];
  const visitados = new Set<unknown>();
  let atual = erro;

  while (atual instanceof Error && !visitados.has(atual)) {
    visitados.add(atual);
    mensagens.push(atual.message.split("\n", 1)[0]?.slice(0, 160) ?? "");
    const codigo = (atual as Error & { code?: unknown }).code;
    if (typeof codigo === "string") codigos.push(codigo);
    atual = (atual as Error & { cause?: unknown }).cause;
  }

  const assinatura =
    `${mensagens.join(" ")} ${codigos.join(" ")}`.toLowerCase();
  return {
    codigo: codigos[0],
    transitorio:
      codigos.some((codigo) => CODIGOS_TRANSITORIOS.has(codigo)) ||
      [
        "fetch failed",
        "error connecting to database",
        "connection timeout",
        "network error",
      ].some((sinal) => assinatura.includes(sinal)),
  };
}

async function consultarCategoriasRaiz() {
  return db
    .select()
    .from(categoryTable)
    .where(isNull(categoryTable.parentId))
    .orderBy(categoryTable.orderIndex);
}

/**
 * Consulta compartilhada no request pelo React.cache. Falhas transitórias do
 * Neon são repetidas antes de usar o fallback vazio da navegação da loja.
 */
export const getCategories = cache(async () => {
  const maximoTentativas = 3;

  for (let tentativa = 1; tentativa <= maximoTentativas; tentativa += 1) {
    try {
      return await consultarCategoriasRaiz();
    } catch (erro) {
      const diagnostico = diagnosticarErro(erro);
      const repetira = diagnostico.transitorio && tentativa < maximoTentativas;

      if (repetira) {
        console.warn("[categorias:loja:tentativa-transitoria]", {
          tentativa,
          repetira: true,
          codigo: diagnostico.codigo,
        });
        await new Promise<void>((resolver) =>
          setTimeout(resolver, tentativa * 200),
        );
        continue;
      }

      // Categorias são auxiliares para a navegação. O erro permanece
      // observável no servidor, sem gerar overlay para uma falha já tratada.
      console.warn("[categorias:loja:indisponivel]", {
        tentativas: tentativa,
        transitorio: diagnostico.transitorio,
        codigo: diagnostico.codigo,
      });
      return [];
    }
  }

  return [];
});
