import { createHash } from "node:crypto";

import { INSTRUCOES_SISTEMA_ATENDENTE_IA } from "../constants/instrucoes-openai";
import type {
  ConfiguracaoContexto,
  ContextoControlado,
  DecisaoResumo,
} from "../types/contexto";
import type {
  ContextoPersistidoOrquestrador,
  MensagemContextoOrquestrador,
} from "../types/orquestrador";

const PADROES_RESTRITOS = [
  /\b(?:senha|password|token|api[_ -]?key|chave secreta)\b\s*[:=]\s*\S+/giu,
  /\b\d{13,19}\b/g,
];

export function sanitizarConteudoContexto(conteudo: string) {
  return PADROES_RESTRITOS.reduce(
    (atual, padrao) => atual.replace(padrao, "[DADO_RESTRITO]"),
    conteudo,
  );
}

export function sanitizarValorContexto(valor: unknown): unknown {
  if (typeof valor === "string") return sanitizarConteudoContexto(valor);
  if (Array.isArray(valor)) return valor.map(sanitizarValorContexto);
  if (!valor || typeof valor !== "object" || valor instanceof Date)
    return valor;
  return Object.fromEntries(
    Object.entries(valor as Record<string, unknown>)
      .filter(
        ([chave]) =>
          !/(^id$|Id$|_id$|usuario|sessao|execucao|interno)/i.test(chave),
      )
      .map(([chave, item]) => [chave, sanitizarValorContexto(item)]),
  );
}

// Estimativa conservadora: um token nunca recebe orçamento inferior ao total
// de bytes UTF-8 do conteúdo serializado.
export function estimarTokensSeguro(valor: unknown) {
  return Buffer.byteLength(
    typeof valor === "string" ? valor : JSON.stringify(valor),
    "utf8",
  );
}

function semIdentificadores(mensagem: MensagemContextoOrquestrador) {
  return {
    autor: mensagem.autor,
    conteudo: sanitizarConteudoContexto(mensagem.conteudo),
    criadoEm: mensagem.criadoEm,
    status: mensagem.status,
  };
}

function termosRelevantes(texto: string) {
  return new Set(
    texto
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .match(/[a-z0-9]{3,}/g) ?? [],
  );
}

export function calcularHashMensagens(
  mensagens: MensagemContextoOrquestrador[],
) {
  const conteudo = mensagens.map((mensagem) => ({
    autor: mensagem.autor,
    conteudo: mensagem.conteudo,
    criadoEm: mensagem.criadoEm.toISOString(),
    id: mensagem.id,
  }));
  return createHash("sha256").update(JSON.stringify(conteudo)).digest("hex");
}

export function resumoEhValido(contexto: ContextoPersistidoOrquestrador) {
  if (!contexto.resumo || !contexto.resumo.ateMensagemId) return false;
  const indice = contexto.mensagensAnteriores.findIndex(
    (mensagem) => mensagem.id === contexto.resumo!.ateMensagemId,
  );
  if (indice < 0) return false;
  const abrangidas = contexto.mensagensAnteriores.slice(0, indice + 1);
  return (
    contexto.resumo.versao > 0 &&
    contexto.resumo.quantidadeMensagens === abrangidas.length &&
    contexto.resumo.hashConteudoConsiderado ===
      calcularHashMensagens(abrangidas)
  );
}

export function decidirResumo(
  contexto: ContextoPersistidoOrquestrador,
  configuracao: ConfiguracaoContexto,
): DecisaoResumo {
  const indiceResumo = contexto.resumo
    ? contexto.mensagensAnteriores.findIndex(
        (mensagem) => mensagem.id === contexto.resumo!.ateMensagemId,
      )
    : -1;
  const posteriores = contexto.resumo
    ? indiceResumo >= 0
      ? contexto.mensagensAnteriores.slice(indiceResumo + 1)
      : contexto.mensagensAnteriores
    : contexto.mensagensAnteriores;
  if (posteriores.length === 0) return { tipo: "nao_gerar" };
  const tokensNovos = estimarTokensSeguro(posteriores.map(semIdentificadores));
  const tokensTotais = estimarTokensSeguro([
    ...contexto.mensagensAnteriores.map(semIdentificadores),
    semIdentificadores(contexto.mensagemAtual),
  ]);
  if (
    !contexto.resumo &&
    tokensTotais >= configuracao.limiarPrimeiroResumoTokens
  ) {
    return { mensagens: contexto.mensagensAnteriores, tipo: "gerar" };
  }
  if (
    contexto.resumo &&
    (tokensNovos >= configuracao.limiarAtualizacaoResumoTokens ||
      tokensTotais > configuracao.limiteTokens)
  ) {
    return { mensagens: posteriores, tipo: "atualizar" };
  }
  return { tipo: "nao_gerar" };
}

export function montarContextoControlado(
  contexto: ContextoPersistidoOrquestrador,
  configuracao: Pick<ConfiguracaoContexto, "limiteTokens">,
  instrucoesSistema = INSTRUCOES_SISTEMA_ATENDENTE_IA,
): ContextoControlado {
  const mensagemAtual = semIdentificadores(contexto.mensagemAtual);
  const memorias = contexto.memoriaPermitida.map((memoria) => ({
    categoria: memoria.categoria,
    origem: memoria.origem,
    valorEstruturado: sanitizarValorContexto(
      memoria.valorEstruturado,
    ) as Record<string, unknown>,
  }));
  const base = {
    estado: sanitizarValorContexto(
      contexto.estado,
    ) as ContextoPersistidoOrquestrador["estado"],
    fontesInstitucionais: contexto.fontesInstitucionais
      ? {
          conflito: contexto.fontesInstitucionais.conflito,
          fontes: contexto.fontesInstitucionais.fontes.map((fonte) => ({
            conteudo: sanitizarConteudoContexto(fonte.conteudo),
            pontuacaoFinal: fonte.pontuacaoFinal,
            secao: fonte.secao,
            titulo: fonte.titulo,
            versao: fonte.versao,
          })),
          status: contexto.fontesInstitucionais.status,
        }
      : undefined,
    memoriaPermitida: [] as typeof memorias,
    mensagemAtual,
    mensagensAnteriores: [] as ReturnType<typeof semIdentificadores>[],
    resultadosFerramentas: contexto.resultadosFerramentas.map((resultado) => ({
      nome: resultado.nome,
      resultado: sanitizarValorContexto(resultado.resultado) as Record<
        string,
        unknown
      >,
      versao: resultado.versao,
    })),
    resumo:
      contexto.resumo && resumoEhValido(contexto)
        ? {
            conteudo: sanitizarConteudoContexto(contexto.resumo.conteudo),
            resumoEstruturado: sanitizarValorContexto(
              contexto.resumo.resumoEstruturado,
            ) as Record<string, unknown>,
            versao: contexto.resumo.versao,
          }
        : null,
  };
  let custoFixo =
    estimarTokensSeguro(instrucoesSistema) + estimarTokensSeguro(base);
  if (custoFixo > configuracao.limiteTokens && base.resumo) {
    base.resumo = null;
    custoFixo =
      estimarTokensSeguro(instrucoesSistema) + estimarTokensSeguro(base);
  }
  if (custoFixo > configuracao.limiteTokens) {
    // A mensagem atual é preservada; o chamador classifica o excesso em vez de
    // permitir truncamento silencioso pela API.
    return {
      dados: base,
      mensagensDescartadas: contexto.mensagensAnteriores.length,
      tokensEstimados: custoFixo,
    };
  }
  let consumidos = custoFixo;
  for (const memoria of memorias) {
    const custo = estimarTokensSeguro(memoria);
    if (consumidos + custo > configuracao.limiteTokens) continue;
    base.memoriaPermitida.push(memoria);
    consumidos += custo;
  }
  const selecionadas: ReturnType<typeof semIdentificadores>[] = [];
  const termosAtuais = termosRelevantes(contexto.mensagemAtual.conteudo);
  const candidatas = [...contexto.mensagensAnteriores].sort((a, b) => {
    const relevanciaA = [...termosRelevantes(a.conteudo)].filter((termo) =>
      termosAtuais.has(termo),
    ).length;
    const relevanciaB = [...termosRelevantes(b.conteudo)].filter((termo) =>
      termosAtuais.has(termo),
    ).length;
    return (
      relevanciaB - relevanciaA || b.criadoEm.getTime() - a.criadoEm.getTime()
    );
  });
  for (const mensagem of candidatas) {
    const segura = semIdentificadores(mensagem);
    const custo = estimarTokensSeguro(segura);
    if (consumidos + custo > configuracao.limiteTokens) continue;
    selecionadas.push(segura);
    consumidos += custo;
  }
  base.mensagensAnteriores = selecionadas.sort(
    (a, b) => a.criadoEm.getTime() - b.criadoEm.getTime(),
  );
  return {
    dados: base,
    mensagensDescartadas:
      contexto.mensagensAnteriores.length - selecionadas.length,
    tokensEstimados: consumidos,
  };
}
