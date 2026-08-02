import { createHash } from "node:crypto";

import type { ConfiguracaoContexto } from "../types/contexto";
import type { ContextoPersistidoOrquestrador } from "../types/orquestrador";
import type { GeradorResumoContexto, RepositorioResumoContexto } from "../types/resumo";
import {
  calcularHashMensagens,
  decidirResumo,
  resumoEhValido,
} from "./contexto-controlado";

export async function manterResumoContexto(
  dependencias: {
    configuracao: ConfiguracaoContexto;
    gerador: GeradorResumoContexto;
    repositorio: RepositorioResumoContexto;
  },
  dados: { contexto: ContextoPersistidoOrquestrador; execucaoId: string },
) {
  const existente = await dependencias.repositorio.buscarResumoPorExecucao(
    dados.execucaoId,
  );
  if (existente) return { ...dados.contexto, resumo: existente };
  const contextoSeguro =
    dados.contexto.resumo && !resumoEhValido(dados.contexto)
      ? { ...dados.contexto, resumo: null }
      : dados.contexto;
  const decisao = decidirResumo(contextoSeguro, dependencias.configuracao);
  if (decisao.tipo === "nao_gerar") return contextoSeguro;
  const consideradas =
    decisao.tipo === "atualizar"
      ? [...contextoSeguro.mensagensAnteriores]
      : decisao.mensagens;
  if (consideradas.length === 0) return dados.contexto;
  try {
    const gerado = await dependencias.gerador.gerar({
      identificadorSeguranca: createHash("sha256")
        .update(
          contextoSeguro.conversa.usuarioId ??
            contextoSeguro.conversa.identificadorSessao,
        )
        .digest("hex"),
      mensagens: decisao.mensagens,
      resumoAnterior: contextoSeguro.resumo,
    });
    const resumo = await dependencias.repositorio.persistirResumo({
      ateMensagemId: consideradas.at(-1)!.id,
      conteudo: gerado.conteudo,
      conversaId: contextoSeguro.conversa.id,
      execucaoId: dados.execucaoId,
      hashConteudoConsiderado: calcularHashMensagens(consideradas),
      quantidadeMensagens: consideradas.length,
      resumoAnteriorVersao: contextoSeguro.resumo?.versao ?? null,
      resumoEstruturado: gerado.resumoEstruturado,
    });
    if (!resumo) throw new Error("RESUMO_NAO_PERSISTIDO");
    await dependencias.repositorio.registrarAuditoriaResumo({
      conversaId: contextoSeguro.conversa.id,
      duracaoEmMs: gerado.duracaoEmMs,
      execucaoId: dados.execucaoId,
      status: "concluida",
      tokensEntrada: gerado.tokensEntrada,
      tokensSaida: gerado.tokensSaida,
      versao: resumo.versao,
    });
    return { ...contextoSeguro, resumo };
  } catch {
    await dependencias.repositorio
      .registrarAuditoriaResumo({
        conversaId: contextoSeguro.conversa.id,
        duracaoEmMs: 0,
        execucaoId: dados.execucaoId,
        status: "falhou",
        tokensEntrada: 0,
        tokensSaida: 0,
        versao: contextoSeguro.resumo?.versao ?? null,
      })
      .catch(() => undefined);
    return contextoSeguro;
  }
}
