import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after, before, describe } from "node:test";

import { Client } from "pg";

/**
 * Isolamento entre execuções da API, verificado contra o SCHEMA REAL.
 *
 * Roda apenas quando `DATABASE_URL_TESTE_ISOLAMENTO` aponta para um Postgres
 * descartável em localhost — nunca contra desenvolvimento e nunca contra
 * produção. Sem a variável, os testes são pulados em vez de escreverem em
 * qualquer banco por engano.
 *
 * Preparo do banco descartável:
 *
 *   docker run -d --name nuu-isolamento -e POSTGRES_PASSWORD=teste \
 *     -e POSTGRES_DB=nuu_isolamento -p 55435:5432 pgvector/pgvector:pg16
 *   # aplicar ./drizzle nele
 *   DATABASE_URL_TESTE_ISOLAMENTO=postgresql://postgres:teste@localhost:55435/nuu_isolamento \
 *     npx tsx --test src/features/fornecedores/integracoes/laquila/queries/isolamento-execucoes-api.integracao.testes.ts
 */
const url = process.env.DATABASE_URL_TESTE_ISOLAMENTO?.trim();
const hostname = url ? new URL(url).hostname : "";
const destinoPermitido =
  Boolean(url) && (hostname === "localhost" || hostname === "127.0.0.1");

const fornecedorId = randomUUID();
const integracaoId = randomUUID();
const importacaoA = randomUUID();
const importacaoB = randomUUID();
const CODIGO = "ABC-1";

let cliente: Client;

/** Cria um rascunho amarrado a uma execução, como o fluxo real faz. */
async function criarRascunho({
  importacaoId,
  status,
}: {
  importacaoId: string;
  status: string;
}) {
  const id = randomUUID();

  await cliente.query(
    `insert into produto_rascunhos
       (id, origem_tipo, origem_provedor, fornecedor_id, integracao_api_id,
        codigo_fornecedor, nome, status, dados_origem_json)
     values ($1, 'fornecedor_api', 'laquila', $2, $3, $4, 'Produto', $5,
             jsonb_build_object('origemFluxoFornecedor',
               jsonb_build_object('importacaoId', $6::text)))`,
    [id, fornecedorId, integracaoId, CODIGO, status, importacaoId],
  );

  return id;
}

/** Fila ativa da Conciliação: publicado e ignorado ficam de fora. */
async function filaAtiva(importacaoId: string) {
  const resultado = await cliente.query<{ total: number }>(
    `select count(*)::int as total from produto_rascunhos
      where origem_tipo = 'fornecedor_api'
        and origem_provedor = 'laquila'
        and status in ('rascunho','pendente_conciliacao','pronto_para_publicar')
        and dados_origem_json->'origemFluxoFornecedor'->>'importacaoId' = $1`,
    [importacaoId],
  );

  return resultado.rows[0].total;
}

describe(
  "isolamento entre execuções da API Laquila",
  { skip: !destinoPermitido },
  () => {
    before(async () => {
      cliente = new Client({ connectionString: url });
      await cliente.connect();

      await cliente.query(
        "insert into fornecedores (id, nome, tipo_integracao, status) values ($1, 'Laquila Teste', 'api', 'ativo')",
        [fornecedorId],
      );
      await cliente.query(
        `insert into fornecedor_integracoes_api (id, fornecedor_id, provedor, url_base, cnpj_empresa)
       values ($1, $2, 'laquila', 'https://exemplo.teste', '00000000000000')`,
        [integracaoId, fornecedorId],
      );

      for (const id of [importacaoA, importacaoB]) {
        await cliente.query(
          `insert into importacoes_fornecedor (id, fornecedor_id, tipo_arquivo, status, configuracao_fluxo_json)
         values ($1, $2, 'api', 'em_staging', jsonb_build_object('origem','api','provedor','laquila'))`,
          [id, fornecedorId],
        );
        await cliente.query(
          `insert into fornecedor_produtos_api_staging
           (integracao_api_id, importacao_id, codigo_fornecedor, nome_produto, ultima_consulta_em)
         values ($1, $2, $3, 'Produto da execução', now())`,
          [integracaoId, id, CODIGO],
        );
      }
    });

    after(async () => {
      // Só as fixtures deste teste; o cascade da execução leva o staging junto.
      await cliente.query(
        "delete from produto_rascunhos where integracao_api_id = $1",
        [integracaoId],
      );
      await cliente.query(
        "delete from importacoes_fornecedor where fornecedor_id = $1",
        [fornecedorId],
      );
      await cliente.query(
        "delete from fornecedor_integracoes_api where id = $1",
        [integracaoId],
      );
      await cliente.query("delete from fornecedores where id = $1", [
        fornecedorId,
      ]);
      await cliente.end();
    });

    test("CENÁRIO B: o mesmo código existe nas duas execuções sem conflito", async () => {
      const resultado = await cliente.query<{
        total: number;
        execucoes: number;
      }>(
        `select count(*)::int as total, count(distinct importacao_id)::int as execucoes
         from fornecedor_produtos_api_staging
        where integracao_api_id = $1 and codigo_fornecedor = $2`,
        [integracaoId, CODIGO],
      );

      assert.equal(resultado.rows[0].total, 2);
      assert.equal(resultado.rows[0].execucoes, 2);
    });

    test("CENÁRIO B: staging de uma execução não vaza para a outra", async () => {
      const daA = await cliente.query<{ total: number }>(
        "select count(*)::int as total from fornecedor_produtos_api_staging where importacao_id = $1",
        [importacaoA],
      );

      assert.equal(daA.rows[0].total, 1);
    });

    test("CENÁRIO A: rascunho pertence à execução que o criou", async () => {
      await criarRascunho({
        importacaoId: importacaoA,
        status: "pendente_conciliacao",
      });

      assert.equal(await filaAtiva(importacaoA), 1);
      assert.equal(await filaAtiva(importacaoB), 0);
    });

    test("CENÁRIO C: publicado sai da fila da própria execução", async () => {
      const rascunhoId = await criarRascunho({
        importacaoId: importacaoA,
        status: "pronto_para_publicar",
      });

      assert.equal(await filaAtiva(importacaoA), 2);

      await cliente.query(
        "update produto_rascunhos set status = 'publicado' where id = $1",
        [rascunhoId],
      );

      assert.equal(await filaAtiva(importacaoA), 1);
    });

    test("CENÁRIO D: o mesmo produto reaparece na execução seguinte", async () => {
      await criarRascunho({
        importacaoId: importacaoB,
        status: "pendente_conciliacao",
      });

      // A #B tem o item de volta; a #A continua com o que tinha, sem alteração.
      assert.equal(await filaAtiva(importacaoB), 1);
      assert.equal(await filaAtiva(importacaoA), 1);
    });

    test("ignorado sai da fila mas permanece no histórico da execução", async () => {
      const rascunhoId = await criarRascunho({
        importacaoId: importacaoB,
        status: "pendente_conciliacao",
      });
      await cliente.query(
        "update produto_rascunhos set status = 'ignorado' where id = $1",
        [rascunhoId],
      );

      assert.equal(await filaAtiva(importacaoB), 1);

      const historico = await cliente.query<{ total: number }>(
        `select count(*)::int as total from produto_rascunhos
        where dados_origem_json->'origemFluxoFornecedor'->>'importacaoId' = $1`,
        [importacaoB],
      );
      assert.equal(historico.rows[0].total, 2);
    });

    test("linhas legadas sem execução ficam fora de qualquer ciclo", async () => {
      await cliente.query(
        `insert into fornecedor_produtos_api_staging
         (integracao_api_id, codigo_fornecedor, nome_produto, ultima_consulta_em)
       values ($1, 'LEGADO-1', 'Produto legado', now())`,
        [integracaoId],
      );

      const porExecucao = await cliente.query<{ total: number }>(
        `select count(*)::int as total from fornecedor_produtos_api_staging
        where importacao_id in ($1, $2)`,
        [importacaoA, importacaoB],
      );
      const legado = await cliente.query<{ total: number }>(
        `select count(*)::int as total from fornecedor_produtos_api_staging
        where integracao_api_id = $1 and importacao_id is null`,
        [integracaoId],
      );

      assert.equal(porExecucao.rows[0].total, 2);
      assert.equal(legado.rows[0].total, 1);
    });
  },
);
