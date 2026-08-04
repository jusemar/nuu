import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after, before } from "node:test";

import { Client } from "pg";

import { encerrarBancoTransacionalIntegracao } from "@/db/transaction";

import type { ClienteEmbeddingsRag } from "../../../types/rag";
import { publicarComportamentoAtomicamente } from "./publicar-comportamento-atomicamente";
import { publicarConhecimentoAtomicamente } from "./publicar-conhecimento-atomicamente";
import { publicarLoteAtomicamente } from "./publicar-lote-atomicamente";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_DESCARTAVEL_AUSENTE");
const alvo = new URL(url);
if (
  !["127.0.0.1", "localhost"].includes(alvo.hostname) ||
  alvo.pathname !== "/nuu_bloco11"
)
  throw new Error("BANCO_BLOCO_11_NAO_DESCARTAVEL");

const sql = new Client({ connectionString: url });
const prefixo = `bloco11-${randomUUID()}`;
const atorId = `${prefixo}-gestor`;
const configuracao = {
  OPENAI_RAG_MODELO_EMBEDDING: "teste-deterministico",
  OPENAI_RAG_DIMENSAO_EMBEDDING: 1536,
  ATENDENTE_IA_RAG_FRAGMENTO_TOKENS: 120,
  ATENDENTE_IA_RAG_SOBREPOSICAO_TOKENS: 20,
  ATENDENTE_IA_RAG_PESO_SEMANTICO: 0.7,
  ATENDENTE_IA_RAG_PESO_TEXTUAL: 0.3,
  ATENDENTE_IA_RAG_CANDIDATOS: 10,
  ATENDENTE_IA_RAG_RESULTADOS: 5,
  ATENDENTE_IA_RAG_RELEVANCIA_MINIMA: 0.2,
  OPENAI_RAG_TIMEOUT_MS: 1000,
  OPENAI_RAG_TAMANHO_LOTE: 8,
};
const embeddings: ClienteEmbeddingsRag = {
  async gerar({ dimensao, entradas }) {
    return entradas.map((_, indice) =>
      Array.from({ length: dimensao }, (__, posicao) =>
        posicao === indice ? 1 : 0,
      ),
    );
  },
};
const revalidar = (identidadeCandidato: string) => async () => ({
  identidadeCandidato,
});

async function criarConhecimento(sufixo: string) {
  const documentoId = randomUUID();
  const anteriorId = randomUUID();
  const candidatoId = randomUUID();
  await sql.query(
    `insert into atendimento_ia_documentos_institucionais (id,chave_estavel,categoria,origem,criado_por_id) values ($1,$2,'politicas','teste_descartavel',$3)`,
    [documentoId, `${prefixo}-${sufixo}`, atorId],
  );
  await sql.query(
    `insert into atendimento_ia_documento_versoes (id,documento_id,versao,titulo,conteudo,hash_conteudo,estado,status_indexacao,revisado_em,criado_por_id) values ($1,$2,1,'Anterior','Conteúdo anterior publicado.','hash-anterior','publicado','concluida',now(),$3),($4,$2,2,'Candidato','Conteúdo institucional candidato seguro e completo.',$5,'em_revisao','pendente',now(),$3)`,
    [anteriorId, documentoId, atorId, candidatoId, `hash-${sufixo}`],
  );
  await sql.query(
    `insert into atendimento_ia_fragmentos_institucionais (versao_documento_id,posicao,conteudo,hash_conteudo,quantidade_tokens,embedding,modelo_embedding,dimensao_embedding,ativo,indexado_em) values ($1,0,'Conteúdo anterior publicado.','frag-anterior',5,$2::vector,'teste-deterministico',1536,true,now())`,
    [
      anteriorId,
      `[${Array.from({ length: 1536 }, (_, i) => (i === 0 ? 1 : 0)).join(",")}]`,
    ],
  );
  return { anteriorId, candidatoId };
}

const comportamentoBase = {
  blocosEditaveis: [
    {
      conteudo: "Responder com clareza.",
      identificador: "clareza",
      titulo: "Clareza",
    },
  ],
  exemplosEvitar: ["Pressionar."],
  exemplosPositivos: ["Posso ajudar."],
  parametros: {
    concisao: "equilibrada",
    formalidade: "neutra",
    tratamentoIncerteza: "consultar_fonte",
  },
  cordialidade: 4,
  acolhimento: 4,
  objetividade: 4,
  linguagemSimples: true,
  evitarLinguagemRobotica: true,
  saudacao: "Olá",
  estruturaExplicacao: "Resposta e detalhes",
  perguntas: "Perguntas curtas",
  recomendacoes: "Conforme necessidade",
  complementos: "Sem pressão",
  faltaInformacao: "Consultar fonte real",
  encaminhamentoHumano: "Explicar encaminhamento",
  palavrasPreferidas: ["ajudar"],
  palavrasEvitadas: ["urgente"],
  tratamentoCliente: "Respeitoso",
  regrasHumanizacao: ["Reconhecer dúvida"],
  naoPressionar: true,
  naoAutoritaria: true,
  naoInventarVantagem: true,
  naoManipularUrgencia: true,
  consultarDadosReais: true,
  restringirAoEscopoLoja: true,
  preservarSegurancaPrivacidade: true,
  whatsappEditavel: false,
  acoesAdministrativasPermitidas: false,
};

before(async () => {
  await sql.connect();
  await sql.query(
    `insert into "user" (id,name,email,email_verified,created_at,updated_at) values ($1,'Gestor Bloco 11',$2,false,now(),now())`,
    [atorId, `${atorId}@local.invalid`],
  );
});

after(async () => {
  await sql.query(
    `delete from atendimento_ia_documentos_institucionais where chave_estavel like $1`,
    [`${prefixo}%`],
  );
  await sql.query(
    `delete from atendimento_ia_comportamentos where chave_estavel like $1`,
    [`${prefixo}%`],
  );
  await sql.query(
    `delete from atendimento_ia_publicacoes where publicado_por_id=$1`,
    [atorId],
  );
  await sql.query(`delete from "user" where id=$1`, [atorId]);
  await sql.end();
  await encerrarBancoTransacionalIntegracao();
});

test("publicação individual troca fragmentos atomicamente e é idempotente", async () => {
  const item = await criarConhecimento("individual");
  const identidade = `identidade-${randomUUID()}`;
  const entrada = {
    atorId,
    chaveIdempotencia: `${prefixo}:individual`,
    clienteEmbeddings: embeddings,
    configuracao,
    identidade,
    versaoId: item.candidatoId,
    revalidarElegibilidade: revalidar(identidade),
  };
  const primeira = await publicarConhecimentoAtomicamente(entrada);
  const repetida = await publicarConhecimentoAtomicamente(entrada);
  assert.equal(primeira.idempotente, false);
  assert.equal(repetida.idempotente, true);
  const estados = await sql.query(
    `select id,estado from atendimento_ia_documento_versoes where id=any($1::uuid[]) order by id`,
    [[item.anteriorId, item.candidatoId]],
  );
  assert.deepEqual(
    new Set(estados.rows.map((r) => r.estado)),
    new Set(["desativado", "publicado"]),
  );
  const ativos = await sql.query(
    `select versao_documento_id from atendimento_ia_fragmentos_institucionais where ativo=true and versao_documento_id=any($1::uuid[])`,
    [[item.anteriorId, item.candidatoId]],
  );
  assert.deepEqual(
    ativos.rows.map((r) => r.versao_documento_id),
    [item.candidatoId],
  );
});

test("falha de embedding preserva integralmente a versão anterior", async () => {
  const item = await criarConhecimento("falha");
  await assert.rejects(
    () =>
      publicarConhecimentoAtomicamente({
        atorId,
        chaveIdempotencia: `${prefixo}:falha`,
        clienteEmbeddings: {
          async gerar() {
            return [[1, 2]];
          },
        },
        configuracao,
        identidade: "falha-embedding",
        versaoId: item.candidatoId,
        revalidarElegibilidade: revalidar("falha-embedding"),
      }),
    /DIMENSAO/,
  );
  const estado = await sql.query(
    `select estado from atendimento_ia_documento_versoes where id=$1`,
    [item.anteriorId],
  );
  assert.equal(estado.rows[0].estado, "publicado");
});

test("comportamento e lote publicam tudo ou nada com rastreabilidade", async () => {
  const comportamentoId = randomUUID();
  const anteriorComportamentoId = randomUUID();
  const candidatoComportamentoId = randomUUID();
  await sql.query(
    `insert into atendimento_ia_comportamentos (id,chave_estavel,nome,descricao,criado_por_id) values ($1,$2,'Tom seguro','Teste descartável',$3)`,
    [comportamentoId, `${prefixo}-comportamento`, atorId],
  );
  await sql.query(
    `insert into atendimento_ia_comportamento_versoes (id,comportamento_id,numero_versao,estado,configuracao_estruturada,blocos_administrativos,hash,motivo_alteracao,resumo_alteracao,revisado_em,criado_por_id) values ($1,$2,1,'publicado',$3,$3,'hash-comp-anterior','Teste','Anterior',now(),$4),($5,$2,2,'em_revisao',$3,$3,'hash-comp-candidato','Teste','Candidato',now(),$4)`,
    [
      anteriorComportamentoId,
      comportamentoId,
      comportamentoBase,
      atorId,
      candidatoComportamentoId,
    ],
  );
  const identidadeComportamento = `comp-${randomUUID()}`;
  await publicarComportamentoAtomicamente({
    atorId,
    chaveIdempotencia: `${prefixo}:comp`,
    identidade: identidadeComportamento,
    versaoId: candidatoComportamentoId,
    revalidarElegibilidade: revalidar(identidadeComportamento),
  });
  const item = await criarConhecimento("lote");
  const comportamentoLoteId = randomUUID();
  await sql.query(
    `insert into atendimento_ia_comportamento_versoes (id,comportamento_id,numero_versao,estado,configuracao_estruturada,blocos_administrativos,hash,motivo_alteracao,resumo_alteracao,revisado_em,criado_por_id) values ($1,$2,3,'em_revisao',$3,$3,'hash-comp-lote','Teste','Lote',now(),$4)`,
    [comportamentoLoteId, comportamentoId, comportamentoBase, atorId],
  );
  const identidade = `lote-${randomUUID()}`;
  const publicado = await publicarLoteAtomicamente({
    atorId,
    chaveIdempotencia: `${prefixo}:lote`,
    clienteEmbeddings: embeddings,
    configuracao,
    identidade,
    itens: [
      { id: item.candidatoId, hash: "hash-lote", ordem: 1 },
      { id: comportamentoLoteId, hash: "hash-comp-lote", ordem: 2 },
    ],
    revalidarElegibilidade: revalidar(identidade),
  });
  const itens = await sql.query(
    `select ordem from atendimento_ia_publicacao_itens where publicacao_id=$1 order by ordem`,
    [publicado.publicacao.id],
  );
  assert.deepEqual(
    itens.rows.map((r) => r.ordem),
    [1, 2],
  );
  const quantidadeAntes = await sql.query(
    `select count(*)::int total from atendimento_ia_publicacoes where publicado_por_id=$1`,
    [atorId],
  );
  await assert.rejects(
    () =>
      publicarLoteAtomicamente({
        atorId,
        chaveIdempotencia: `${prefixo}:lote-invalido`,
        clienteEmbeddings: embeddings,
        configuracao,
        identidade: "lote-invalido",
        itens: [{ id: randomUUID(), hash: "ausente", ordem: 1 }],
        revalidarElegibilidade: revalidar("lote-invalido"),
      }),
    /INTEGRANTES_INVALIDOS/,
  );
  const quantidadeDepois = await sql.query(
    `select count(*)::int total from atendimento_ia_publicacoes where publicado_por_id=$1`,
    [atorId],
  );
  assert.equal(quantidadeDepois.rows[0].total, quantidadeAntes.rows[0].total);
});
