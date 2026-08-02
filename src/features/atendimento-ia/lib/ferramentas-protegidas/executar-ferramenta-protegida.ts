import { createHash } from "node:crypto";

import type {
  FerramentaProtegida,
  ResolvedorSessaoFerramenta,
  ResultadoFerramentaProtegida,
} from "../../types/ferramentas-protegidas";
import type { ExecutorFerramentasPublicas, RepositorioExecucoesFerramentas } from "../../types/ferramentas-publicas";

function resultado(status: ResultadoFerramentaProtegida["status"]): ResultadoFerramentaProtegida {
  return { dados: null, status };
}

function serializar(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(serializar).join(",")}]`;
  if (valor && typeof valor === "object") {
    return `{${Object.entries(valor).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${serializar(v)}`).join(",")}}`;
  }
  return JSON.stringify(valor);
}

function hash(...partes: string[]) {
  return createHash("sha256").update(partes.join(":"), "utf8").digest("hex");
}

function argumentosAuditaveis(argumentos: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(argumentos).map(([chave, valor]) => [
    chave,
    chave.includes("referencia") ? hash(String(valor)) : valor,
  ]));
}

/** Executa somente ferramentas explicitamente habilitadas no registro oficial. */
export function criarExecutorFerramentasProtegidas(dependencias: {
  catalogo: Map<string, FerramentaProtegida>;
  repositorio: RepositorioExecucoesFerramentas;
  resolvedorSessao: ResolvedorSessaoFerramenta;
}): ExecutorFerramentasPublicas {
  return {
    async executar(dados) {
      const ferramenta = dependencias.catalogo.get(dados.nome);
      if (!ferramenta || !ferramenta.habilitada || !ferramenta.handler) {
        return resultado("bloqueada");
      }
      if (ferramenta.nivel !== "autenticada" || !dados.contextoSeguro) {
        return resultado(ferramenta.nivel === "confirmada" ? "confirmacao_necessaria" : "bloqueada");
      }
      let bruto: unknown;
      try {
        bruto = JSON.parse(dados.argumentosJson);
      } catch {
        return resultado("bloqueada");
      }
      const entrada = ferramenta.schemaArgumentos.safeParse(bruto);
      if (!entrada.success) return resultado("bloqueada");
      const sessao = await dependencias.resolvedorSessao.resolver(dados.contextoSeguro);
      if (!sessao) return resultado("autenticacao_necessaria");
      if (sessao.expiraEm <= new Date()) return resultado("autenticacao_necessaria");
      if (
        !dados.contextoSeguro.usuarioIdEsperado ||
        sessao.usuarioId !== dados.contextoSeguro.usuarioIdEsperado
      ) {
        return resultado("nao_autorizada");
      }
      const argumentos = entrada.data as Record<string, unknown>;
      const reivindicacao = await dependencias.repositorio.reivindicar({
        argumentos: argumentosAuditaveis(argumentos),
        chamadaId: dados.chamadaId,
        chaveIdempotencia: hash(dados.execucaoId, ferramenta.id, ferramenta.versao, serializar(argumentos)),
        classificacao: "consulta_protegida",
        execucaoId: dados.execucaoId,
        nome: ferramenta.id,
        versao: ferramenta.versao,
      });
      if (reivindicacao.tipo === "concluida") return reivindicacao.resultado;
      if (reivindicacao.tipo === "em_processamento") return resultado("indisponivel");
      const inicio = Date.now();
      try {
        const retorno = ferramenta.schemaResultado.parse(await ferramenta.handler({
          argumentos,
          contexto: dados.contextoSeguro,
          sessao,
        })) as ResultadoFerramentaProtegida;
        await dependencias.repositorio.concluir({
          duracaoEmMs: Date.now() - inicio,
          execucaoFerramentaId: reivindicacao.execucaoFerramentaId,
          resultado: retorno,
        });
        return retorno;
      } catch {
        await dependencias.repositorio.falhar({
          classificacao: "recuperavel",
          execucaoFerramentaId: reivindicacao.execucaoFerramentaId,
          tipo: "ferramenta_indisponivel",
        });
        return resultado("indisponivel");
      }
    },
  };
}

export function combinarExecutoresFerramentas(
  publico: ExecutorFerramentasPublicas,
  protegido: ExecutorFerramentasPublicas,
  nomesProtegidos: ReadonlySet<string>,
): ExecutorFerramentasPublicas {
  return {
    executar(dados) {
      return nomesProtegidos.has(dados.nome)
        ? protegido.executar(dados)
        : publico.executar(dados);
    },
  };
}
