import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";

import { Client } from "pg";

import { encerrarBancoTransacionalIntegracao } from "@/db/transaction";

import { RepositorioConhecimentoInstitucionalDrizzle } from "../../actions/repositorio-conhecimento-institucional-drizzle";
import { configuracaoRagSchema } from "../../schemas/configuracao-rag.schema";
import type { ClienteEmbeddingsRag } from "../../types/rag";
import {
  criarDocumentoInstitucional,
  publicarDocumentoInstitucional,
} from "./indexar-documento-institucional";
import { recuperarFontesInstitucionais } from "./recuperar-fontes-institucionais";

const url = process.env.DATABASE_URL_INTEGRACAO_ATENDIMENTO_IA;
if (!url) throw new Error("DATABASE_URL_INTEGRACAO_ATENDIMENTO_IA_AUSENTE");
const alvo = new URL(url);
if (
  !["127.0.0.1", "localhost"].includes(alvo.hostname) ||
  alvo.pathname !== "/nuu_integracao_0003_rag"
) {
  throw new Error("ALVO_RAG_NAO_DESCARTAVEL");
}

const sql = new Client({ connectionString: url });
const prefixo = `it-rag-${randomUUID()}`;

after(async () => {
  await sql.query(
    `delete from atendimento_ia_conversas where identificador_sessao like $1`,
    [`${prefixo}%`],
  );
  await sql.query(
    `delete from atendimento_ia_documentos_institucionais where chave_estavel like $1`,
    [`${prefixo}%`],
  );
  await sql.query(`delete from "user" where id=$1`, [prefixo]);
  await sql.end();
  await encerrarBancoTransacionalIntegracao();
});

function vetor(texto: string) {
  const resultado = Array.from({ length: 1_536 }, () => 0);
  if (/troca|devolu/iu.test(texto)) resultado[0] = 1;
  else if (/retirada|entrega/iu.test(texto)) resultado[1] = 1;
  else resultado[2] = 1;
  return resultado;
}

test("integra documentos, pgvector, busca híbrida, versionamento e ausência segura", async () => {
  await sql.connect();
  await sql.query(
    `insert into "user" (id,name,email,email_verified,created_at,updated_at)
     values ($1,'Revisor RAG',$2,false,now(),now())`,
    [prefixo, `${prefixo}@local.invalid`],
  );
  const conversa = randomUUID();
  const mensagem = randomUUID();
  const execucao = randomUUID();
  await sql.query(
    `insert into atendimento_ia_conversas
       (id,usuario_id,identificador_sessao,canal,status,ultima_atividade_em,criado_em,atualizado_em)
     values ($1,$2,$3,'site','ativa',now(),now(),now())`,
    [conversa, prefixo, `${prefixo}-sessao`],
  );
  await sql.query(
    `insert into atendimento_ia_mensagens
       (id,conversa_id,chave_idempotencia,autor,conteudo,status,criado_em,atualizado_em)
     values ($1,$2,$3,'cliente','Como funciona a troca?','processando',now(),now())`,
    [mensagem, conversa, `${prefixo}-mensagem`],
  );
  await sql.query(
    `insert into atendimento_ia_execucoes
       (id,conversa_id,mensagem_id,modelo,status,iniciado_em,criado_em,atualizado_em)
     values ($1,$2,$3,'teste-rag','processando',now(),now(),now())`,
    [execucao, conversa, mensagem],
  );

  const repositorio = new RepositorioConhecimentoInstitucionalDrizzle();
  const configuracao = configuracaoRagSchema.parse({});
  let chamadasEmbedding = 0;
  const cliente: ClienteEmbeddingsRag = {
    async gerar({ entradas }) {
      chamadasEmbedding += 1;
      return entradas.map(vetor);
    },
  };

  const baseVazia = await recuperarFontesInstitucionais(
    { clienteEmbeddings: cliente, configuracao, ragAtivo: true, repositorio },
    { execucaoId: execucao, pergunta: "Qual é a política de troca?" },
  );
  assert.equal(baseVazia.status, "fonte_ausente");
  assert.equal(chamadasEmbedding, 0);

  const v1 = await criarDocumentoInstitucional(repositorio, {
    categoria: "trocas_devolucoes",
    chaveEstavel: `${prefixo}-trocas`,
    conteudo: "# Trocas\n\nA solicitação de troca deve seguir a política oficial publicada.",
    origem: "fixture-local-descartavel",
    titulo: "Política de trocas",
  });
  assert.equal(v1.versao.estado, "rascunho");
  assert.equal(v1.versao.versao, 1);
  assert.equal(await repositorio.possuiBasePublicadaCompativel({ dimensao: 1_536, modelo: "text-embedding-3-small" }), false);
  await repositorio.enviarParaRevisao(v1.versao.id);
  const publicada1 = await publicarDocumentoInstitucional({
    clienteEmbeddings: cliente,
    configuracao,
    repositorio,
    responsavelRevisaoId: prefixo,
    versaoId: v1.versao.id,
  });
  assert.equal(publicada1.idempotente, false);
  const chamadasDepoisPublicacao = chamadasEmbedding;
  const repetida = await publicarDocumentoInstitucional({
    clienteEmbeddings: cliente,
    configuracao,
    repositorio,
    responsavelRevisaoId: prefixo,
    versaoId: v1.versao.id,
  });
  assert.equal(repetida.idempotente, true);
  assert.equal(chamadasEmbedding, chamadasDepoisPublicacao);

  const execucaoBusca = randomUUID();
  await sql.query(
    `insert into atendimento_ia_execucoes
       (id,conversa_id,mensagem_id,modelo,status,iniciado_em,criado_em,atualizado_em)
     values ($1,$2,$3,'teste-rag','processando',now(),now(),now())`,
    [execucaoBusca, conversa, mensagem],
  );
  const encontrada = await recuperarFontesInstitucionais(
    { clienteEmbeddings: cliente, configuracao, ragAtivo: true, repositorio },
    { execucaoId: execucaoBusca, pergunta: "Qual é a política de troca?" },
  );
  assert.equal(encontrada.status, "fonte_encontrada");
  assert.equal(encontrada.fontes.length, 1);
  assert.equal(encontrada.fontes[0]?.versao, 1);
  assert.ok((encontrada.fontes[0]?.pontuacaoFinal ?? 0) >= 0.7);

  const v2 = await criarDocumentoInstitucional(repositorio, {
    categoria: "trocas_devolucoes",
    chaveEstavel: `${prefixo}-trocas`,
    conteudo: "# Trocas\n\nA política oficial de troca foi revisada e substitui a versão anterior.",
    origem: "fixture-local-descartavel",
    titulo: "Política de trocas revisada",
  });
  assert.equal(v2.versao.versao, 2);
  await repositorio.enviarParaRevisao(v2.versao.id);
  await assert.rejects(
    publicarDocumentoInstitucional({
      clienteEmbeddings: { async gerar() { throw new Error("FALHA_FIXTURE"); } },
      configuracao,
      repositorio,
      responsavelRevisaoId: prefixo,
      versaoId: v2.versao.id,
    }),
    /FALHA_FIXTURE/,
  );
  const estadoAposFalha = await sql.query<{ ativos: string; versao: number }>(
    `select v.versao,count(f.id)::text ativos
     from atendimento_ia_documento_versoes v
     join atendimento_ia_fragmentos_institucionais f on f.versao_documento_id=v.id
     where v.documento_id=$1 and f.ativo=true group by v.versao`,
    [v1.documento.id],
  );
  assert.deepEqual(estadoAposFalha.rows, [{ ativos: "1", versao: 1 }]);

  const concorrentes = await Promise.allSettled([
    publicarDocumentoInstitucional({ clienteEmbeddings: cliente, configuracao, repositorio, responsavelRevisaoId: prefixo, versaoId: v2.versao.id }),
    publicarDocumentoInstitucional({ clienteEmbeddings: cliente, configuracao, repositorio, responsavelRevisaoId: prefixo, versaoId: v2.versao.id }),
  ]);
  assert.equal(concorrentes.filter((item) => item.status === "fulfilled").length, 1);
  const publicadas = await sql.query<{ estado: string; versao: number }>(
    `select versao,estado from atendimento_ia_documento_versoes
     where documento_id=$1 order by versao`,
    [v1.documento.id],
  );
  assert.deepEqual(publicadas.rows, [
    { estado: "desativado", versao: 1 },
    { estado: "publicado", versao: 2 },
  ]);

  await repositorio.desativar(v2.versao.id);
  assert.equal(await repositorio.possuiBasePublicadaCompativel({ dimensao: 1_536, modelo: "text-embedding-3-small" }), false);
  const rastreio = await sql.query(
    `select count(*) from atendimento_ia_buscas_rag where execucao_id in ($1,$2)`,
    [execucao, execucaoBusca],
  );
  assert.equal(Number(rastreio.rows[0]?.count), 2);
});
