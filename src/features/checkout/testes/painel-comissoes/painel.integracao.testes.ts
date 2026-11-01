import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import test from "node:test";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { subirPostgresDescartavel } from "../../../../../scripts/lib/postgres-docker-descartavel";
import { prepararFixturePainel } from "./fixture-painel";
test("Etapa 7: leitura histórica, isolamento e quitação manual", async (t) => {
  const postgres = await subirPostgresDescartavel("nuu-etapa7-painel");
  let pool: Pool | undefined,
    poolLeitura: Pool | undefined,
    encerrar: (() => Promise<void>) | undefined;
  try {
    const url = await postgres.criarBanco("painel_etapa7");
    await postgres.confirmarIdentidade(url, "painel_etapa7");
    pool = new Pool({ connectionString: url });
    await migrate(drizzle(pool), {
      migrationsFolder: "./drizzle",
      migrationsSchema: "drizzle_v2",
      migrationsTable: "__drizzle_migrations",
    });
    const fixture = await prepararFixturePainel(pool);
    process.env.DATABASE_URL = url;
    process.env.NOOO_BANCO = "local";
    process.env.APP_ENVIRONMENT = "homologacao";
    process.env.BETTER_AUTH_URL = "http://127.0.0.1:3002";
    process.env.BETTER_AUTH_SECRET =
      "fixture-etapa4-sem-credenciais-reais-0123456789";
    process.env.GOOGLE_CLIENT_ID = "fixture";
    process.env.GOOGLE_CLIENT_SECRET = "fixture";
    Object.assign(globalThis, { AsyncLocalStorage });
    const { db } = await import("@/db/connection");
    poolLeitura = (db as unknown as { $client: Pool }).$client;
    const transacional = await import("@/db/transaction");
    encerrar = transacional.encerrarBancoTransacionalIntegracao;
    const { auth } = await import("@/lib/auth");
    const { workAsyncStorage } = await import(
      "next/dist/server/app-render/work-async-storage.external"
    );
    const { workUnitAsyncStorage } = await import(
      "next/dist/server/app-render/work-unit-async-storage.external"
    );
    let usuario: string | null = "rep-a";
    t.mock.method(auth.api, "getSession", async () =>
      usuario
        ? {
            user: {
              id: usuario,
              name: "Fixture",
              email: `${usuario}@fixture.invalid`,
              emailVerified: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            session: {
              id: "fixture",
              userId: usuario,
              token: "fixture",
              expiresAt: new Date(Date.now() + 3600000),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          }
        : null,
    );
    const executar = <T>(acao: () => Promise<T>) =>
      workAsyncStorage.run(
        {
          route: "/fixture/etapa4",
          incrementalCache: {},
          pendingRevalidatedTags: [],
        } as unknown as Parameters<typeof workAsyncStorage.run>[0],
        () =>
          workUnitAsyncStorage.run(
            {
              type: "request",
              phase: "action",
              headers: new Headers({
                cookie: "better-auth.session_token=fixture",
              }),
            } as unknown as Parameters<typeof workUnitAsyncStorage.run>[0],
            acao,
          ),
      );

    const { listarComissoesPainel: listar } = await import(
      "../../queries/painel-comissoes/listar-comissoes"
    );
    const { detalharComissaoPainel: detalhar } = await import(
      "../../queries/painel-comissoes/detalhar-comissao"
    );
    const { registrarQuitacaoComissao: quitar } = await import(
      "../../actions/painel-comissoes/registrar-quitacao"
    );
    const data = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
    }).format(new Date());
    await t.test(
      "titularidade é aplicada antes de paginação, detalhes e totalizadores",
      async () => {
        usuario = "rep-a";
        const a = await executar(() => listar({}));
        assert.equal(a.total, 25);
        assert.equal(a.linhas.length, 20);
        assert.equal(a.totais.comissaoValida, "23000");
        assert.equal(a.totais.invalidada, "2000");
        assert.equal(a.totais.vendidoValido, "230000");
        assert.equal(a.totais.quitadaHistorica, "0");
        const p = await executar(() => listar({ pagina: 2 }));
        assert.equal(p.linhas.length, 5);
        assert.ok(!p.linhas.some((l) => a.linhas.some((r) => r.id === l.id)));
        await assert.rejects(
          executar(() => listar({ representanteId: "rep-b" })),
        );
        await assert.rejects(executar(() => detalhar(fixture.outra.id)));
        await assert.rejects(executar(() => detalhar(fixture.pendente.id)));
        const vazio = await executar(() =>
          listar({ fornecedorId: fixture.fornecedorB }),
        );
        assert.equal(vazio.total, 0);
        const payload = JSON.stringify([a, p]);
        for (const segredo of [
          "CLIENTE_SECRETO",
          "privado@fixture.invalid",
          "CPF_PRIVADO",
          "ENDERECO_PRIVADO",
          "Histórico de Beatriz",
          "pedidoId",
          "referencia",
          "observacao",
        ])
          assert.equal(payload.includes(segredo), false);
        usuario = "rep-b";
        const b = await executar(() => listar({}));
        assert.equal(b.total, 1);
        assert.equal(b.linhas[0].id, fixture.outra.id);
        await assert.rejects(executar(() => detalhar(fixture.valida.id)));
      },
    );
    await t.test(
      "histórico não usa preço, regra, visibilidade ou destinatário atuais",
      async () => {
        usuario = "rep-a";
        const a = await executar(() => detalhar(fixture.valida.id));
        assert.equal(a.linha.produto, "Produto percentual histórico");
        assert.equal(a.linha.sku, "SKU-VENDA");
        assert.equal(a.linha.fornecedor, "Embrater");
        assert.equal(a.regra.valor, 1000);
        assert.equal(a.linha.comissaoCentavos, "1000");
        const f = await executar(() => detalhar(fixture.fixa.id));
        assert.equal(f.regra.tipo, "fixa");
        assert.equal(f.regra.valor, 500);
        assert.equal(f.linha.quantidade, 2);
        assert.equal(f.linha.comissaoCentavos, "1000");
        const cancelada = await executar(() => detalhar(fixture.cancelada.id));
        assert.equal(cancelada.linha.situacao, "cancelada");
        assert.equal(
          (await executar(() => detalhar(fixture.estornada.id))).linha.situacao,
          "estornada",
        );
      },
    );
    await t.test(
      "gestor filtra períodos, titulares, fornecedores, busca e estado no servidor",
      async () => {
        usuario = "gestor";
        assert.equal((await executar(() => listar({}))).total, 27);
        const b = await executar(() =>
          listar({
            representanteId: "rep-b",
            fornecedorId: fixture.fornecedorB,
          }),
        );
        assert.equal(b.total, 1);
        assert.equal(
          (await executar(() => listar({ situacao: "aguardando_confirmacao" })))
            .total,
          1,
        );
        assert.equal(
          (await executar(() => listar({ situacao: "cancelada" }))).total,
          1,
        );
        assert.equal(
          (
            await executar(() =>
              listar({ de: "2027-01-01", ate: "2027-01-31" }),
            )
          ).total,
          0,
        );
        assert.equal(
          (
            await executar(() =>
              listar({ de: "2026-01-10", ate: "2026-01-10" }),
            )
          ).total,
          27,
        );
        assert.equal(
          (await executar(() => listar({ busca: "Produto fixo histórico" })))
            .total,
          1,
        );
        usuario = "comum";
        await assert.rejects(executar(() => listar({})));
        usuario = null;
        await assert.rejects(executar(() => listar({})));
      },
    );
    await t.test(
      "só gestor quita; valor vem do snapshot e concorrência não duplica",
      async () => {
        usuario = "rep-a";
        assert.equal(
          (
            await executar(() =>
              quitar({ comissaoId: fixture.valida.id, data }),
            )
          ).sucesso,
          false,
        );
        usuario = "gestor";
        assert.equal(
          (
            await executar(() =>
              quitar({ comissaoId: fixture.cancelada.id, data }),
            )
          ).sucesso,
          false,
        );
        assert.equal(
          (
            await executar(() =>
              quitar({ comissaoId: fixture.estornada.id, data }),
            )
          ).sucesso,
          false,
        );
        assert.equal(
          (
            await executar(() =>
              quitar({ comissaoId: fixture.pendente.id, data }),
            )
          ).sucesso,
          false,
        );
        assert.equal(
          (
            await executar(() =>
              quitar({
                comissaoId: fixture.valida.id,
                data,
                valorEmCentavos: 1,
              }),
            )
          ).sucesso,
          false,
        );
        const antes = (
          await pool!.query(
            "SELECT snapshot FROM checkout_item_comissoes WHERE id=$1",
            [fixture.valida.id],
          )
        ).rows[0].snapshot;
        const tentativas = await Promise.all([
          executar(() =>
            quitar({
              comissaoId: fixture.valida.id,
              data,
              referencia: "REF_INTERNA",
              observacao: "OBS_INTERNA",
            }),
          ),
          executar(() =>
            quitar({
              comissaoId: fixture.valida.id,
              data,
              referencia: "NAO_SUBSTITUIR",
            }),
          ),
        ]);
        assert.ok(tentativas.every((r) => r.sucesso));
        assert.equal(
          tentativas.filter((r) => r.sucesso && !r.dados.jaExistia).length,
          1,
        );
        assert.equal(
          (
            await pool!.query(
              "SELECT count(*)::int AS n FROM checkout_item_comissao_quitacoes WHERE comissao_id=$1",
              [fixture.valida.id],
            )
          ).rows[0].n,
          1,
        );
        assert.deepEqual(
          (
            await pool!.query(
              "SELECT snapshot FROM checkout_item_comissoes WHERE id=$1",
              [fixture.valida.id],
            )
          ).rows[0].snapshot,
          antes,
        );
        usuario = "rep-a";
        const d = await executar(() => detalhar(fixture.valida.id));
        assert.equal(d.linha.situacao, "quitada");
        assert.equal(d.quitacao?.valorCentavos, "1000");
        assert.equal(
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
          }).format(new Date(d.quitacao!.data)),
          data,
          "Data externa preservada no fuso brasileiro",
        );
        const json = JSON.stringify(d);
        assert.equal(json.includes("REF_INTERNA"), false);
        assert.equal(json.includes("OBS_INTERNA"), false);
        assert.equal(json.includes("NAO_SUBSTITUIR"), false);
        assert.equal(d.quitacao?.gestao, undefined);
        assert.equal(
          (await executar(() => listar({}))).totais.aReceber,
          "22000",
        );
      },
    );
    await t.test(
      "invalidação posterior preserva quitação e não conta como comissão válida",
      async () => {
        await pool!.query(
          "UPDATE checkout_pedidos SET status='refunded' WHERE id=$1",
          [fixture.valida.pedidoId],
        );
        await pool!.query(
          "INSERT INTO checkout_item_comissao_eventos(comissao_id,tipo) VALUES($1,'estornada')",
          [fixture.valida.id],
        );
        usuario = "rep-a";
        const d = await executar(() => detalhar(fixture.valida.id));
        assert.equal(d.linha.situacao, "estornada");
        assert.ok(d.quitacao);
        const t = await executar(() => listar({}));
        assert.equal(t.totais.comissaoValida, "22000");
        assert.equal(t.totais.invalidada, "3000");
        assert.equal(t.totais.quitadaHistorica, "1000");
        usuario = "gestor";
        assert.equal(
          (
            await executar(() =>
              quitar({ comissaoId: fixture.valida.id, data }),
            )
          ).sucesso,
          false,
        );
      },
    );
    await t.test(
      "cancelamento concorrente vence a quitação sem duplicar ou alterar snapshot",
      async () => {
        usuario = "gestor";
        const registro = await fixture.criarRegistro();
        const conexao = await pool!.connect();
        try {
          await conexao.query("BEGIN");
          await conexao.query(
            "UPDATE checkout_pedidos SET status='canceled' WHERE id=$1",
            [registro.pedidoId],
          );
          const pendente = executar(() =>
            quitar({ comissaoId: registro.id, data }),
          );
          let bloqueou = false;
          for (let i = 0; i < 100; i++) {
            const r = await pool!.query(
              "SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type='Lock' AND query ILIKE '%checkout_pedidos%'",
            );
            if (r.rows[0].n) {
              bloqueou = true;
              break;
            }
            await new Promise((r) => setTimeout(r, 20));
          }
          assert.ok(bloqueou);
          await conexao.query("COMMIT");
          assert.equal((await pendente).sucesso, false);
        } finally {
          await conexao.query("ROLLBACK");
          conexao.release();
        }
        assert.equal(
          (
            await pool!.query(
              "SELECT count(*)::int AS n FROM checkout_item_comissao_quitacoes WHERE comissao_id=$1",
              [registro.id],
            )
          ).rows[0].n,
          0,
        );
      },
    );
    await t.test(
      "filtro de um dia usa meia-noite brasileira, sem invadir a véspera",
      async () => {
        usuario = "gestor";
        const datas = [
          "2026-03-05T02:59:59Z",
          "2026-03-05T03:00:00Z",
          "2026-03-06T02:59:59Z",
          "2026-03-06T03:00:00Z",
        ];
        const ids: string[] = [];
        for (const data of datas) {
          const r = await fixture.criarRegistro();
          ids.push(r.id);
          await pool!.query(
            "UPDATE checkout_item_comissoes SET created_at=$1 WHERE id=$2",
            [data, r.id],
          );
        }
        const resultado = await executar(() =>
          listar({ de: "2026-03-05", ate: "2026-03-05" }),
        );
        assert.deepEqual(
          new Set(resultado.linhas.map((l) => l.id)),
          new Set([ids[1], ids[2]]),
        );
      },
    );
    t.mock.restoreAll();
  } finally {
    await encerrar?.();
    await poolLeitura?.end();
    await pool?.end();
    await postgres.remover();
  }
});
