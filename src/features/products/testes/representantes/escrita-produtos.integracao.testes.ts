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
import { dadosProdutoRepresentanteSchema } from "../../schemas/representantes/produto-representante.schema";

/** Testes exclusivos da Etapa 4. Nunca usa .env para escolher o banco. */
test("Etapa 4: escrita real, revogação e dados comerciais em PostgreSQL descartável", async (t) => {
  const postgres = await subirPostgresDescartavel("nuu-etapa4-representantes");
  let pool: Pool | undefined;
  let encerrar: (() => Promise<void>) | undefined;
  let poolLeitura: Pool | undefined;
  const recorte = criarRecorteMigrations("./drizzle", 59);
  try {
    const url = await postgres.criarBanco("representantes_etapa4");
    await postgres.confirmarIdentidade(url, "representantes_etapa4");
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
    const retrato = async () => {
      const dados: Record<string, unknown[]> = {};
      for (const tabela of [
        "user",
        "administradores",
        "product",
        "product_variant",
        "product_pricing",
        "fornecedor_produto_vinculos",
        "representantes_fornecedores",
        "autorizacoes_produtos_representantes",
      ])
        dados[tabela] = (
          await pool!.query(
            `SELECT to_jsonb(t)-'estoque_informado_fornecedor'-'comissao_tipo'-'comissao_valor'-'comissao_visivel' AS dados FROM ${tabela === "user" ? '"user"' : tabela} t ORDER BY id`,
          )
        ).rows;
      return dados;
    };
    const antes = await retrato();
    await t.test(
      "migration 0059 é aditiva, preserva dados e segunda aplicação não faz alterações",
      async () => {
        await migrate(banco, { ...migracoes, migrationsFolder: "./drizzle" });
        assert.deepEqual(await retrato(), antes);
        const contagem = (
          await pool!.query(
            "SELECT count(*) FROM drizzle_v2.__drizzle_migrations",
          )
        ).rows;
        await migrate(banco, { ...migracoes, migrationsFolder: "./drizzle" });
        assert.deepEqual(
          (
            await pool!.query(
              "SELECT count(*) FROM drizzle_v2.__drizzle_migrations",
            )
          ).rows,
          contagem,
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
    const { criarProdutoRepresentante } = await import(
      "../../actions/representantes/criar-produto-representante"
    );
    const { editarProdutoRepresentante } = await import(
      "../../actions/representantes/editar-produto-representante"
    );
    const { editarCampoProdutoRepresentante } = await import(
      "../../actions/representantes/editar-campo-produto-representante"
    );
    const { listarProdutosRepresentante } = await import(
      "../../queries/representantes/listar-produtos-representante"
    );
    const {
      buscarProdutoEdicaoRepresentante,
      buscarOpcoesFormularioRepresentante,
    } = await import(
      "../../queries/representantes/buscar-formulario-representante"
    );
    const { buscarPerfilProdutosAdmin } = await import(
      "../../queries/representantes/buscar-perfil-produtos-admin"
    );
    const { configurarComissaoProdutoGestor } = await import(
      "../../actions/representantes/configurar-comissao-gestor"
    );
    const {
      enviarImagemProdutoRepresentante,
      alterarImagemProdutoRepresentante,
    } = await import(
      "../../actions/representantes/gerenciar-imagens-representante"
    );
    const dados = dadosProdutoRepresentanteSchema.parse({
      nome: "Cabo HDMI",
      categoriaId: categoria,
      marcaId: marca,
      codigoFornecedor: "EMB-HDMI-002",
      precoCentavos: 4990,
      estoque: 35,
    });
    const criar = () =>
      executar(() =>
        criarProdutoRepresentante({ fornecedorId: fornecedorA, dados }),
      );
    let produtoA = "",
      produtoB = "";
    await t.test(
      "criação simples usa fornecedor explícito, SKU próprio, vínculo comercial e autorização individual atômica",
      async () => {
        assert.equal(
          (await executar(() => criarProdutoRepresentante({ dados }))).sucesso,
          false,
        );
        const resposta = await criar();
        assert.equal(resposta.sucesso, true);
        produtoA = resposta.dados.produtoId;
        const p = (
          await pool!.query(
            "SELECT p.*,v.codigo_fornecedor,v.estoque_informado_fornecedor FROM product p JOIN fornecedor_produto_vinculos v ON v.produto_id=p.id WHERE p.id=$1",
            [produtoA],
          )
        ).rows[0];
        assert.equal(p.product_kind, "simple");
        assert.equal(p.status, "draft");
        assert.equal(p.codigo_fornecedor, "EMB-HDMI-002");
        assert.notEqual(p.sku, p.codigo_fornecedor);
        assert.equal(p.estoque_informado_fornecedor, 35);
        assert.deepEqual(
          (
            await pool!.query(
              "SELECT type FROM product_pricing WHERE product_id=$1",
              [produtoA],
            )
          ).rows,
          [{ type: "dropshipping" }],
        );
        assert.equal(
          (
            await pool!.query(
              "SELECT representante_fornecedor_id FROM autorizacoes_produtos_representantes WHERE produto_id=$1 AND ativa",
              [produtoA],
            )
          ).rows[0].representante_fornecedor_id,
          vinculoA,
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
        assert.equal(
          (await executar(buscarPerfilProdutosAdmin)).fornecedores.length,
          2,
        );
      },
    );
    const detalhe = () =>
      executar(() =>
        buscarProdutoEdicaoRepresentante({
          produtoId: produtoA,
          fornecedorId: fornecedorA,
        }),
      );
    await t.test(
      "payload rejeita modalidades proibidas, variantes, SKU, publicação, comissão e fornecedor alheio sem criar dados",
      async () => {
        const contagem = () => pool!.query("SELECT count(*) FROM product");
        const inicial = (await contagem()).rows;
        for (const extra of [
          { modalidade: "stock" },
          { modalidade: "pre_sale" },
          { modalidade: "order_basis" },
          { productKind: "variable" },
          { variants: [] },
          { attributes: [] },
          { sku: "INJETADO" },
          { status: "published" },
          { comissaoVisivel: true },
        ])
          assert.equal(
            (
              await executar(() =>
                criarProdutoRepresentante({
                  fornecedorId: fornecedorA,
                  dados: { ...dados, ...extra },
                }),
              )
            ).sucesso,
            false,
          );
        assert.equal(
          (
            await executar(() =>
              criarProdutoRepresentante({ fornecedorId: randomUUID(), dados }),
            )
          ).sucesso,
          false,
        );
        assert.deepEqual((await contagem()).rows, inicial);
        const conflito = await executar(() =>
          criarProdutoRepresentante({
            fornecedorId: fornecedorA,
            dados: { ...dados, gtin: "12345678" },
          }),
        );
        assert.equal(conflito.sucesso, false);
        assert.deepEqual((await contagem()).rows, inicial);
      },
    );
    await t.test(
      "representante B, usuário comum e sessão ausente não escrevem no produto A",
      async () => {
        usuario = "rep-b";
        const resposta = await criar();
        assert.ok(resposta.sucesso);
        produtoB = resposta.dados.produtoId;
        for (const id of ["rep-b", "comum", null]) {
          usuario = id;
          const resultado = await executar(() =>
            editarCampoProdutoRepresentante({
              fornecedorId: fornecedorA,
              produtoId: produtoA,
              versao: new Date().toISOString(),
              alteracao: { campo: "nome", valor: "Invadido" },
            }),
          );
          assert.equal(resultado.sucesso, false);
        }
        usuario = "rep-a";
        await assert.rejects(
          executar(() =>
            buscarProdutoEdicaoRepresentante({
              produtoId: produtoB,
              fornecedorId: fornecedorA,
            }),
          ),
        );
        assert.equal(
          (await executar(() => listarProdutosRepresentante())).total,
          1,
        );
      },
    );
    await t.test(
      "edição completa e inline preservam SKU e não transformam saldo em estoque físico",
      async () => {
        let atual = await detalhe();
        const sku = atual.sku;
        const editado = await executar(() =>
          editarProdutoRepresentante({
            fornecedorId: fornecedorA,
            produtoId: produtoA,
            versao: atual.versao,
            dados: {
              ...atual.dados,
              nome: "Cabo HDMI premium",
              codigoFornecedor: "EMB-NOVO",
              precoCentavos: 5990,
              estoque: 50,
            },
          }),
        );
        assert.ok(editado.sucesso);
        atual = await detalhe();
        assert.equal(atual.sku, sku);
        assert.equal(atual.dados.codigoFornecedor, "EMB-NOVO");
        assert.equal(atual.dados.precoCentavos, 5990);
        for (const alteracao of [
          { campo: "nome", valor: "Cabo atualizado" },
          { campo: "precoCentavos", valor: 6990 },
          { campo: "estoque", valor: 70 },
        ]) {
          atual = await detalhe();
          assert.ok(
            (
              await executar(() =>
                editarCampoProdutoRepresentante({
                  fornecedorId: fornecedorA,
                  produtoId: produtoA,
                  versao: atual.versao,
                  alteracao,
                }),
              )
            ).sucesso,
          );
        }
        assert.equal((await detalhe()).dados.estoque, 70);
        assert.equal(
          (
            await pool!.query(
              "SELECT stock_quantity FROM product_variant WHERE product_id=$1",
              [produtoA],
            )
          ).rows[0].stock_quantity,
          0,
        );
        assert.equal(
          (
            await executar(() =>
              listarProdutosRepresentante({ busca: "EMB-NOVO" }),
            )
          ).total,
          1,
        );
        const versao = (await detalhe()).versao;
        const concorrentes = await Promise.all([
          executar(() =>
            editarCampoProdutoRepresentante({
              fornecedorId: fornecedorA,
              produtoId: produtoA,
              versao,
              alteracao: { campo: "nome", valor: "Primeira edição" },
            }),
          ),
          executar(() =>
            editarCampoProdutoRepresentante({
              fornecedorId: fornecedorA,
              produtoId: produtoA,
              versao,
              alteracao: { campo: "nome", valor: "Segunda edição" },
            }),
          ),
        ]);
        assert.equal(concorrentes.filter((r) => r.sucesso).length, 1);
      },
    );
    await t.test(
      "estruturas existentes incompatíveis bloqueiam gravações sem apagar modalidades ou variantes",
      async () => {
        const tentativa = async () => {
          const versaoAtual = (await detalhe()).versao;
          return executar(() =>
            editarCampoProdutoRepresentante({
              fornecedorId: fornecedorA,
              produtoId: produtoA,
              versao: versaoAtual,
              alteracao: { campo: "nome", valor: "Pode novamente" },
            }),
          );
        };
        const versao = (await detalhe()).versao;
        await pool!.query(
          "UPDATE product SET product_kind='variable' WHERE id=$1",
          [produtoA],
        );
        assert.equal(
          (
            await executar(() =>
              editarCampoProdutoRepresentante({
                fornecedorId: fornecedorA,
                produtoId: produtoA,
                versao,
                alteracao: { campo: "nome", valor: "Não pode" },
              }),
            )
          ).sucesso,
          false,
        );
        await pool!.query(
          "UPDATE product SET product_kind='simple' WHERE id=$1",
          [produtoA],
        );
        for (const modalidade of ["stock", "pre_sale", "order_basis"]) {
          await pool!.query(
            "UPDATE product_pricing SET type=$2 WHERE product_id=$1",
            [produtoA, modalidade],
          );
          assert.equal(
            (
              await executar(() =>
                editarCampoProdutoRepresentante({
                  fornecedorId: fornecedorA,
                  produtoId: produtoA,
                  versao,
                  alteracao: { campo: "estoque", valor: 1 },
                }),
              )
            ).sucesso,
            false,
          );
        }
        await pool!.query(
          "UPDATE product_pricing SET type='dropshipping' WHERE product_id=$1",
          [produtoA],
        );
        assert.ok((await tentativa()).sucesso);
      },
    );
    await t.test(
      "categorias existentes selecionáveis e cadastro de categoria continua bloqueado",
      async () => {
        assert.equal(
          (await executar(buscarOpcoesFormularioRepresentante)).categorias[0]
            .id,
          categoria,
        );
        const { createCategory } = await import(
          "@/actions/admin/categories/create"
        );
        await assert.rejects(
          executar(() =>
            createCategory({ name: "Proibida", slug: "proibida" } as Parameters<
              typeof createCategory
            >[0]),
          ),
        );
        const { updateCategory } = await import(
          "@/actions/admin/categories/update"
        );
        const { deleteCategory } = await import(
          "@/actions/admin/categories/delete"
        );
        await assert.rejects(
          executar(() => updateCategory(categoria, { name: "Proibido" })),
        );
        await assert.rejects(executar(() => deleteCategory(categoria)));
        assert.equal(
          (await pool!.query("SELECT count(*)::int AS n FROM category")).rows[0]
            .n,
          1,
        );
      },
    );
    await t.test(
      "comissão é exclusiva do gestor e valor oculto não é serializado ao representante",
      async () => {
        const id = (
          await pool!.query(
            "SELECT id FROM autorizacoes_produtos_representantes WHERE produto_id=$1",
            [produtoA],
          )
        ).rows[0].id;
        assert.equal(
          (
            await executar(() =>
              configurarComissaoProdutoGestor({
                produtoId: produtoA,
                autorizacaoId: id,
                tipo: "fixa",
                valor: 1000,
                visivel: true,
              }),
            )
          ).sucesso,
          false,
        );
        usuario = "gestor";
        assert.ok(
          (
            await executar(() =>
              configurarComissaoProdutoGestor({
                produtoId: produtoA,
                autorizacaoId: id,
                tipo: "fixa",
                valor: 1000,
                visivel: false,
              }),
            )
          ).sucesso,
        );
        usuario = "rep-a";
        assert.equal(
          (await executar(() => listarProdutosRepresentante())).produtos[0]
            .contextos[0].comissao,
          null,
        );
        usuario = "gestor";
        assert.ok(
          (
            await executar(() =>
              configurarComissaoProdutoGestor({
                produtoId: produtoA,
                autorizacaoId: id,
                tipo: "percentual",
                valor: 500,
                visivel: true,
              }),
            )
          ).sucesso,
        );
        usuario = "rep-a";
        assert.deepEqual(
          (await executar(() => listarProdutosRepresentante())).produtos[0]
            .contextos[0].comissao,
          { tipo: "percentual", valor: 500 },
        );
      },
    );
    await t.test(
      "imagens só podem ser enviadas, ordenadas ou removidas no produto autorizado",
      async () => {
        const png = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=",
          "base64",
        );
        const enviar = (produtoId: string) => {
          const form = new FormData();
          form.set("fornecedorId", fornecedorA);
          form.set("produtoId", produtoId);
          form.set(
            "arquivo",
            new File([png], "fixture.png", { type: "image/png" }),
          );
          return executar(() => enviarImagemProdutoRepresentante(form));
        };
        assert.equal((await enviar(produtoB)).sucesso, false);
        const imagem = await enviar(produtoA);
        assert.ok(imagem.sucesso);
        assert.equal(
          (
            await executar(() =>
              alterarImagemProdutoRepresentante({
                fornecedorId: fornecedorA,
                produtoId: produtoB,
                imagemId: imagem.dados.id,
                acao: "remover",
              }),
            )
          ).sucesso,
          false,
        );
        assert.equal(
          (
            await executar(() =>
              alterarImagemProdutoRepresentante({
                fornecedorId: fornecedorA,
                produtoId: produtoA,
                imagemId: randomUUID(),
                acao: "principal",
              }),
            )
          ).sucesso,
          false,
        );
        const { GET } = await import(
          "@/app/api/imagens-representante-local/[imagemId]/route"
        );
        const localId = (await detalhe()).imagens[0].url.split("/").pop()!;
        assert.equal(
          (
            await executar(() =>
              GET(new Request("http://localhost"), {
                params: Promise.resolve({ imagemId: localId }),
              }),
            )
          ).status,
          200,
        );
        usuario = "rep-b";
        assert.equal(
          (
            await executar(() =>
              GET(new Request("http://localhost"), {
                params: Promise.resolve({ imagemId: localId }),
              }),
            )
          ).status,
          404,
        );
        usuario = "rep-a";
        assert.ok(
          (
            await executar(() =>
              alterarImagemProdutoRepresentante({
                fornecedorId: fornecedorA,
                produtoId: produtoA,
                imagemId: imagem.dados.id,
                acao: "remover",
              }),
            )
          ).sucesso,
        );
      },
    );
    await t.test(
      "revogação concorrente de autorização, vínculo e fornecedor impede a gravação que aguardava o lock",
      async () => {
        const estadoAntes = (await detalhe()).dados;
        for (const [revogar, restaurar, parametro, tabela] of [
          [
            "UPDATE autorizacoes_produtos_representantes SET ativa=false WHERE representante_fornecedor_id=$1",
            "UPDATE autorizacoes_produtos_representantes SET ativa=true WHERE representante_fornecedor_id=$1",
            vinculoA,
            "autorizacoes_produtos_representantes",
          ],
          [
            "UPDATE representantes_fornecedores SET ativo=false WHERE id=$1",
            "UPDATE representantes_fornecedores SET ativo=true WHERE id=$1",
            vinculoA,
            "representantes_fornecedores",
          ],
          [
            "UPDATE fornecedores SET status='inativo' WHERE id=$1",
            "UPDATE fornecedores SET status='ativo' WHERE id=$1",
            fornecedorA,
            "fornecedores",
          ],
        ]) {
          const versao = (await detalhe()).versao;
          const conexao = await pool!.connect();
          try {
            await conexao.query("BEGIN");
            await conexao.query(revogar, [parametro]);
            const pendente = executar(() =>
              editarCampoProdutoRepresentante({
                fornecedorId: fornecedorA,
                produtoId: produtoA,
                versao,
                alteracao: { campo: "precoCentavos", valor: 9000 },
              }),
            );
            let bloqueado = false;
            for (let i = 0; i < 100; i++) {
              const espera = await pool!.query(
                "SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type='Lock' AND query ILIKE $1",
                [`%${tabela}%`],
              );
              if (espera.rows[0].n > 0) {
                bloqueado = true;
                break;
              }
              await new Promise((r) => setTimeout(r, 20));
            }
            assert.ok(bloqueado, `escrita deveria esperar em ${tabela}`);
            await conexao.query("COMMIT");
            assert.equal((await pendente).sucesso, false);
          } finally {
            await conexao.query("ROLLBACK");
            conexao.release();
            await pool!.query(restaurar, [parametro]);
          }
        }
        assert.deepEqual((await detalhe()).dados, estadoAntes);
        await pool!.query(
          "UPDATE administradores_permissoes SET efeito='negar' WHERE administrador_id=$1 AND permissao_id=(SELECT id FROM permissoes_administrativas WHERE chave='representantes_produtos.administrar')",
          [adminA],
        );
        assert.equal((await criar()).sucesso, false);
        await pool!.query(
          "UPDATE administradores_permissoes SET efeito='permitir' WHERE administrador_id=$1",
          [adminA],
        );
      },
    );
    await t.test(
      "gestor mantém cadastro global de modalidade stock e representante não acessa escritas globais",
      async () => {
        const { createProduct } = await import(
          "@/actions/admin/products/create"
        );
        const { initialProductData } = await import(
          "@/app/admin/products/new/data/product-form-data"
        );
        const entrada = {
          ...initialProductData,
          name: "Produto gestor",
          slug: `gestor-${randomUUID()}`,
          sku: `GESTOR-${randomUUID()}`,
          categoryId: categoria,
          brandId: marca,
          brand: "Nooo",
          pricing: {
            ...initialProductData.pricing,
            mainCardPriceType: "stock",
            modalities: {
              stock: { price: "100,00", deliveryText: "Imediato" },
            },
          },
          entrega: {
            ...initialProductData.entrega,
            permiteEntregaPropria: false,
            disponibilidadeEntregaPropria: "desativado" as const,
          },
        };
        await assert.rejects(executar(() => createProduct(entrada)));
        usuario = "gestor";
        const resultado = await executar(() => createProduct(entrada));
        assert.ok(resultado.success);
        usuario = "rep-a";
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
