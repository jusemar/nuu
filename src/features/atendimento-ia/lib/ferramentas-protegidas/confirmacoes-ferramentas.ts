import { createHash } from "node:crypto";

import type {
  ConfirmacaoFerramenta,
  RepositorioConfirmacoesFerramentas,
  VinculoOperacaoConfirmada,
} from "../../types/confirmacoes-ferramentas";
import type { ResultadoFerramentaProtegida } from "../../types/ferramentas-protegidas";

function serializar(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(serializar).join(",")}]`;
  if (valor && typeof valor === "object") {
    return `{${Object.entries(valor).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${serializar(v)}`).join(",")}}`;
  }
  return JSON.stringify(valor);
}

export function hashParametrosConfirmacao(vinculo: VinculoOperacaoConfirmada) {
  return createHash("sha256").update(serializar({
    acao: vinculo.acao,
    ferramenta: vinculo.ferramenta,
    parametros: vinculo.parametrosEssenciais,
    recursoId: vinculo.recursoId,
    recursoTipo: vinculo.recursoTipo,
  })).digest("hex");
}

export class ErroResultadoIncerto extends Error {}

/** Coordena confirmação sem conter regra comercial nem conceder autorização. */
export function criarGestorConfirmacoesFerramentas(dependencias: {
  agora?: () => Date;
  repositorio: RepositorioConfirmacoesFerramentas;
  validadeEmMs: number;
}) {
  const agora = dependencias.agora ?? (() => new Date());
  return {
    async solicitar(vinculo: VinculoOperacaoConfirmada) {
      const hashParametros = hashParametrosConfirmacao(vinculo);
      await dependencias.repositorio.expirar(agora());
      await dependencias.repositorio.invalidarDivergentes({ ...vinculo, hashParametros });
      const confirmacao = await dependencias.repositorio.criar({
        ...vinculo,
        expiraEm: new Date(agora().getTime() + dependencias.validadeEmMs),
        hashParametros,
      });
      await dependencias.repositorio.auditar("confirmacao_ferramenta_solicitada", {
        acao: vinculo.acao,
        confirmacaoId: confirmacao.id,
        conversaId: vinculo.conversaId,
        ferramenta: vinculo.ferramenta,
        referenciaSessaoHash: vinculo.referenciaSessaoHash,
        recursoTipo: vinculo.recursoTipo,
        usuarioId: vinculo.usuarioId,
      });
      return confirmacao;
    },

    async responder(dados: {
      conversaId: string;
      referenciaSessaoHash: string;
      resposta: string;
      usuarioId: string | null;
    }): Promise<ConfirmacaoFerramenta | null> {
      if (dados.resposta.trim().toLocaleLowerCase("pt-BR") !== "sim") return null;
      await dependencias.repositorio.expirar(agora());
      const confirmacao = await dependencias.repositorio.confirmarUnica({ ...dados, agora: agora() });
      await dependencias.repositorio.auditar(
        confirmacao ? "confirmacao_ferramenta_aceita" : "confirmacao_ferramenta_ambigua_ou_invalida",
        { confirmacaoId: confirmacao?.id ?? null, conversaId: dados.conversaId, referenciaSessaoHash: dados.referenciaSessaoHash, usuarioId: dados.usuarioId },
      );
      return confirmacao;
    },

    async cancelar(dados: { conversaId: string; usuarioId: string | null }) {
      const quantidade = await dependencias.repositorio.cancelarPendentes(dados);
      await dependencias.repositorio.auditar("confirmacao_ferramenta_cancelada", { ...dados, quantidade });
      return quantidade;
    },

    async executar(dados: {
      chaveIdempotencia: string;
      confirmacao: ConfirmacaoFerramenta;
      execucaoId: string;
      executarEfeito: () => Promise<ResultadoFerramentaProtegida>;
      revalidar: () => Promise<"autorizada" | "nao_autorizada" | "nao_elegivel">;
      vinculoAtual: VinculoOperacaoConfirmada;
    }): Promise<ResultadoFerramentaProtegida> {
      const instante = agora();
      if (hashParametrosConfirmacao(dados.vinculoAtual) !== dados.confirmacao.hashParametros) {
        return { dados: null, status: "confirmacao_invalida" };
      }
      const jaConsumida = dados.confirmacao.status === "consumida";
      if (!jaConsumida && dados.confirmacao.expiraEm <= instante) return { dados: null, status: "confirmacao_expirada" };
      if (!jaConsumida && dados.confirmacao.status !== "confirmada") return { dados: null, status: "confirmacao_invalida" };
      const autorizacao = await dados.revalidar();
      if (autorizacao !== "autorizada") return { dados: null, status: autorizacao };
      const operacao = await dependencias.repositorio.reivindicarOperacao({
        chaveIdempotencia: dados.chaveIdempotencia,
        confirmacao: dados.confirmacao,
        execucaoId: dados.execucaoId,
      });
      if (operacao.tipo === "concluida") {
        await dependencias.repositorio.auditar("operacao_protegida_repetida", {
          chaveIdempotencia: dados.chaveIdempotencia,
          confirmacaoId: dados.confirmacao.id,
          conversaId: dados.confirmacao.conversaId,
          repeticaoDetectada: true,
          resultado: "ja_executada",
        });
        return { ...operacao.resultado, status: "ja_executada" };
      }
      if (operacao.tipo === "resultado_incerto") {
        await dependencias.repositorio.auditar("operacao_protegida_repetida", {
          chaveIdempotencia: dados.chaveIdempotencia,
          confirmacaoId: dados.confirmacao.id,
          conversaId: dados.confirmacao.conversaId,
          repeticaoDetectada: true,
          resultado: "resultado_incerto",
        });
        return { dados: null, status: "resultado_incerto" };
      }
      if (operacao.tipo === "em_processamento") return { dados: null, status: "indisponivel" };
      if (jaConsumida) {
        await dependencias.repositorio.falharOperacao({ operacaoId: operacao.operacaoId, resultadoIncerto: false });
        return { dados: null, status: "confirmacao_invalida" };
      }
      const consumida = await dependencias.repositorio.consumir({
        agora: instante,
        confirmacaoId: dados.confirmacao.id,
        hashParametros: dados.confirmacao.hashParametros,
      });
      if (!consumida) return { dados: null, status: "confirmacao_invalida" };
      try {
        // A autorização precisa ser auditável antes de qualquer efeito. Se a
        // auditoria obrigatória estiver indisponível, a operação falha fechada.
        await dependencias.repositorio.auditar("operacao_protegida_autorizada", {
          acao: dados.confirmacao.acao,
          confirmacaoId: dados.confirmacao.id,
          conversaId: dados.confirmacao.conversaId,
          ferramenta: dados.confirmacao.ferramenta,
          hashParametros: dados.confirmacao.hashParametros,
          referenciaSessaoHash: dados.confirmacao.referenciaSessaoHash,
          usuarioId: dados.confirmacao.usuarioId,
        });
        const resultado = await dados.executarEfeito();
        await dependencias.repositorio.concluirOperacao({ operacaoId: operacao.operacaoId, resultado });
        await dependencias.repositorio.auditar("operacao_protegida_concluida", {
          chaveIdempotencia: dados.chaveIdempotencia,
          confirmacaoId: dados.confirmacao.id,
          conversaId: dados.confirmacao.conversaId,
          ferramenta: dados.confirmacao.ferramenta,
          repeticaoDetectada: false,
          resultado: resultado.status,
        });
        return resultado;
      } catch (erro) {
        const incerto = erro instanceof ErroResultadoIncerto;
        await dependencias.repositorio.falharOperacao({ operacaoId: operacao.operacaoId, resultadoIncerto: incerto });
        try {
          await dependencias.repositorio.auditar("operacao_protegida_falhou", {
            chaveIdempotencia: dados.chaveIdempotencia,
            confirmacaoId: dados.confirmacao.id,
            conversaId: dados.confirmacao.conversaId,
            resultado: incerto ? "resultado_incerto" : "falha_sem_execucao",
          });
        } catch {
          // A operação já foi marcada como falha e nenhum mecanismo alternativo
          // inseguro recebe dados. A indisponibilidade continua sem falso sucesso.
        }
        return { dados: null, status: incerto ? "resultado_incerto" : "falha_sem_execucao" };
      }
    },
  };
}
