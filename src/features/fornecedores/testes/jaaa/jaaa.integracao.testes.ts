import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import test from "node:test";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { subirPostgresDescartavel } from "../../../../../scripts/lib/postgres-docker-descartavel";
import { prepararFixtureJaaa } from "./fixture-jaaa";
test("Etapa 8: identidade, atendimento explícito e isolamento Jaaa", async (t) => {
  const postgres = await subirPostgresDescartavel("nuu-etapa8-jaaa");
  let pool: Pool | undefined,
    poolLeitura: Pool | undefined,
    encerrar: (() => Promise<void>) | undefined;
  try {
    const url = await postgres.criarBanco("jaaa_etapa8");
    await postgres.confirmarIdentidade(url, "jaaa_etapa8");
    pool = new Pool({ connectionString: url });
    await migrate(drizzle(pool), {
      migrationsFolder: "./drizzle",
      migrationsSchema: "drizzle_v2",
      migrationsTable: "__drizzle_migrations",
    });
    const f = await prepararFixtureJaaa(pool);
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

    const { salvarIdentidadeJaaa: salvar } = await import(
      "../../actions/jaaa/salvar-identidade-jaaa"
    );
    const { salvarAtendimentoJaaa: escolher } = await import(
      "../../actions/jaaa/salvar-atendimento-jaaa"
    );
    const { resolverMeuDestinoJaaa: meu, resolverDestinoProdutoJaaa: produto } =
      await import("../../queries/jaaa/resolver-destinos-jaaa");
    const { consultarMeuJaaa: consultarMeu } = await import(
      "../../actions/jaaa/consultar-jaaa"
    );
    const {
      listarIdentidadesJaaaGestor: listar,
      listarProdutosAtendimentoJaaaGestor: listarProdutos,
    } = await import("../../queries/jaaa/listar-gestao-jaaa");
    const { buscarAtendimentoProdutoJaaaGestor: opcoes } = await import(
      "../../queries/jaaa/buscar-atendimento-produto-gestor"
    );
    const {
      redirecionarProdutoJaaa: redirecionar,
      redirecionarRepresentanteJaaa: redirecionarMeu,
    } = await import("../../queries/jaaa/redirecionar-atendimento-jaaa");
    const historico = async () =>
      JSON.stringify(
        (
          await pool!.query(
            "select id,snapshot,representante_usuario_id from checkout_item_comissoes order by id",
          )
        ).rows,
      );
    const anterior = await historico();
    const comissionado = (
      await pool.query(
        "select autorizacao_id from representantes_comissionados_produtos where produto_id=$1",
        [f.produtoId],
      )
    ).rows[0].autorizacao_id;
    await t.test(
      "sem configuração não há escolha implícita; somente gestor escreve",
      async () => {
        usuario = "rep-a";
        assert.equal(await executar(meu), null);
        assert.equal(await produto(f.produtoId), null);
        for (const ator of ["rep-a", "rep-b", "comum", null]) {
          usuario = ator;
          assert.equal(
            (
              await executar(() =>
                salvar({
                  usuarioId: "rep-b",
                  identidade: "invasor",
                  ativa: true,
                }),
              )
            ).sucesso,
            false,
          );
          assert.equal(
            (
              await executar(() =>
                escolher({
                  produtoId: f.produtoId,
                  autorizacaoId: f.autorizacaoB,
                }),
              )
            ).sucesso,
            false,
          );
          await assert.rejects(executar(() => listar({})));
        }
        usuario = "gestor";
        for (const identidade of [
          "javascript:alert(1)",
          "https://falso.invalid/@usuario",
          "//falso.invalid",
          "nome?pedido=1",
        ]) {
          assert.equal(
            (
              await executar(() =>
                salvar({ usuarioId: "rep-a", identidade, ativa: true }),
              )
            ).sucesso,
            false,
          );
        }
        assert.equal(
          (
            await executar(() =>
              salvar({
                usuarioId: "comum",
                identidade: "usuario_comum",
                ativa: true,
              }),
            )
          ).sucesso,
          false,
        );
        for (const [usuarioId, identidade] of [
          ["rep-a", " @Fernando_Embrater "],
          ["rep-b", "beatriz_atendimento"],
        ])
          assert.equal(
            (
              await executar(() =>
                salvar({ usuarioId, identidade, ativa: true }),
              )
            ).sucesso,
            true,
          );
        assert.equal(await produto(f.produtoId), null);
        const r = await executar(() => listar({ busca: "Fernando" }));
        assert.equal(r.total, 1);
        assert.equal(r.linhas[0].identidade, "fernando_embrater");
        assert.equal((await executar(() => listarProdutos({}))).total, 1);
      },
    );
    await t.test(
      "titular vem da sessão; IDs de outro representante e payloads extras são recusados",
      async () => {
        usuario = "rep-a";
        assert.equal(
          await executar(meu),
          "https://jaaa.com.br/@fernando_embrater",
        );
        await assert.rejects(
          executar(() => consultarMeu({ usuarioId: "rep-b" })),
        );
        usuario = "rep-b";
        assert.equal(
          await executar(meu),
          "https://jaaa.com.br/@beatriz_atendimento",
        );
        await assert.rejects(executar(() => opcoes(f.produtoId)));
        usuario = "comum";
        await assert.rejects(executar(meu));
        usuario = null;
        await assert.rejects(executar(meu));
      },
    );
    await t.test(
      "gestor escolhe atendimento independente da comissão e preserva todos os snapshots",
      async () => {
        usuario = "gestor";
        assert.equal(
          (await executar(() => opcoes(f.produtoId))).opcoes.length,
          2,
        );
        assert.equal(
          (
            await executar(() =>
              escolher({
                produtoId: f.produtoId,
                autorizacaoId: f.autorizacaoA,
              }),
            )
          ).sucesso,
          true,
        );
        assert.equal(
          await produto(f.produtoId),
          "https://jaaa.com.br/@fernando_embrater",
        );
        const r = await redirecionar(
          new Request("http://localhost:3001/api/jaaa/produto/" + f.produtoId),
          f.produtoId,
        );
        assert.equal(r.status, 303);
        assert.equal(
          r.headers.get("location"),
          "https://jaaa.com.br/@fernando_embrater",
        );
        assert.equal(r.headers.get("cache-control"), "no-store");
        assert.equal(r.headers.get("referrer-policy"), "no-referrer");
        assert.equal(
          (
            await executar(() =>
              escolher({
                produtoId: f.produtoId,
                autorizacaoId: f.autorizacaoB,
              }),
            )
          ).sucesso,
          true,
        );
        assert.equal(
          await produto(f.produtoId),
          "https://jaaa.com.br/@beatriz_atendimento",
        );
        assert.equal(await historico(), anterior);
        assert.equal(
          (
            await pool!.query(
              "select autorizacao_id from representantes_comissionados_produtos where produto_id=$1",
              [f.produtoId],
            )
          ).rows[0].autorizacao_id,
          comissionado,
        );
        const url = new URL((await produto(f.produtoId))!);
        assert.equal(url.search, "");
        assert.equal(url.hash, "");
        assert.equal(url.origin, "https://jaaa.com.br");
        const adulterada = await redirecionar(
          new Request(
            "http://localhost:3001/api/jaaa/produto/" +
              f.produtoId +
              "?next=https://falso.invalid&usuarioId=rep-a",
          ),
          f.produtoId,
        );
        assert.equal(adulterada.headers.get("location"), "/contato");
        assert.equal(
          (
            await redirecionar(
              new Request("http://localhost:3001/api/jaaa/produto/invalido"),
              "invalido",
            )
          ).headers.get("location"),
          "/contato",
        );
      },
    );
    await t.test(
      "revogação e indisponibilidade impedem novo destino, inclusive no clique de link antigo",
      async () => {
        const cenarios = [
          [
            "UPDATE identidades_jaaa_representantes SET ativa=false WHERE usuario_id='rep-b'",
            "UPDATE identidades_jaaa_representantes SET ativa=true WHERE usuario_id='rep-b'",
          ],
          [
            "UPDATE administradores SET status='desativado' WHERE usuario_id='rep-b'",
            "UPDATE administradores SET status='ativo' WHERE usuario_id='rep-b'",
          ],
          [
            "UPDATE representantes_fornecedores SET ativo=false WHERE usuario_id='rep-b'",
            "UPDATE representantes_fornecedores SET ativo=true WHERE usuario_id='rep-b'",
          ],
          [
            "UPDATE fornecedores SET status='inativo' WHERE id=$1",
            "UPDATE fornecedores SET status='ativo' WHERE id=$1",
            f.fornecedorB,
          ],
          [
            "UPDATE autorizacoes_produtos_representantes SET ativa=false WHERE id=$1",
            "UPDATE autorizacoes_produtos_representantes SET ativa=true WHERE id=$1",
            f.autorizacaoB,
          ],
          [
            "UPDATE fornecedor_produto_vinculos SET status='inativo' WHERE fornecedor_id=$1",
            "UPDATE fornecedor_produto_vinculos SET status='ativo' WHERE fornecedor_id=$1",
            f.fornecedorB,
          ],
          [
            "UPDATE product SET status='draft' WHERE id=$1",
            "UPDATE product SET status='published' WHERE id=$1",
            f.produtoId,
          ],
          [
            "UPDATE product SET is_active=false WHERE id=$1",
            "UPDATE product SET is_active=true WHERE id=$1",
            f.produtoId,
          ],
          [
            "UPDATE product_pricing SET is_active=false WHERE product_id=$1",
            "UPDATE product_pricing SET is_active=true WHERE product_id=$1",
            f.produtoId,
          ],
        ];
        usuario = "gestor";
        for (const [inativar, restaurar, id] of cenarios) {
          await pool!.query(inativar, id ? [id] : []);
          try {
            assert.equal(await produto(f.produtoId), null, inativar);
            assert.equal(
              (
                await redirecionar(
                  new Request(
                    "http://localhost:3001/api/jaaa/produto/" + f.produtoId,
                  ),
                  f.produtoId,
                )
              ).headers.get("location"),
              "/contato",
            );
            assert.equal(
              (
                await executar(() =>
                  escolher({
                    produtoId: f.produtoId,
                    autorizacaoId: f.autorizacaoB,
                  }),
                )
              ).sucesso,
              inativar.includes(
                "product SET",
              ) /* rascunho/inativo pode ser configurado para futuro */,
            );
          } finally {
            await pool!.query(restaurar, id ? [id] : []);
          }
        }
        usuario = "rep-b";
        await pool!.query(
          "UPDATE representantes_fornecedores SET ativo=false WHERE usuario_id='rep-b'",
        );
        assert.equal(await executar(meu), null);
        await pool!.query(
          "UPDATE representantes_fornecedores SET ativo=true WHERE usuario_id='rep-b'",
        );
        usuario = "gestor";
        assert.equal(
          (
            await executar(() =>
              escolher({ produtoId: f.produtoId, autorizacaoId: null }),
            )
          ).sucesso,
          true,
        );
        assert.equal(await produto(f.produtoId), null);
      },
    );
    await t.test(
      "troca de nome público e desligamento não mudam histórico; auditoria e vínculo único",
      async () => {
        usuario = "gestor";
        assert.equal(
          (
            await executar(() =>
              salvar({
                usuarioId: "rep-a",
                identidade: "fernando_novo",
                ativa: true,
              }),
            )
          ).sucesso,
          true,
        );
        usuario = "rep-a";
        assert.equal(await executar(meu), "https://jaaa.com.br/@fernando_novo");
        const r = await executar(() =>
          redirecionarMeu(
            new Request(
              "http://localhost:3001/api/jaaa/representante?usuarioId=rep-b",
            ),
          ),
        );
        assert.equal(r.status, 403);
        usuario = "gestor";
        assert.equal(
          (
            await executar(() =>
              salvar({
                usuarioId: "rep-a",
                identidade: "fernando_novo",
                ativa: false,
              }),
            )
          ).sucesso,
          true,
        );
        usuario = "rep-a";
        assert.equal(await executar(meu), null);
        assert.equal(await historico(), anterior);
        assert.equal(
          (
            await pool!.query(
              "select count(*)::int n from identidades_jaaa_representantes where usuario_id='rep-a'",
            )
          ).rows[0].n,
          1,
        );
        assert.ok(
          (
            await pool!.query(
              "select count(*)::int n from auditorias_administrativas where acao like 'representantes.%jaaa%'",
            )
          ).rows[0].n >= 5,
        );
      },
    );

    await t.test(
      "produto sem autorização não aceita atendente de outro produto; paginação ocorre no servidor",
      async () => {
        usuario = "gestor";
        const novo = (
          await pool!.query(
            "INSERT INTO product(category_id,marca_id,name,slug,sku,description,status) SELECT category_id,marca_id,'Produto comum','produto-comum','COMUM','Descrição','published' FROM product WHERE id=$1 RETURNING id",
            [f.produtoId],
          )
        ).rows[0].id;
        assert.equal(
          (
            await executar(() =>
              escolher({ produtoId: novo, autorizacaoId: f.autorizacaoA }),
            )
          ).sucesso,
          false,
        );
        assert.equal(await produto(novo), null);
        await pool!.query(
          `INSERT INTO "user"(id,name,email,email_verified,created_at,updated_at) SELECT 'extra-'||n,'Extra '||n,'extra-'||n||'@fixture.invalid',false,now(),now() FROM generate_series(1,21) n`,
        );
        await pool!.query(
          `INSERT INTO representantes_fornecedores(usuario_id,fornecedor_id,ativo,criado_por_usuario_id,atualizado_por_usuario_id) SELECT 'extra-'||n,$1,false,'gestor','gestor' FROM generate_series(1,21) n`,
          [f.fornecedorA],
        );
        const primeira = await executar(() => listar({})),
          segunda = await executar(() => listar({ pagina: 2 }));
        assert.equal(primeira.total, 23);
        assert.equal(primeira.linhas.length, 20);
        assert.equal(segunda.linhas.length, 3);
        assert.ok(
          !primeira.linhas.some((a) =>
            segunda.linhas.some((b) => a.id === b.id),
          ),
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
