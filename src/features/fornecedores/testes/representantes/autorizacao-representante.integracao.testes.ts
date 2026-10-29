import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { CATALOGO_PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { resolverContextoAdministrativo } from "@/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin";

import {
  criarRecorteMigrations,
  subirPostgresDescartavel,
} from "../../../../../scripts/lib/postgres-docker-descartavel";
import { podeAcessarProdutoRepresentante } from "../../lib/representantes/autorizar-produto-representante";

/** Fixtures e migrations só existem no container criado e identificado por este teste. */
test("integração PostgreSQL: preservação, integridade e isolamento de representantes", async (teste) => {
  const postgres = await subirPostgresDescartavel("nuu-testes-representantes");
  let pool: Pool | undefined;
  let poolAplicacao: Pool | undefined;
  let encerrarTransacao: (() => Promise<void>) | undefined;
  const journal = JSON.parse(
    readFileSync("drizzle/meta/_journal.json", "utf8"),
  ) as { entries: { tag: string }[] };
  const indice = journal.entries.findIndex(
    ({ tag }) => tag === "0058_representantes_fornecedores",
  );
  assert.ok(indice > 0);
  const recorte = criarRecorteMigrations("./drizzle", indice);
  try {
    const url = await postgres.criarBanco("representantes_integracao");
    await postgres.confirmarIdentidade(url, "representantes_integracao");
    pool = new Pool({ connectionString: url });
    const banco = drizzle(pool);
    const opcoes = {
      migrationsSchema: "drizzle_v2",
      migrationsTable: "__drizzle_migrations",
    };
    await migrate(banco, { ...opcoes, migrationsFolder: recorte.pasta });
    const fornecedorA = randomUUID(),
      fornecedorB = randomUUID(),
      categoria = randomUUID(),
      marca = randomUUID();
    const produtoA = randomUUID(),
      produtoB = randomUUID();
    await pool.query(`INSERT INTO "user" (id,name,email,email_verified,created_at,updated_at) VALUES
      ('gestor','Gestor','gestor@fixture.invalid',false,now(),now()),
      ('usuario-a','A','a@fixture.invalid',false,now(),now()),
      ('usuario-b','B','b@fixture.invalid',false,now(),now())`);
    await pool.query(
      "INSERT INTO fornecedores (id,nome,tipo_integracao,status) VALUES ($1,'Fornecedor A','api','ativo'),($2,'Fornecedor B','api','ativo')",
      [fornecedorA, fornecedorB],
    );
    await pool.query(
      "INSERT INTO category (id,name,slug) VALUES ($1,'Categoria','categoria')",
      [categoria],
    );
    await pool.query(
      "INSERT INTO marca (id,nome,slug) VALUES ($1,'Marca','marca')",
      [marca],
    );
    await pool.query(
      "INSERT INTO product (id,category_id,marca_id,name,slug,sku,description,sale_price_in_cents) VALUES ($1,$3,$4,'A','a','SKU-A-EXCLUSIVO','Descrição A',1234),($2,$3,$4,'B','b','SKU-B-EXCLUSIVO','Descrição B',5678)",
      [produtoA, produtoB, categoria, marca],
    );
    await pool.query(
      "INSERT INTO product_variant (product_id,sku,price_in_cents,stock_quantity) VALUES ($1,'A',1234,7)",
      [produtoA],
    );
    await pool.query(
      "INSERT INTO product_pricing (product_id,type,price_in_cents) VALUES ($1,'stock',1234)",
      [produtoA],
    );
    await pool.query(
      "INSERT INTO fornecedor_produto_vinculos (fornecedor_id,produto_id) VALUES ($1,$3),($2,$3),($1,$4)",
      [fornecedorA, fornecedorB, produtoA, produtoB],
    );
    const tabelas = [
      "user",
      "fornecedores",
      "category",
      "marca",
      "product",
      "product_variant",
      "product_pricing",
      "fornecedor_produto_vinculos",
    ];
    async function retrato() {
      const resultado: Record<string, unknown[]> = {};
      for (const tabela of tabelas)
        resultado[tabela] = (
          await pool!.query(`SELECT * FROM "${tabela}" ORDER BY id`)
        ).rows;
      return resultado;
    }
    const antes = await retrato();
    await migrate(banco, { ...opcoes, migrationsFolder: "./drizzle" });
    await teste.test(
      "migration preserva integralmente dados legados e não cria acessos",
      async () => {
        assert.deepEqual(await retrato(), antes);
        for (const tabela of [
          "representantes_fornecedores",
          "autorizacoes_produtos_representantes",
          "administradores_funcoes",
          "administradores_permissoes",
        ]) {
          assert.equal(
            (await pool!.query(`SELECT count(*)::int AS total FROM ${tabela}`))
              .rows[0].total,
            0,
          );
        }
      },
    );
    // A URL só é injetada após confirmar o container. Os módulos não leem .env.
    process.env.DATABASE_URL = url;
    process.env.APP_ENVIRONMENT = "homologacao";
    const consultas = await import(
      "../../queries/representantes/buscar-escopo-representante"
    );
    const { db } = await import("@/db/connection");
    poolAplicacao = (db as unknown as { $client: Pool }).$client;
    const administrativo = (usuarioId: string) =>
      resolverContextoAdministrativo({
        userId: usuarioId,
        dados: {
          administrador: {
            id: randomUUID(),
            status: "ativo",
            administradorPrincipal: false,
            versaoAutorizacao: 1,
          },
          chavesAtivasCatalogo: CATALOGO_PERMISSOES_ADMIN.map(
            ({ chave }) => chave,
          ),
          concessoesFuncoes: [
            {
              permissao: "representantes_produtos.visualizar",
              funcaoAtiva: true,
              permissaoAtiva: true,
            },
          ],
          overrides: [],
        },
      });
    async function acesso(
      usuarioId: string,
      fornecedorId: string,
      produtoId: string,
    ) {
      const vinculos = await consultas.buscarVinculosRepresentante(usuarioId);
      const autorizacoes =
        await consultas.buscarAutorizacoesProdutoRepresentante(
          usuarioId,
          fornecedorId,
          produtoId,
        );
      return podeAcessarProdutoRepresentante(
        { administrativo: administrativo(usuarioId), vinculos },
        { fornecedorId, produtoId, operacao: "visualizar" },
        autorizacoes,
      );
    }
    const vinculoA = randomUUID(),
      vinculoB = randomUUID(),
      segundoVinculo = randomUUID();
    await teste.test(
      "associação comercial e identidade não criam acesso",
      async () => {
        assert.equal(await acesso("usuario-a", fornecedorA, produtoA), false);
      },
    );
    await pool.query(
      "INSERT INTO representantes_fornecedores (id,usuario_id,fornecedor_id,criado_por_usuario_id,atualizado_por_usuario_id) VALUES ($1,'usuario-a',$3,'gestor','gestor'),($2,'usuario-b',$3,'gestor','gestor')",
      [vinculoA, vinculoB, fornecedorA],
    );
    await pool.query(
      "INSERT INTO autorizacoes_produtos_representantes (representante_fornecedor_id,produto_id,criado_por_usuario_id,atualizado_por_usuario_id) VALUES ($1,$2,'gestor','gestor')",
      [vinculoA, produtoA],
    );
    await teste.test(
      "defaults negam e vínculo inativo bloqueia mesmo com liberação ativa",
      async () => {
        assert.equal(await acesso("usuario-a", fornecedorA, produtoA), false);
        await pool!.query(
          "UPDATE autorizacoes_produtos_representantes SET ativa=true",
        );
        assert.equal(await acesso("usuario-a", fornecedorA, produtoA), false);
      },
    );
    await pool.query("UPDATE representantes_fornecedores SET ativo=true");
    await teste.test(
      "liberação é individual, não transfere entre representantes nem IDs",
      async () => {
        assert.equal(await acesso("usuario-a", fornecedorA, produtoA), true);
        assert.equal(await acesso("usuario-b", fornecedorA, produtoA), false);
        assert.equal(await acesso("usuario-a", fornecedorA, produtoB), false);
        assert.equal(await acesso("usuario-a", fornecedorB, produtoA), false);
      },
    );
    await teste.test(
      "revogação é observada pela consulta seguinte, sem cache",
      async () => {
        await pool!.query(
          "UPDATE autorizacoes_produtos_representantes SET ativa=false",
        );
        assert.equal(await acesso("usuario-a", fornecedorA, produtoA), false);
        await pool!.query(
          "UPDATE autorizacoes_produtos_representantes SET ativa=true",
        );
        await pool!.query(
          "UPDATE representantes_fornecedores SET ativo=false WHERE id=$1",
          [vinculoA],
        );
        assert.equal(await acesso("usuario-a", fornecedorA, produtoA), false);
        await pool!.query(
          "UPDATE representantes_fornecedores SET ativo=true WHERE id=$1",
          [vinculoA],
        );
      },
    );
    await teste.test(
      "múltiplos fornecedores respeitam vínculo e liberação de cada par",
      async () => {
        await pool!.query(
          "INSERT INTO representantes_fornecedores (id,usuario_id,fornecedor_id,criado_por_usuario_id,atualizado_por_usuario_id) VALUES ($1,'usuario-a',$2,'gestor','gestor')",
          [segundoVinculo, fornecedorB],
        );
        await pool!.query(
          "INSERT INTO autorizacoes_produtos_representantes (representante_fornecedor_id,produto_id,ativa,criado_por_usuario_id,atualizado_por_usuario_id) VALUES ($1,$2,true,'gestor','gestor')",
          [segundoVinculo, produtoB],
        );
        assert.equal(await acesso("usuario-a", fornecedorB, produtoB), false);
        await pool!.query(
          "UPDATE representantes_fornecedores SET ativo=true WHERE id=$1",
          [segundoVinculo],
        );
        assert.equal(await acesso("usuario-a", fornecedorB, produtoB), true);
        assert.equal(await acesso("usuario-a", fornecedorA, produtoA), true);
        assert.equal(await acesso("usuario-a", fornecedorA, produtoB), false);
        await pool!.query(
          "UPDATE fornecedores SET status='inativo' WHERE id=$1",
          [fornecedorB],
        );
        assert.equal(await acesso("usuario-a", fornecedorB, produtoB), false);
        await pool!.query(
          "UPDATE fornecedores SET status='ativo' WHERE id=$1",
          [fornecedorB],
        );
      },
    );
    await teste.test(
      "FKs e unicidade impedem vínculos inválidos e duplicados",
      async () => {
        await assert.rejects(
          pool!.query(
            "INSERT INTO representantes_fornecedores (usuario_id,fornecedor_id,criado_por_usuario_id,atualizado_por_usuario_id) VALUES ('inexistente',$1,'gestor','gestor')",
            [fornecedorA],
          ),
          { code: "23503" },
        );
        await assert.rejects(
          pool!.query(
            "INSERT INTO representantes_fornecedores (usuario_id,fornecedor_id,criado_por_usuario_id,atualizado_por_usuario_id) VALUES ('usuario-a',$1,'gestor','gestor')",
            [fornecedorA],
          ),
          { code: "23505" },
        );
        await assert.rejects(
          pool!.query(
            "INSERT INTO autorizacoes_produtos_representantes (representante_fornecedor_id,produto_id,criado_por_usuario_id,atualizado_por_usuario_id) VALUES ($1,$2,'gestor','gestor')",
            [vinculoA, produtoA],
          ),
          { code: "23505" },
        );
        await assert.rejects(
          pool!.query(
            "INSERT INTO autorizacoes_produtos_representantes (representante_fornecedor_id,produto_id,criado_por_usuario_id,atualizado_por_usuario_id) VALUES ($1,$2,'gestor','gestor')",
            [vinculoA, randomUUID()],
          ),
          { code: "23503" },
        );
      },
    );
    await teste.test(
      "guards reais usam sessão e RBAC; somente principal concede acesso",
      async (caso) => {
        Object.assign(globalThis, { AsyncLocalStorage });
        process.env.BETTER_AUTH_URL = "http://127.0.0.1:3000";
        process.env.BETTER_AUTH_SECRET =
          "segredo-fixture-representantes-sem-rede-0123456789";
        process.env.GOOGLE_CLIENT_ID = "fixture";
        process.env.GOOGLE_CLIENT_SECRET = "fixture";
        const { workUnitAsyncStorage } = await import(
          "next/dist/server/app-render/work-unit-async-storage.external"
        );
        const { workAsyncStorage } = await import(
          "next/dist/server/app-render/work-async-storage.external"
        );
        const { auth } = await import("@/lib/auth");
        const { exigirAcessoProdutoRepresentante } = await import(
          "../../queries/representantes/exigir-acesso-produto-representante"
        );
        const { salvarVinculoRepresentante } = await import(
          "../../actions/representantes/salvar-vinculo-representante"
        );
        const { salvarAutorizacaoProdutoRepresentante } = await import(
          "../../actions/representantes/salvar-autorizacao-produto-representante"
        );
        const transacional = await import("@/db/transaction");
        encerrarTransacao = transacional.encerrarBancoTransacionalIntegracao;
        const { deleteProduct } = await import(
          "@/actions/admin/products/delete"
        );
        const { getProduct } = await import("@/actions/admin/products/get-id");
        const adminA = randomUUID(),
          adminGestor = randomUUID();
        await pool!.query(
          "INSERT INTO administradores (id,usuario_id,administrador_principal) VALUES ($1,'usuario-a',false),($2,'gestor',true)",
          [adminA, adminGestor],
        );
        for (const chave of [
          "representantes_produtos.administrar",
          "representantes_produtos.visualizar",
          "produtos.administrar",
          "produtos.visualizar",
          "administradores.administrar",
        ]) {
          await pool!.query(
            "INSERT INTO permissoes_administrativas (chave,nome,modulo) VALUES ($1,$1,'fixture') ON CONFLICT (chave) DO NOTHING",
            [chave],
          );
        }
        await pool!.query(
          "INSERT INTO administradores_permissoes (administrador_id,permissao_id,efeito) SELECT $1,id,'permitir' FROM permissoes_administrativas WHERE chave IN ('representantes_produtos.visualizar','representantes_produtos.visualizar')",
          [adminA],
        );
        let usuarioSessao: string | null = "usuario-a";
        caso.mock.method(auth.api, "getSession", async () =>
          usuarioSessao
            ? {
                user: {
                  id: usuarioSessao,
                  name: "Fixture",
                  email: "fixture@fixture.invalid",
                  emailVerified: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
                session: {
                  id: "sessao-fixture",
                  userId: usuarioSessao,
                  token: "fixture",
                  expiresAt: new Date(Date.now() + 60000),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              }
            : null,
        );
        // Só a borda HTTP é simulada: os guards, consultas RBAC e escritas são reais.
        const requisicao = {
          type: "request",
          phase: "action",
          headers: new Headers({ cookie: "better-auth.session_token=fixture" }),
        } as unknown as Parameters<typeof workUnitAsyncStorage.run>[0];
        const trabalho = {
          route: "/fixture/representantes",
          incrementalCache: {},
          pendingRevalidatedTags: [],
        } as unknown as Parameters<typeof workAsyncStorage.run>[0];
        const executar = <T>(acao: () => Promise<T>) =>
          workAsyncStorage.run(trabalho, () =>
            workUnitAsyncStorage.run(requisicao, acao),
          );
        const ids = { fornecedorId: fornecedorA, produtoId: produtoA };
        await executar(() =>
          exigirAcessoProdutoRepresentante("visualizar", ids),
        );
        await assert.rejects(
          executar(() =>
            exigirAcessoProdutoRepresentante("visualizar", {
              ...ids,
              produtoId: produtoB,
            }),
          ),
          /ACESSO_PRODUTO_REPRESENTANTE_NEGADO/,
        );
        await assert.rejects(
          executar(() =>
            salvarVinculoRepresentante({
              usuarioId: "usuario-b",
              fornecedorId: fornecedorA,
              ativo: true,
            }),
          ),
        );
        await assert.rejects(
          executar(() =>
            salvarAutorizacaoProdutoRepresentante({
              representanteFornecedorId: vinculoA,
              produtoId: produtoB,
              ativa: true,
            }),
          ),
        );
        await assert.rejects(executar(() => deleteProduct(produtoA)));
        assert.equal(
          (await executar(() => getProduct(produtoA))).success,
          true,
        );
        const { testarIsolamentoProdutos } = await import(
          "@/features/products/testes/representantes/isolamento-produtos.integracao"
        );
        await testarIsolamentoProdutos({
          teste: caso,
          pool: pool!,
          executar,
          sessao: (usuario) => {
            usuarioSessao = usuario;
          },
          produtoA,
          produtoB,
          fornecedorA,
          vinculoA,
          segundoVinculo,
          adminA,
        });
        usuarioSessao = null;
        await assert.rejects(
          executar(() => exigirAcessoProdutoRepresentante("visualizar", ids)),
          /ACESSO_PRODUTO_REPRESENTANTE_NEGADO/,
        );
        usuarioSessao = "gestor";
        await executar(() =>
          exigirAcessoProdutoRepresentante("visualizar", {
            fornecedorId: fornecedorB,
            produtoId: produtoB,
          }),
        );
        const criacaoOriginal = (
          await pool!.query(
            "SELECT created_at,criado_por_usuario_id FROM representantes_fornecedores WHERE id=$1",
            [vinculoA],
          )
        ).rows[0];
        await executar(() =>
          salvarVinculoRepresentante({
            usuarioId: "usuario-a",
            fornecedorId: fornecedorA,
            ativo: false,
          }),
        );
        usuarioSessao = "usuario-a";
        await assert.rejects(
          executar(() => exigirAcessoProdutoRepresentante("visualizar", ids)),
          /ACESSO_PRODUTO_REPRESENTANTE_NEGADO/,
        );
        usuarioSessao = "gestor";
        await executar(() =>
          salvarVinculoRepresentante({
            usuarioId: "usuario-a",
            fornecedorId: fornecedorA,
            ativo: true,
          }),
        );
        await executar(() =>
          salvarAutorizacaoProdutoRepresentante({
            representanteFornecedorId: vinculoA,
            produtoId: produtoA,
            ativa: false,
          }),
        );
        usuarioSessao = "usuario-a";
        await assert.rejects(
          executar(() => exigirAcessoProdutoRepresentante("visualizar", ids)),
          /ACESSO_PRODUTO_REPRESENTANTE_NEGADO/,
        );
        assert.deepEqual(
          (
            await pool!.query(
              "SELECT created_at,criado_por_usuario_id FROM representantes_fornecedores WHERE id=$1",
              [vinculoA],
            )
          ).rows[0],
          criacaoOriginal,
        );
        assert.equal(
          (
            await pool!.query(
              "SELECT count(*)::int AS total FROM auditorias_administrativas WHERE acao LIKE 'representantes.%' AND resultado='sucesso'",
            )
          ).rows[0].total,
          3,
        );
        caso.mock.restoreAll();
      },
    );
    await teste.test(
      "testes de autorização preservaram catálogo, preços, estoque e associações",
      async () => {
        assert.deepEqual(await retrato(), antes);
      },
    );
  } finally {
    await encerrarTransacao?.();
    await poolAplicacao?.end();
    await pool?.end();
    recorte.remover();
    await postgres.remover();
  }
});
