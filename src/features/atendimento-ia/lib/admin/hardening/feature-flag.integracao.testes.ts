import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after, before } from "node:test";

import { Client } from "pg";

import { encerrarBancoTransacionalIntegracao } from "@/db/transaction";

import { RepositorioConhecimentoInstitucionalDrizzle } from "../../../actions/repositorio-conhecimento-institucional-drizzle";

const url = process.env.DATABASE_URL_INTEGRACAO_ATENDIMENTO_IA;
if (!url) throw new Error("DATABASE_URL_INTEGRACAO_ATENDIMENTO_IA_AUSENTE");
const alvo = new URL(url);
if (
  !["127.0.0.1", "localhost"].includes(alvo.hostname) ||
  alvo.pathname !== "/nuu_integracao_0003_rag"
)
  throw new Error("ALVO_HARDENING_NAO_DESCARTAVEL");

const cliente = new Client({ connectionString: url });
const prefixo = `hardening-${randomUUID()}`;
const usuarioId = `${prefixo}-gestor`;
const legadoId = randomUUID();
const administrativoId = randomUUID();
const rascunhoId = randomUUID();
const publicacaoId = randomUUID();
const vetor = `[${Array.from({ length: 1536 }, (_, indice) => (indice === 0 ? 1 : 0)).join(",")}]`;

before(async () => {
  await cliente.connect();
  await cliente.query(
    `insert into "user" (id,name,email,email_verified,created_at,updated_at) values ($1,'Hardening',$2,false,now(),now())`,
    [usuarioId, `${usuarioId}@local.invalid`],
  );
  for (const [id, chave] of [
    [legadoId, "legado"],
    [administrativoId, "admin"],
    [rascunhoId, "rascunho"],
  ]) {
    const documentoId = randomUUID();
    await cliente.query(
      `insert into atendimento_ia_documentos_institucionais (id,chave_estavel,categoria,origem,criado_por_id) values ($1,$2,'institucional','teste_descartavel',$3)`,
      [documentoId, `${prefixo}-${chave}`, usuarioId],
    );
    await cliente.query(
      `insert into atendimento_ia_documento_versoes (id,documento_id,versao,titulo,conteudo,hash_conteudo,estado,status_indexacao,modelo_embedding,dimensao_embedding,hash_indexacao,indexado_em,criado_por_id) values ($1,$2,1,$3,$4,$5,$6,'concluida','teste-deterministico',1536,$5,now(),$7)`,
      [
        id,
        documentoId,
        chave,
        `Conteúdo ${chave}`,
        `hash-${chave}`,
        chave === "rascunho" ? "rascunho" : "publicado",
        usuarioId,
      ],
    );
    await cliente.query(
      `insert into atendimento_ia_fragmentos_institucionais (versao_documento_id,posicao,conteudo,hash_conteudo,quantidade_tokens,embedding,modelo_embedding,dimensao_embedding,ativo,indexado_em) values ($1,0,$2,$3,3,$4::vector,'teste-deterministico',1536,true,now())`,
      [id, `Conteúdo ${chave}`, `fragmento-${chave}`, vetor],
    );
  }
  await cliente.query(
    `insert into atendimento_ia_publicacoes (id,tipo,identidade,chave_idempotencia,hash_requisicao,status,publicado_por_id,publicado_em) values ($1,'conhecimento',$2,$3,$4,'concluida',$5,now())`,
    [
      publicacaoId,
      `${prefixo}-identidade`,
      `${prefixo}-chave`,
      `${prefixo}-hash`,
      usuarioId,
    ],
  );
  await cliente.query(
    `insert into atendimento_ia_publicacao_itens (publicacao_id,tipo,candidato_id,hash,ordem) values ($1,'conhecimento',$2,'hash-admin',1)`,
    [publicacaoId, administrativoId],
  );
});

after(async () => {
  delete process.env.ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS;
  await cliente.query(
    `delete from atendimento_ia_publicacoes where publicado_por_id=$1`,
    [usuarioId],
  );
  await cliente.query(
    `delete from atendimento_ia_documentos_institucionais where chave_estavel like $1`,
    [`${prefixo}%`],
  );
  await cliente.query(`delete from "user" where id=$1`, [usuarioId]);
  await cliente.end();
  await encerrarBancoTransacionalIntegracao();
});

const buscar = () =>
  new RepositorioConhecimentoInstitucionalDrizzle().buscarCandidatos({
    dimensao: 1536,
    limite: 10,
    modelo: "teste-deterministico",
    pesoSemantico: 1,
    pesoTextual: 0,
    pergunta: "Conteúdo",
    vetor: Array.from({ length: 1536 }, (_, indice) => (indice === 0 ? 1 : 0)),
  });

test("flag false preserva legado e exclui publicação administrativa e rascunho", async () => {
  process.env.ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS = "false";
  const ids = (await buscar()).map((item) => item.versaoId);
  assert.ok(ids.includes(legadoId));
  assert.ok(!ids.includes(administrativoId));
  assert.ok(!ids.includes(rascunhoId));
});

test("flag true consome somente publicação administrativa concluída", async () => {
  process.env.ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS = "true";
  const ids = (await buscar()).map((item) => item.versaoId);
  assert.ok(!ids.includes(legadoId));
  assert.ok(ids.includes(administrativoId));
  assert.ok(!ids.includes(rascunhoId));
});

test("flag true sem publicação concluída não recorre ao legado", async () => {
  await cliente.query(
    `update atendimento_ia_publicacoes set status='falhou', publicado_em=null where id=$1`,
    [publicacaoId],
  );
  try {
    process.env.ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS = "true";
    const ids = (await buscar()).map((item) => item.versaoId);
    assert.ok(!ids.includes(legadoId));
    assert.ok(!ids.includes(administrativoId));
    assert.ok(!ids.includes(rascunhoId));
  } finally {
    await cliente.query(
      `update atendimento_ia_publicacoes set status='concluida', publicado_em=now() where id=$1`,
      [publicacaoId],
    );
  }
});

test("criação concorrente preserva números de versão únicos", async () => {
  const repositorio = new RepositorioConhecimentoInstitucionalDrizzle();
  const chaveEstavel = `${prefixo}-concorrente`;
  const criar = (sufixo: string) =>
    repositorio.criarVersao({
      categoria: "institucional",
      chaveEstavel,
      conteudo: `Conteúdo concorrente ${sufixo}`,
      hashConteudo: `hash-concorrente-${sufixo}`,
      metadados: {},
      origem: "teste_descartavel",
      titulo: "Concorrência",
    });
  const versoes = await Promise.all([criar("a"), criar("b")]);
  assert.deepEqual(
    versoes.map((item) => item.versao.versao).toSorted(),
    [1, 2],
  );
});
