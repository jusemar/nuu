import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { CATALOGO_PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

import {
  criarRecorteMigrations,
  subirPostgresDescartavel,
} from "../../../../../scripts/lib/postgres-docker-descartavel";

/** Testes exclusivos da Etapa 5. Nunca usa .env para escolher o banco. */
test("Etapa 5: configuração, atribuição, ocultação e preço em PostgreSQL descartável", async (t) => {
  const postgres = await subirPostgresDescartavel("nuu-etapa5-comissoes");
  let pool: Pool | undefined;
  let encerrar: (() => Promise<void>) | undefined;
  let poolLeitura: Pool | undefined;
  const recorte = criarRecorteMigrations("./drizzle", 60);
  try {
    const url = await postgres.criarBanco("representantes_etapa5");
    await postgres.confirmarIdentidade(url, "representantes_etapa5");
    pool = new Pool({ connectionString: url });
    const banco = drizzle(pool);
    const migracoes = {
      migrationsSchema: "drizzle_v2",
      migrationsTable: "__drizzle_migrations",
    };
    await migrate(banco, { ...migracoes, migrationsFolder: recorte.pasta });
    const fornecedorA = randomUUID(),
      fornecedorB = randomUUID(),
      categoria = randomUUID(),
      marca = randomUUID(),
      vinculoA = randomUUID(),
      vinculoB = randomUUID(),
      vinculoExtra = randomUUID(),
      adminA = randomUUID(),
      adminB = randomUUID(),
      adminGestor = randomUUID();
    await pool.query(
      `INSERT INTO "user" (id,name,email,email_verified,created_at,updated_at) VALUES ('rep-a','Fernando','a@fixture.invalid',false,now(),now()),('rep-b','Outro','b@fixture.invalid',false,now(),now()),('gestor','Gestor','gestor@fixture.invalid',false,now(),now()),('comum','Cliente','cliente@fixture.invalid',false,now(),now())`,
    );
    await pool.query(
      "INSERT INTO administradores(id,usuario_id,administrador_principal) VALUES($1,'rep-a',false),($2,'rep-b',false),($3,'gestor',true)",
      [adminA, adminB, adminGestor],
    );
    await pool.query(
      "INSERT INTO fornecedores(id,nome,tipo_integracao,status) VALUES($1,'Embrater','api','ativo'),($2,'Outro fornecedor','api','ativo')",
      [fornecedorA, fornecedorB],
    );
    await pool.query(
      "INSERT INTO representantes_fornecedores(id,usuario_id,fornecedor_id,ativo,criado_por_usuario_id,atualizado_por_usuario_id) VALUES($1,'rep-a',$4,true,'gestor','gestor'),($2,'rep-b',$4,true,'gestor','gestor'),($3,'rep-a',$5,true,'gestor','gestor')",
      [vinculoA, vinculoB, vinculoExtra, fornecedorA, fornecedorB],
    );
    await pool.query(
      "INSERT INTO category(id,name,slug) VALUES($1,'Categoria fixture','categoria-fixture')",
      [categoria],
    );
    await pool.query(
      "INSERT INTO marca(id,nome,slug) VALUES($1,'Nooo','nooo')",
      [marca],
    );
    await pool.query(
      "INSERT INTO marca(id,nome,slug) VALUES($1,'Genérico','generico')",
      [randomUUID()],
    );
    for (const { chave } of CATALOGO_PERMISSOES_ADMIN)
      await pool.query(
        "INSERT INTO permissoes_administrativas(chave,nome,modulo) VALUES($1,$1,'fixture') ON CONFLICT(chave) DO NOTHING",
        [chave],
      );
    for (const id of [adminA, adminB])
      await pool.query(
        "INSERT INTO administradores_permissoes(administrador_id,permissao_id,efeito) SELECT $1,id,'permitir' FROM permissoes_administrativas",
        [id],
      );

    const produtoA = randomUUID(),
      produtoB = randomUUID(),
      autorizacaoA = randomUUID(),
      autorizacaoB = randomUUID();
    for (const [id, nome, sku] of [
      [produtoA, "Produto A", "SKU-A"],
      [produtoB, "Produto B", "SKU-B"],
    ]) {
      await pool.query(
        "INSERT INTO product(id,category_id,marca_id,name,slug,sku,description) VALUES($1,$2,$3,$4,$5,$6,'Descrição fixture')",
        [id, categoria, marca, nome, id, sku],
      );
      await pool.query(
        "INSERT INTO product_variant(product_id,sku,price_in_cents,stock_quantity,is_default) VALUES($1,$2,10000,0,true)",
        [id, sku],
      );
      await pool.query(
        "INSERT INTO product_pricing(product_id,type,price_in_cents,is_active) VALUES($1,'dropshipping',10000,true)",
        [id],
      );
      await pool.query(
        "INSERT INTO fornecedor_produto_vinculos(fornecedor_id,produto_id,codigo_fornecedor) VALUES($1,$2,$3)",
        [fornecedorA, id, sku],
      );
    }
    await pool.query(
      "INSERT INTO autorizacoes_produtos_representantes(id,representante_fornecedor_id,produto_id,ativa,criado_por_usuario_id,atualizado_por_usuario_id,comissao_tipo,comissao_valor,comissao_visivel) VALUES($1,$2,$3,true,'gestor','gestor','percentual',1000,false),($4,$5,$3,true,'gestor','gestor','percentual',2000,false),($6,$5,$7,true,'gestor','gestor',null,null,false)",
      [
        autorizacaoA,
        vinculoA,
        produtoA,
        autorizacaoB,
        vinculoB,
        randomUUID(),
        produtoB,
      ],
    );
    await t.test(
      "0060 preserva configurações anteriores sem ativar direito implícito",
      async () => {
        const antes = (
          await pool!.query(
            "SELECT to_jsonb(t) AS registro FROM autorizacoes_produtos_representantes t ORDER BY id",
          )
        ).rows;
        await migrate(banco, { ...migracoes, migrationsFolder: "./drizzle" });
        assert.deepEqual(
          (
            await pool!.query(
              "SELECT to_jsonb(t)-'comissao_ativa' AS registro FROM autorizacoes_produtos_representantes t ORDER BY id",
            )
          ).rows,
          antes,
        );
        assert.equal(
          (
            await pool!.query(
              "SELECT count(*)::int AS n FROM autorizacoes_produtos_representantes WHERE comissao_ativa",
            )
          ).rows[0].n,
          0,
        );
        await assert.rejects(
          pool!.query(
            "UPDATE autorizacoes_produtos_representantes SET comissao_ativa=true WHERE produto_id=$1",
            [produtoB],
          ),
        );
      },
    );
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

    const { configurarComissaoProdutoGestor, consultarComissoesProdutoGestor } =
      await import("../../actions/representantes/configurar-comissao-gestor");
    const { editarCampoProdutoRepresentante } = await import(
      "../../actions/representantes/editar-campo-produto-representante"
    );
    const { listarProdutosRepresentante } = await import(
      "../../queries/representantes/listar-produtos-representante"
    );
    const { prepararSnapshotComissaoAtribuida } = await import(
      "../../queries/representantes/preparar-snapshot-comissao-atribuida"
    );
    const atribuicao = {
      representanteId: "rep-a",
      representanteFornecedorId: vinculoA,
      fornecedorId: fornecedorA,
      produtoId: produtoA,
      autorizacaoId: autorizacaoA,
    };
    const item = {
      quantidade: 2,
      precoUnitarioVendidoCentavos: 10000,
      descontoItemCentavos: 2000,
      valorLiquidoItemCentavos: 18000,
    };
    const dadosSnapshot = {
      atribuicao,
      item,
      get ocorridoEm() {
        return new Date().toISOString();
      },
    };
    const config = {
      autorizacaoId: autorizacaoA,
      produtoId: produtoA,
      tipo: "percentual",
      valor: 1000,
      ativa: true,
      visivel: false,
    };
    const versao = async (id = produtoA) =>
      new Date(
        (
          await pool!.query(
            "SELECT updated_at::text AS versao FROM product WHERE id=$1",
            [id],
          )
        ).rows[0].versao + "Z",
      ).toISOString();
    const editar = async (id = produtoA, extra = {}) =>
      editarCampoProdutoRepresentante({
        fornecedorId: fornecedorA,
        produtoId: id,
        versao: await versao(id),
        alteracao: { campo: "precoCentavos", valor: 12000 },
        ...extra,
      });
    await t.test(
      "representante não cria, substitui, remove ou altera sua comissão",
      async () => {
        for (const mudanca of [
          {},
          { tipo: "fixa", valor: 9999 },
          { ativa: false },
          { visivel: true },
          { tipo: null, valor: null, ativa: false, visivel: false },
        ])
          assert.equal(
            (
              await executar(() =>
                configurarComissaoProdutoGestor({ ...config, ...mudanca }),
              )
            ).sucesso,
            false,
          );
        await assert.rejects(
          executar(() => consultarComissoesProdutoGestor(produtoA)),
        );
        await assert.rejects(
          executar(() => prepararSnapshotComissaoAtribuida(dadosSnapshot)),
        );
      },
    );
    await t.test(
      "gestor configura ativação/visibilidade independentes; comissão oculta não vaza",
      async () => {
        usuario = "gestor";
        assert.ok(
          (await executar(() => configurarComissaoProdutoGestor(config)))
            .sucesso,
        );
        for (const invalido of [
          { valor: 10001 },
          { valor: -1 },
          { tipo: "fixa", valor: -1 },
          { valor: 1.5 },
          { ativa: true, tipo: null, valor: null },
        ])
          assert.equal(
            (
              await executar(() =>
                configurarComissaoProdutoGestor({ ...config, ...invalido }),
              )
            ).sucesso,
            false,
          );
        usuario = "rep-a";
        const lista = await executar(() => listarProdutosRepresentante({}));
        assert.equal(lista.produtos.length, 1);
        assert.equal(lista.produtos[0].contextos[0].comissao, null);
        const payload = JSON.stringify(lista);
        for (const proibido of [
          "percentual",
          "comissaoAtiva",
          "comissaoValor",
          "comissaoTipo",
          "comissaoVisivel",
        ])
          assert.equal(payload.includes(proibido), false);
        usuario = "gestor";
        assert.ok(
          (
            await executar(() =>
              configurarComissaoProdutoGestor({ ...config, visivel: true }),
            )
          ).sucesso,
        );
        usuario = "rep-a";
        assert.deepEqual(
          (await executar(() => listarProdutosRepresentante({}))).produtos[0]
            .contextos[0].comissao,
          { tipo: "percentual", valor: 1000 },
        );
      },
    );
    await t.test(
      "atribuição única explícita e snapshot sobrevivem a alteração da regra",
      async () => {
        usuario = "gestor";
        assert.equal(
          await executar(() =>
            prepararSnapshotComissaoAtribuida({
              ...dadosSnapshot,
              atribuicao: null,
            }),
          ),
          null,
        );
        const primeiro = await executar(() =>
          prepararSnapshotComissaoAtribuida(dadosSnapshot),
        );
        assert.ok(primeiro);
        assert.equal(primeiro.comissaoCentavos, 1800);
        assert.ok(
          (
            await executar(() =>
              configurarComissaoProdutoGestor({ ...config, valor: 500 }),
            )
          ).sucesso,
        );
        await assert.rejects(
          executar(() =>
            prepararSnapshotComissaoAtribuida({
              ...dadosSnapshot,
              ocorridoEm: "2020-01-01T00:00:00.000Z",
            }),
          ),
        );
        const segundo = await executar(() =>
          prepararSnapshotComissaoAtribuida(dadosSnapshot),
        );
        assert.equal(segundo!.comissaoCentavos, 900);
        assert.equal(primeiro.comissaoCentavos, 1800);
        for (const mudanca of [
          { representanteId: "rep-b" },
          { representanteFornecedorId: vinculoB },
          { autorizacaoId: autorizacaoB },
          { produtoId: produtoB },
        ])
          await assert.rejects(
            executar(() =>
              prepararSnapshotComissaoAtribuida({
                ...dadosSnapshot,
                atribuicao: { ...atribuicao, ...mudanca },
              }),
            ),
          );
        // Rep B tem autorização no mesmo produto, mas sua comissão permanece inativa.
        await assert.rejects(
          executar(() =>
            prepararSnapshotComissaoAtribuida({
              ...dadosSnapshot,
              atribuicao: {
                ...atribuicao,
                representanteId: "rep-b",
                representanteFornecedorId: vinculoB,
                autorizacaoId: autorizacaoB,
              },
            }),
          ),
        );
        assert.ok(
          (
            await executar(() =>
              configurarComissaoProdutoGestor({ ...config, ativa: false }),
            )
          ).sucesso,
        );
        await assert.rejects(
          executar(() => prepararSnapshotComissaoAtribuida(dadosSnapshot)),
        );
        assert.equal(primeiro.comissaoCentavos, 1800);
      },
    );
    await t.test(
      "preço autorizado salva, IDs/custo/comissão/modalidades adulterados não salvam",
      async () => {
        usuario = "rep-a";
        const gravacao = await executar(() => editar());
        assert.ok(gravacao.sucesso, !gravacao.sucesso ? gravacao.mensagem : "");
        assert.equal((await executar(() => editar(produtoB))).sucesso, false);
        for (const extra of [
          { custoInternoCentavos: 1 },
          { comissaoValor: 999 },
          { modalidade: "stock" },
          { alteracao: { campo: "custo", valor: 1 } },
          { alteracao: { campo: "comissao", valor: 100 } },
        ])
          assert.equal(
            (await executar(() => editar(produtoA, extra))).sucesso,
            false,
          );
        assert.equal(
          (
            await pool!.query(
              "SELECT stock_quantity FROM product_variant WHERE product_id=$1",
              [produtoA],
            )
          ).rows[0].stock_quantity,
          0,
        );
      },
    );
    await t.test(
      "vínculo/fornecedor inativo e revogação concorrente bloqueiam preço na gravação",
      async () => {
        usuario = "rep-a";
        for (const [sql, restaurar, param] of [
          [
            "UPDATE representantes_fornecedores SET ativo=false WHERE id=$1",
            "UPDATE representantes_fornecedores SET ativo=true WHERE id=$1",
            vinculoA,
          ],
          [
            "UPDATE fornecedores SET status='inativo' WHERE id=$1",
            "UPDATE fornecedores SET status='ativo' WHERE id=$1",
            fornecedorA,
          ],
        ]) {
          await pool!.query(sql, [param]);
          assert.equal((await executar(() => editar())).sucesso, false);
          await pool!.query(restaurar, [param]);
        }
        const anterior = await versao();
        const conexao = await pool!.connect();
        try {
          await conexao.query("BEGIN");
          await conexao.query(
            "UPDATE autorizacoes_produtos_representantes SET ativa=false WHERE id=$1",
            [autorizacaoA],
          );
          const pendente = executar(() =>
            editarCampoProdutoRepresentante({
              fornecedorId: fornecedorA,
              produtoId: produtoA,
              versao: anterior,
              alteracao: { campo: "precoCentavos", valor: 88888 },
            }),
          );
          let bloqueou = false;
          for (let i = 0; i < 100; i++) {
            const r = await pool!.query(
              "SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type='Lock' AND query ILIKE '%autorizacoes_produtos_representantes%'",
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
        assert.equal((await executar(() => editar())).sucesso, false);
        assert.equal(
          (
            await pool!.query(
              "SELECT price_in_cents FROM product_pricing WHERE product_id=$1",
              [produtoA],
            )
          ).rows[0].price_in_cents,
          12000,
        );
        usuario = "gestor";
        await assert.rejects(
          executar(() => prepararSnapshotComissaoAtribuida(dadosSnapshot)),
        );
      },
    );
    t.mock.restoreAll();
  } finally {
    await encerrar?.();
    await poolLeitura?.end();
    await pool?.end();
    recorte.remover();
    await postgres.remover();
  }
});
