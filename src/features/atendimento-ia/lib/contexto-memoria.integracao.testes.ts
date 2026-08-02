import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";

import { Client } from "pg";

import { encerrarBancoTransacionalIntegracao } from "@/db/transaction";

import { receberMensagemAtendimento } from "../actions/receber-mensagem-atendimento";
import { RepositorioEntradaAtendimentoDrizzle } from "../actions/repositorio-entrada-atendimento-drizzle";
import { RepositorioMemoriaCurtoPrazoDrizzle } from "../actions/repositorio-memoria-curto-prazo-drizzle";
import { RepositorioOrquestradorDrizzle } from "../actions/repositorio-orquestrador-drizzle";
import {
  VERSAO_AVISO_PRIVACIDADE_CHAT,
  VERSAO_TEXTO_AUTORIZACAO_MEMORIA,
} from "../constants/contexto";
import type { ClienteResponsesOpenAi } from "../types/integracao-openai";
import { criarComponenteProcessamentoOpenAi } from "./componente-processamento-openai";
import { calcularHashMensagens, montarContextoControlado } from "./contexto-controlado";
import { orquestrarMensagem } from "./orquestrar-mensagem";

const url = process.env.DATABASE_URL_INTEGRACAO_ATENDIMENTO_IA;
if (!url) throw new Error("DATABASE_URL_INTEGRACAO_ATENDIMENTO_IA_AUSENTE");
const alvo = new URL(url);
if (
  !["127.0.0.1", "localhost"].includes(alvo.hostname) ||
  alvo.pathname !== "/nuu_integracao_0002"
) {
  throw new Error("ALVO_INTEGRACAO_NAO_DESCARTAVEL");
}

const clienteSql = new Client({ connectionString: url });
const prefixo = `it-0002-${randomUUID()}`;

after(async () => {
  await clienteSql.query(`delete from atendimento_ia_conversas`);
  await clienteSql.query(`delete from "user" where id like $1`, [`${prefixo}%`]);
  await clienteSql.end();
  await encerrarBancoTransacionalIntegracao();
});

async function criarUsuario(sufixo: string) {
  const id = `${prefixo}-${sufixo}`;
  await clienteSql.query(
    `insert into "user" (id,name,email,email_verified,created_at,updated_at)
     values ($1,$2,$3,false,now(),now())`,
    [id, `Integração ${sufixo}`, `${id}@local.invalid`],
  );
  return id;
}

function entrada(conversaId?: string, mensagem = "Procuro um produto até R$ 500") {
  return {
    avisoPrivacidadeVersao: VERSAO_AVISO_PRIVACIDADE_CHAT as typeof VERSAO_AVISO_PRIVACIDADE_CHAT,
    canal: "site" as const,
    chaveIdempotencia: randomUUID(),
    conversaId,
    mensagem,
  };
}

test("integra entrada, banco, contexto, memória, resumo, orquestrador e Responses mockada", async () => {
  await clienteSql.connect();
  const usuarioA = await criarUsuario("usuario-a");
  const usuarioB = await criarUsuario("usuario-b");
  const repositorioEntrada = new RepositorioEntradaAtendimentoDrizzle();
  const repositorioOrquestrador = new RepositorioOrquestradorDrizzle();
  const repositorioMemoria = new RepositorioMemoriaCurtoPrazoDrizzle();

  const visitante = { identificadorSessao: randomUUID(), usuarioId: null };
  const primeiraVisitante = await receberMensagemAtendimento(
    repositorioEntrada,
    entrada(),
    visitante,
    7,
  );
  const privacidade = await clienteSql.query<{
    aviso_privacidade_versao: string;
    inicio_voluntario_em: Date;
  }>(
    `select aviso_privacidade_versao,inicio_voluntario_em
     from atendimento_ia_conversas where id=$1`,
    [primeiraVisitante.conversaId],
  );
  assert.equal(
    privacidade.rows[0]?.aviso_privacidade_versao,
    VERSAO_AVISO_PRIVACIDADE_CHAT,
  );
  assert.ok(privacidade.rows[0]?.inicio_voluntario_em);

  await assert.rejects(
    receberMensagemAtendimento(
      repositorioEntrada,
      entrada(primeiraVisitante.conversaId),
      { identificadorSessao: visitante.identificadorSessao, usuarioId: usuarioA },
      30,
    ),
  );
  await assert.rejects(
    receberMensagemAtendimento(
      repositorioEntrada,
      entrada(primeiraVisitante.conversaId),
      { identificadorSessao: randomUUID(), usuarioId: null },
      7,
    ),
  );

  const identidadeA = { identificadorSessao: randomUUID(), usuarioId: usuarioA };
  const identidadeB = { identificadorSessao: randomUUID(), usuarioId: usuarioB };
  const primeiraA = await receberMensagemAtendimento(
    repositorioEntrada,
    entrada(),
    identidadeA,
    30,
  );
  await assert.rejects(
    receberMensagemAtendimento(
      repositorioEntrada,
      entrada(primeiraA.conversaId),
      identidadeB,
      30,
    ),
  );

  await assert.rejects(
    repositorioMemoria.persistirConfirmada({
      assunto: "faixa de preço",
      categoria: "faixa_preco",
      conversaId: primeiraA.conversaId,
      correcaoExplicita: false,
      diasExpiracao: 30,
      origem: "informada_cliente",
      usuarioId: usuarioA,
      valorEstruturado: { maximo: 500 },
    }),
    /AUTORIZACAO_AUSENTE/,
  );
  await repositorioMemoria.autorizar({
    origem: "api_interna_site",
    usuarioId: usuarioA,
    versaoTexto: VERSAO_TEXTO_AUTORIZACAO_MEMORIA,
  });
  const criada = await repositorioMemoria.persistirConfirmada({
    assunto: "Faixa de preço",
    categoria: "faixa_preco",
    conversaId: primeiraA.conversaId,
    correcaoExplicita: false,
    diasExpiracao: 30,
    origem: "informada_cliente",
    usuarioId: usuarioA,
    valorEstruturado: { maximo: 500 },
  });
  assert.equal(criada.resultado, "criada");
  assert.equal(
    (
      await repositorioMemoria.persistirConfirmada({
        assunto: "faixa de preco",
        categoria: "faixa_preco",
        conversaId: primeiraA.conversaId,
        correcaoExplicita: false,
        diasExpiracao: 30,
        origem: "informada_cliente",
        usuarioId: usuarioA,
        valorEstruturado: { maximo: 500 },
      })
    ).resultado,
    "duplicada",
  );
  assert.equal(
    (
      await repositorioMemoria.persistirConfirmada({
        assunto: "faixa de preco",
        categoria: "faixa_preco",
        conversaId: primeiraA.conversaId,
        correcaoExplicita: false,
        diasExpiracao: 30,
        origem: "informada_cliente",
        usuarioId: usuarioA,
        valorEstruturado: { minimo: 100 },
      })
    ).resultado,
    "complementada",
  );
  const substituida = await repositorioMemoria.persistirConfirmada({
    assunto: "faixa de preco",
    categoria: "faixa_preco",
    conversaId: primeiraA.conversaId,
    correcaoExplicita: true,
    diasExpiracao: 30,
    origem: "informada_cliente",
    usuarioId: usuarioA,
    valorEstruturado: { maximo: 600 },
  });
  assert.equal(substituida.resultado, "substituida");

  const contraditoriaInicial = await repositorioMemoria.persistirConfirmada({
    assunto: "tamanho",
    categoria: "caracteristicas_desejadas",
    conversaId: primeiraA.conversaId,
    correcaoExplicita: false,
    diasExpiracao: 30,
    origem: "informada_cliente",
    usuarioId: usuarioA,
    valorEstruturado: { tamanho: "M" },
  });
  const contradicao = await repositorioMemoria.persistirConfirmada({
    assunto: "tamanho",
    categoria: "caracteristicas_desejadas",
    conversaId: primeiraA.conversaId,
    correcaoExplicita: false,
    diasExpiracao: 30,
    origem: "informada_cliente",
    usuarioId: usuarioA,
    valorEstruturado: { tamanho: "G" },
  });
  assert.equal(contradicao.resultado, "contradicao");
  assert.equal(contradicao.id, contraditoriaInicial.id);
  assert.equal(
    Number(
      (
        await clienteSql.query(
          `select count(*) from atendimento_ia_memorias
           where id=$1 and situacao='ativa'`,
          [contradicao.id],
        )
      ).rows[0]?.count,
    ),
    0,
  );

  await assert.rejects(
    repositorioMemoria.persistirConfirmada({
      assunto: "segredo",
      categoria: "preferencias_compra",
      conversaId: primeiraA.conversaId,
      correcaoExplicita: false,
      diasExpiracao: 30,
      origem: "informada_cliente",
      usuarioId: usuarioA,
      valorEstruturado: { senha: "não armazenar" },
    }),
    /MEMORIA_NAO_PERMITIDA/,
  );

  const expirada = await repositorioMemoria.persistirConfirmada({
    assunto: "marca temporária",
    categoria: "preferencias_compra",
    conversaId: primeiraA.conversaId,
    correcaoExplicita: false,
    diasExpiracao: 30,
    origem: "informada_cliente",
    usuarioId: usuarioA,
    valorEstruturado: { marca: "temporária" },
  });
  const encerrada = await repositorioMemoria.persistirConfirmada({
    assunto: "decisão encerrada",
    categoria: "decisao_pendente",
    conversaId: primeiraA.conversaId,
    correcaoExplicita: false,
    diasExpiracao: 30,
    origem: "informada_cliente",
    usuarioId: usuarioA,
    valorEstruturado: { decisao: "encerrada" },
  });
  await clienteSql.query(
    `update atendimento_ia_memorias
     set expira_em=case when id=$1 then now() - interval '1 minute' else now() + interval '2 days' end,
         necessidade_encerrada=case when id=$2 then true else necessidade_encerrada end
     where id in ($1,$2)`,
    [expirada.id, encerrada.id],
  );
  const antesDaRenovacao = await clienteSql.query<{ expira_em: Date }>(
    `select expira_em from atendimento_ia_memorias where id=$1`,
    [substituida.id],
  );
  const expiracaoEncerrada = await clienteSql.query<{ expira_em: Date }>(
    `select expira_em from atendimento_ia_memorias where id=$1`,
    [encerrada.id],
  );
  await assert.rejects(
    repositorioMemoria.persistirConfirmada({
      assunto: "categoria",
      categoria: "nao_permitida" as "faixa_preco",
      conversaId: primeiraA.conversaId,
      correcaoExplicita: false,
      diasExpiracao: 30,
      origem: "informada_cliente",
      usuarioId: usuarioA,
      valorEstruturado: { valor: "x" },
    }),
    /MEMORIA_NAO_PERMITIDA/,
  );

  const segundaA = await receberMensagemAtendimento(
    repositorioEntrada,
    entrada(primeiraA.conversaId, "Continuando a pesquisa"),
    identidadeA,
    30,
  );
  const reivindicacao = await repositorioOrquestrador.reivindicarProcessamento({
    contextoExpiraAposDias: 30,
    identidade: identidadeA,
    memoriaAtiva: true,
    memoriaExpiraAposDias: 30,
    mensagemId: segundaA.mensagemId,
  });
  assert.equal(reivindicacao.tipo, "adquirida");
  if (reivindicacao.tipo !== "adquirida") throw new Error("REIVINDICACAO_AUSENTE");
  assert.ok(reivindicacao.contexto.memoriaPermitida.length >= 1);
  assert.equal(
    reivindicacao.contexto.memoriaPermitida.some(
      (memoria) => memoria.assuntoNormalizado === "tamanho",
    ),
    false,
  );
  assert.equal(
    reivindicacao.contexto.memoriaPermitida.some(
      (memoria) => memoria.id === expirada.id,
    ),
    false,
  );
  const depoisDaRenovacao = await clienteSql.query<{ expira_em: Date }>(
    `select expira_em from atendimento_ia_memorias where id=$1`,
    [substituida.id],
  );
  const expiracaoEncerradaDepois = await clienteSql.query<{ expira_em: Date }>(
    `select expira_em from atendimento_ia_memorias where id=$1`,
    [encerrada.id],
  );
  assert.ok(
    depoisDaRenovacao.rows[0]!.expira_em >
      antesDaRenovacao.rows[0]!.expira_em,
  );
  assert.equal(
    expiracaoEncerradaDepois.rows[0]!.expira_em.getTime(),
    expiracaoEncerrada.rows[0]!.expira_em.getTime(),
  );
  const contextoControlado = montarContextoControlado(
    reivindicacao.contexto,
    { limiteTokens: 8_000 },
  );
  assert.ok(contextoControlado.tokensEstimados <= 8_000);

  const resumo1 = await repositorioOrquestrador.persistirResumo({
    ateMensagemId: primeiraA.mensagemId,
    conteudo: "{\"objetivo\":\"produto\"}",
    conversaId: primeiraA.conversaId,
    execucaoId: reivindicacao.execucaoId,
    hashConteudoConsiderado: calcularHashMensagens(
      reivindicacao.contexto.mensagensAnteriores,
    ),
    quantidadeMensagens: reivindicacao.contexto.mensagensAnteriores.length,
    resumoAnteriorVersao: null,
    resumoEstruturado: { objetivo: "produto" },
  });
  assert.equal(resumo1?.versao, 1);
  assert.equal(
    (
      await repositorioOrquestrador.persistirResumo({
        ateMensagemId: primeiraA.mensagemId,
        conteudo: "{\"objetivo\":\"produto\"}",
        conversaId: primeiraA.conversaId,
        execucaoId: reivindicacao.execucaoId,
        hashConteudoConsiderado: calcularHashMensagens(
          reivindicacao.contexto.mensagensAnteriores,
        ),
        quantidadeMensagens: reivindicacao.contexto.mensagensAnteriores.length,
        resumoAnteriorVersao: null,
        resumoEstruturado: { objetivo: "produto" },
      })
    )?.id,
    resumo1?.id,
  );
  assert.equal(
    (await repositorioOrquestrador.buscarResumoPorExecucao(reivindicacao.execucaoId))
      ?.versao,
    1,
  );
  await assert.rejects(
    repositorioOrquestrador.persistirResumo({
      ateMensagemId: primeiraA.mensagemId,
      conteudo: "inválido",
      conversaId: primeiraA.conversaId,
      execucaoId: randomUUID(),
      hashConteudoConsiderado: "divergente",
      quantidadeMensagens: 1,
      resumoAnteriorVersao: null,
      resumoEstruturado: {},
    }),
  );
  assert.equal(
    Number(
      (
        await clienteSql.query(
          `select count(*) from atendimento_ia_resumos
           where conversa_id=$1 and situacao='valido' and versao=1`,
          [primeiraA.conversaId],
        )
      ).rows[0]?.count,
    ),
    1,
  );

  const mensagemResumo2 = await receberMensagemAtendimento(
    repositorioEntrada,
    entrada(primeiraA.conversaId, "Atualize o contexto resumido"),
    identidadeA,
    30,
  );
  const reivindicacaoResumo2 =
    await repositorioOrquestrador.reivindicarProcessamento({
      contextoExpiraAposDias: 30,
      identidade: identidadeA,
      memoriaAtiva: true,
      memoriaExpiraAposDias: 30,
      mensagemId: mensagemResumo2.mensagemId,
    });
  assert.equal(reivindicacaoResumo2.tipo, "adquirida");
  if (reivindicacaoResumo2.tipo !== "adquirida") {
    throw new Error("REIVINDICACAO_RESUMO_2_AUSENTE");
  }
  const contextoComResumo1 = montarContextoControlado(
    reivindicacaoResumo2.contexto,
    { limiteTokens: 8_000 },
  );
  assert.equal(contextoComResumo1.dados.resumo?.versao, 1);
  const mensagensResumo2 = reivindicacaoResumo2.contexto.mensagensAnteriores;
  const resumo2 = await repositorioOrquestrador.persistirResumo({
    ateMensagemId: mensagensResumo2.at(-1)!.id,
    conteudo: "{\"objetivo\":\"produto\",\"etapa\":2}",
    conversaId: primeiraA.conversaId,
    execucaoId: reivindicacaoResumo2.execucaoId,
    hashConteudoConsiderado: calcularHashMensagens(mensagensResumo2),
    quantidadeMensagens: mensagensResumo2.length,
    resumoAnteriorVersao: 1,
    resumoEstruturado: { etapa: 2, objetivo: "produto" },
  });
  assert.equal(resumo2?.versao, 2);
  const versoesAposSubstituicao = await clienteSql.query<{
    situacao: string;
    versao: number;
  }>(
    `select versao,situacao from atendimento_ia_resumos
     where conversa_id=$1 order by versao`,
    [primeiraA.conversaId],
  );
  assert.deepEqual(versoesAposSubstituicao.rows, [
    { situacao: "substituido", versao: 1 },
    { situacao: "valido", versao: 2 },
  ]);

  const mensagensConcorrentes = await Promise.all([
    receberMensagemAtendimento(
      repositorioEntrada,
      entrada(primeiraA.conversaId, "Concorrência A"),
      identidadeA,
      30,
    ),
    receberMensagemAtendimento(
      repositorioEntrada,
      entrada(primeiraA.conversaId, "Concorrência B"),
      identidadeA,
      30,
    ),
  ]);
  const reivindicacoesConcorrentes = await Promise.all(
    mensagensConcorrentes.map((mensagem) =>
      repositorioOrquestrador.reivindicarProcessamento({
        contextoExpiraAposDias: 30,
        identidade: identidadeA,
        memoriaAtiva: true,
        memoriaExpiraAposDias: 30,
        mensagemId: mensagem.mensagemId,
      }),
    ),
  );
  assert.ok(
    reivindicacoesConcorrentes.every(
      (reivindicacaoConcorrente) => reivindicacaoConcorrente.tipo === "adquirida",
    ),
  );
  const tentativasConcorrentes = await Promise.allSettled(
    reivindicacoesConcorrentes.map((reivindicacaoConcorrente, indice) => {
      if (reivindicacaoConcorrente.tipo !== "adquirida") {
        throw new Error("REIVINDICACAO_CONCORRENTE_AUSENTE");
      }
      const mensagens = reivindicacaoConcorrente.contexto.mensagensAnteriores;
      return repositorioOrquestrador.persistirResumo({
        ateMensagemId: mensagens.at(-1)!.id,
        conteudo: JSON.stringify({ concorrente: indice }),
        conversaId: primeiraA.conversaId,
        execucaoId: reivindicacaoConcorrente.execucaoId,
        hashConteudoConsiderado: calcularHashMensagens(mensagens),
        quantidadeMensagens: mensagens.length,
        resumoAnteriorVersao: 2,
        resumoEstruturado: { concorrente: indice },
      });
    }),
  );
  assert.equal(
    tentativasConcorrentes.filter((resultado) => resultado.status === "fulfilled")
      .length,
    1,
  );
  assert.equal(
    Number(
      (
        await clienteSql.query(
          `select count(*) from atendimento_ia_resumos
           where conversa_id=$1 and situacao='valido' and versao=3`,
          [primeiraA.conversaId],
        )
      ).rows[0]?.count,
    ),
    1,
  );

  await repositorioMemoria.remover({ memoriaId: substituida.id, usuarioId: usuarioA });
  await repositorioMemoria.revogar(usuarioA);
  await assert.rejects(
    repositorioMemoria.persistirConfirmada({
      assunto: "nova preferência",
      categoria: "preferencias_compra",
      conversaId: primeiraA.conversaId,
      correcaoExplicita: false,
      diasExpiracao: 30,
      origem: "informada_cliente",
      usuarioId: usuarioA,
      valorEstruturado: { valor: "não deve persistir" },
    }),
    /AUTORIZACAO_AUSENTE/,
  );
  const terceiraA = await receberMensagemAtendimento(
    repositorioEntrada,
    entrada(primeiraA.conversaId, "Mensagem para orquestração completa"),
    identidadeA,
    30,
  );
  const respostaModelo = {
    error: null,
    id: "resp_mock_integracao",
    incomplete_details: null,
    model: "gpt-5.6-terra",
    output: [],
    output_text: JSON.stringify({
      criterio_escalonamento: null,
      decisao: {
        encaminhamento: "gerar_resposta",
        resposta: "Resposta validada sem chamada externa.",
        transferencia: null,
      },
    }),
    status: "completed" as const,
    usage: { input_tokens: 100, output_tokens: 20 },
  };
  let chamadasAoMock = 0;
  const clienteMock: ClienteResponsesOpenAi = {
    async criar() {
      chamadasAoMock += 1;
      return respostaModelo;
    },
  };
  const componente = criarComponenteProcessamentoOpenAi({
    cliente: clienteMock,
    configuracao: {
      escalonamentoAtivo: false,
      maxContextTokens: 8_000,
      maxOutputTokens: 1_200,
      maxTentativas: 1,
      timeoutEmMs: 2_000,
    },
    executorFerramentas: {
      async executar() {
        throw new Error("FERRAMENTA_NAO_ESPERADA");
      },
    },
    ferramentas: [],
  });
  const resultadoOrquestracao = await orquestrarMensagem(
    {
      componente,
      contextoExpiraAposDias: () => 30,
      memoriaAtiva: true,
      memoriaExpiraAposDias: 30,
      repositorio: repositorioOrquestrador,
    },
    { identidade: identidadeA, mensagemId: terceiraA.mensagemId },
  );
  assert.equal(resultadoOrquestracao.tipo, "encaminhada");
  assert.equal(resultadoOrquestracao.estado, "gerando_resposta");
  assert.equal(chamadasAoMock, 1);

  const vazamentos = await clienteSql.query(
    `select count(*) from atendimento_ia_memorias m
     join atendimento_ia_conversas c on c.id=m.conversa_origem_id
     where m.usuario_id<>c.usuario_id`,
  );
  assert.equal(Number(vazamentos.rows[0]?.count), 0);
});
