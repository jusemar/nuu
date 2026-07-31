import { createHash } from "node:crypto";

import { ZodError } from "zod";

import { TIMEOUT_FERRAMENTA_PUBLICA_EM_MS } from "../../constants/ferramentas-publicas";
import type {
  ExecutorFerramentasPublicas,
  FerramentaPublica,
  NomeFerramentaPublica,
  RepositorioExecucoesFerramentas,
  ResultadoFerramentaPublica,
} from "../../types/ferramentas-publicas";

function criarResultadoSemDados(
  status: ResultadoFerramentaPublica["status"],
): ResultadoFerramentaPublica {
  return {
    consultado_em: new Date().toISOString(),
    dados: null,
    fonte: "controle_ferramentas_atendimento_ia",
    status,
  };
}

function serializarDeterministicamente(valor: unknown): string {
  if (Array.isArray(valor)) {
    return `[${valor.map(serializarDeterministicamente).join(",")}]`;
  }
  if (valor && typeof valor === "object") {
    return `{${Object.entries(valor)
      .sort(([chaveA], [chaveB]) => chaveA.localeCompare(chaveB))
      .map(
        ([chave, item]) =>
          `${JSON.stringify(chave)}:${serializarDeterministicamente(item)}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(valor);
}

function criarChaveIdempotencia(
  execucaoId: string,
  ferramenta: FerramentaPublica,
  argumentos: Record<string, unknown>,
) {
  return createHash("sha256")
    .update(
      `${execucaoId}:${ferramenta.definicao.name}:${ferramenta.versao}:${serializarDeterministicamente(argumentos)}`,
    )
    .digest("hex");
}

function sanitizarArgumentosPersistencia(
  argumentos: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(argumentos).map(([chave, valor]) => [
      chave,
      chave === "cep" ? "[omitido]" : valor,
    ]),
  );
}

export function criarExecutorFerramentasPublicas(dependencias: {
  catalogo: Map<NomeFerramentaPublica, FerramentaPublica>;
  repositorio: RepositorioExecucoesFerramentas;
}): ExecutorFerramentasPublicas {
  return {
    async executar({ argumentosJson, chamadaId, execucaoId, nome }) {
      const ferramenta = dependencias.catalogo.get(
        nome as NomeFerramentaPublica,
      );
      if (!ferramenta) {
        return criarResultadoSemDados("ferramenta_nao_autorizada");
      }

      let argumentosBrutos: unknown;
      try {
        argumentosBrutos = JSON.parse(argumentosJson);
      } catch {
        return criarResultadoSemDados("argumento_invalido");
      }
      const validacao = ferramenta.schemaArgumentos.safeParse(argumentosBrutos);
      if (!validacao.success) {
        return criarResultadoSemDados("argumento_invalido");
      }
      const argumentos = validacao.data as Record<string, unknown>;
      const reivindicacao = await dependencias.repositorio.reivindicar({
        argumentos: sanitizarArgumentosPersistencia(argumentos),
        chamadaId,
        chaveIdempotencia: criarChaveIdempotencia(
          execucaoId,
          ferramenta,
          argumentos,
        ),
        execucaoId,
        nome: ferramenta.definicao.name,
        versao: ferramenta.versao,
      });
      if (reivindicacao.tipo === "concluida") return reivindicacao.resultado;
      if (reivindicacao.tipo === "em_processamento") {
        return criarResultadoSemDados("falha_recuperavel");
      }

      const inicio = Date.now();
      try {
        const retorno = await Promise.race([
          ferramenta.executar(argumentos),
          new Promise<never>((_, rejeitar) => {
            const temporizador = setTimeout(
              () => rejeitar(new Error("TIMEOUT_FERRAMENTA_PUBLICA")),
              TIMEOUT_FERRAMENTA_PUBLICA_EM_MS,
            );
            temporizador.unref();
          }),
        ]);
        const resultado = ferramenta.schemaResultado.parse(
          retorno,
        ) as ResultadoFerramentaPublica;
        await dependencias.repositorio.concluir({
          duracaoEmMs: Date.now() - inicio,
          execucaoFerramentaId: reivindicacao.execucaoFerramentaId,
          resultado,
        });
        return resultado;
      } catch (erro) {
        const argumentoInvalido = erro instanceof ZodError;
        await dependencias.repositorio.falhar({
          classificacao: argumentoInvalido ? "definitiva" : "recuperavel",
          execucaoFerramentaId: reivindicacao.execucaoFerramentaId,
          tipo: argumentoInvalido ? "erro_interno" : "ferramenta_indisponivel",
        });
        return criarResultadoSemDados(
          argumentoInvalido ? "falha_definitiva" : "falha_recuperavel",
        );
      }
    },
  };
}
