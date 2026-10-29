import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { TestContext } from "node:test";

import type { Pool } from "pg";

/** Executado pelo runner de representantes, exclusivamente no PostgreSQL descartável. */
export async function testarIsolamentoProdutos({
  teste,
  pool,
  executar,
  sessao,
  produtoA,
  produtoB,
  fornecedorA,
  vinculoA,
  segundoVinculo,
  adminA,
}: {
  teste: TestContext;
  pool: Pool;
  executar: <T>(acao: () => Promise<T>) => Promise<T>;
  sessao: (usuario: string | null) => void;
  produtoA: string;
  produtoB: string;
  fornecedorA: string;
  vinculoA: string;
  segundoVinculo: string;
  adminA: string;
}) {
  const { listarProdutosAdminPaginados } = await import(
    "../../actions/listar-produtos-admin-paginados"
  );
  const { getProduct } = await import("@/actions/admin/products/get-id");
  const { getProductById } = await import(
    "@/features/admin/products/service/getProductById"
  );
  const { getProductGalleryImages } = await import(
    "@/features/admin/products/service/productImageGalleryService"
  );
  const { getProductImages } = await import(
    "@/actions/admin/products/product-images/get"
  );
  const { createProductImage } = await import(
    "@/actions/admin/products/product-images/create"
  );
  const { deleteProductImage } = await import(
    "@/actions/admin/products/product-images/delete"
  );
  const { updateProductImageOrder } = await import(
    "@/actions/admin/products/product-images/update-order"
  );
  const { updateProduct } = await import("@/actions/admin/products/update");
  const { deleteProduct } = await import("@/actions/admin/products/delete");
  const { duplicarProdutoAdmin } = await import(
    "../../actions/duplicar-produto-admin"
  );
  const { publicarProdutoAdmin } = await import(
    "../../actions/publicar-produto-admin"
  );
  const { salvarEstruturaVariantesProduto } = await import(
    "../../actions/admin-product-variants.actions"
  );
  const { aplicarAlteracaoEmMassa } = await import(
    "../../actions/aplicar-alteracao-em-massa"
  );
  const { buscarProdutosVendaCruzadaAdmin } = await import(
    "../../actions/buscar-produtos-venda-cruzada-admin"
  );
  const { buscarConfiguracaoVendaCruzadaAdmin } = await import(
    "../../actions/buscar-configuracao-venda-cruzada-admin"
  );
  const { buscarProdutosPromocaoAdmin } = await import(
    "@/features/promocoes/actions/buscar-produtos-promocao-admin"
  );
  const { consultarProdutosLaquila } = await import(
    "@/features/fornecedores/integracoes/laquila/actions/consultar-produtos-laquila"
  );
  const { POST } = await import("@/app/api/upload/route");
  const { getProductsByFlag } = await import(
    "../../actions/get-products-by-flag"
  );
  const { exigirAcessoProdutoRepresentante } = await import(
    "@/features/fornecedores/queries/representantes/exigir-acesso-produto-representante"
  );
  const varianteA = (
    await pool.query("SELECT id FROM product_variant WHERE product_id=$1", [
      produtoA,
    ])
  ).rows[0].id as string;
  const varianteB = randomUUID(),
    imagemA = randomUUID(),
    imagemB = randomUUID(),
    galeriaA = randomUUID(),
    galeriaB = randomUUID();
  await pool.query(
    "UPDATE representantes_fornecedores SET ativo=false WHERE id=$1",
    [segundoVinculo],
  );
  await pool.query(
    "INSERT INTO product_variant (id,product_id,sku,price_in_cents,stock_quantity) VALUES ($1,$2,'B',5678,4)",
    [varianteB, produtoB],
  );
  await pool.query(
    "INSERT INTO product_image (id,product_variant_id,image_url,sort_order) VALUES ($1,$3,'https://fixture.invalid/a.png',0),($2,$4,'https://fixture.invalid/b.png',0)",
    [imagemA, imagemB, varianteA, varianteB],
  );
  await pool.query(
    "INSERT INTO product_gallery_images (id,product_id,image_url) VALUES ($1,$3,'https://fixture.invalid/a.png'),($2,$4,'https://fixture.invalid/b.png')",
    [galeriaA, galeriaB, produtoA, produtoB],
  );
  await pool.query(
    "INSERT INTO produtos_venda_cruzada (produto_principal_id,produto_oferecido_id,ordem) VALUES ($1,$2,0)",
    [produtoA, produtoB],
  );
  async function retrato() {
    const dados: Record<string, unknown[]> = {};
    for (const tabela of [
      "product",
      "product_pricing",
      "product_variant",
      "product_image",
      "product_gallery_images",
      "produtos_venda_cruzada",
      "fornecedor_produto_vinculos",
    ])
      dados[tabela] = (
        await pool.query(`SELECT * FROM ${tabela} ORDER BY id`)
      ).rows;
    return dados;
  }
  const produtoPublico = randomUUID();
  await pool.query(
    "INSERT INTO product (id,category_id,marca_id,name,slug,sku,description,sale_price_in_cents,status,is_active,store_product_flags,allows_pickup,allowed_delivery_types) SELECT $1,category_id,marca_id,'Publico','publico-fixture','SKU-PUBLICO','Fixture pública',1000,'published',true,ARRAY['general'],true,ARRAY[]::text[] FROM product WHERE id=$2",
    [produtoPublico, produtoA],
  );
  await pool.query(
    "INSERT INTO product_pricing (product_id,type,price_in_cents,main_card_price) VALUES ($1,'stock',1000,true)",
    [produtoPublico],
  );
  await pool.query(
    "INSERT INTO product_variant (product_id,sku,price_in_cents,stock_quantity,is_default) VALUES ($1,'SKU-PUBLICO',1000,5,true)",
    [produtoPublico],
  );
  const antes = await retrato();
  try {
    await teste.test(
      "Etapa 3: lista, busca, filtros e contagem são isolados no SQL",
      async () => {
        const primeira = await executar(() =>
          listarProdutosAdminPaginados({ porPagina: 1 }),
        );
        assert.deepEqual(
          primeira.produtos.map((p) => p.id),
          [produtoA],
        );
        assert.equal(primeira.total, 1);
        const segunda = await executar(() =>
          listarProdutosAdminPaginados({ porPagina: 1, pagina: 2 }),
        );
        assert.equal(segunda.produtos.length, 0);
        assert.equal(segunda.total, 1);
        assert.equal(
          (
            await executar(() =>
              listarProdutosAdminPaginados({ busca: "SKU-B-EXCLUSIVO" }),
            )
          ).total,
          0,
        );
        assert.equal(
          (
            await executar(() =>
              listarProdutosAdminPaginados({ busca: "SKU-A-EXCLUSIVO" }),
            )
          ).total,
          1,
        );
        await assert.rejects(
          executar(() => listarProdutosAdminPaginados({ usuarioId: "gestor" })),
        );
        assert.equal(
          (await executar(() => getProduct(produtoA))).success,
          true,
        );
        assert.equal(
          (await executar(() => getProductById(produtoA))).success,
          true,
        );
        for (const id of [produtoB, randomUUID()]) {
          await assert.rejects(executar(() => getProduct(id)));
          await assert.rejects(executar(() => getProductById(id)));
        }
      },
    );
    await teste.test(
      "Etapa 3: filhos e produtos oferecidos não permitem acesso por ID",
      async () => {
        assert.deepEqual(
          (await executar(() => getProductImages(varianteA))).map((i) => i.id),
          [imagemA],
        );
        assert.deepEqual(
          (await executar(() => getProductGalleryImages(produtoA))).map(
            (i) => i.id,
          ),
          [galeriaA],
        );
        await assert.rejects(executar(() => getProductImages(varianteB)));
        await assert.rejects(executar(() => getProductGalleryImages(produtoB)));
        assert.deepEqual(
          (
            await executar(() =>
              buscarProdutosVendaCruzadaAdmin({
                produtoPrincipalId: produtoA,
                busca: "",
                limite: 10,
              }),
            )
          ).map((p) => p.id),
          [produtoA],
        );
        assert.deepEqual(
          (await executar(() => buscarConfiguracaoVendaCruzadaAdmin(produtoA)))
            .produtos,
          [],
        );
        await assert.rejects(
          executar(() => buscarConfiguracaoVendaCruzadaAdmin(produtoB)),
        );
      },
    );
    await teste.test(
      "Etapa 3: todas as escritas e lote misto são negados mesmo com overrides globais",
      async () => {
        const { CATALOGO_PERMISSOES_ADMIN } = await import(
          "@/features/autenticacao/constants/permissoes-administrativas"
        );
        for (const { chave } of CATALOGO_PERMISSOES_ADMIN)
          await pool.query(
            "INSERT INTO permissoes_administrativas (chave,nome,modulo) VALUES ($1,$1,'fixture') ON CONFLICT (chave) DO NOTHING",
            [chave],
          );
        await pool.query(
          "INSERT INTO administradores_permissoes (administrador_id,permissao_id,efeito) SELECT $1,id,'permitir' FROM permissoes_administrativas ON CONFLICT DO NOTHING",
          [adminA],
        );
        for (const produtoId of [produtoA, produtoB]) {
          await assert.rejects(
            executar(() =>
              updateProduct(
                produtoId,
                {} as Parameters<typeof updateProduct>[1],
              ),
            ),
          );
          await assert.rejects(executar(() => deleteProduct(produtoId)));
          await assert.rejects(executar(() => duplicarProdutoAdmin(produtoId)));
          await assert.rejects(executar(() => publicarProdutoAdmin(produtoId)));
          await assert.rejects(
            executar(() =>
              salvarEstruturaVariantesProduto({
                productId: produtoId,
                productKind: "variable",
              }),
            ),
          );
        }
        await assert.rejects(
          executar(() =>
            exigirAcessoProdutoRepresentante("administrar", {
              fornecedorId: fornecedorA,
              produtoId: produtoA,
            }),
          ),
        );
        await assert.rejects(
          executar(() =>
            aplicarAlteracaoEmMassa({ produtoIds: [produtoA, produtoB] }),
          ),
        );
        await assert.rejects(
          executar(() =>
            createProductImage({
              productVariantId: varianteA,
              imageUrl: "https://fixture.invalid/alterada.png",
              cloudinaryPublicId: "fixture",
            }),
          ),
        );
        for (const imagemId of [imagemA, imagemB]) {
          await assert.rejects(executar(() => deleteProductImage(imagemId)));
          await assert.rejects(
            executar(() => updateProductImageOrder(imagemId, 2)),
          );
        }
        await assert.rejects(
          executar(() =>
            buscarProdutosPromocaoAdmin({ busca: "SKU-A-EXCLUSIVO" }),
          ),
        );
        assert.equal(
          (await executar(() => consultarProdutosLaquila({}))).sucesso,
          false,
        );
        for (const contexto of ["produto", "banner", "logo"])
          assert.equal(
            (
              await executar(() =>
                POST(
                  new Request(
                    `http://localhost/api/upload?contexto=${contexto}`,
                    { method: "POST" },
                  ),
                ),
              )
            ).status,
            403,
          );
        assert.deepEqual(await retrato(), antes);
      },
    );
    await teste.test(
      "Etapa 3: revogação, vínculo e fornecedor inativos bloqueiam consultas seguintes",
      async () => {
        const alteracoes = [
          [
            "UPDATE autorizacoes_produtos_representantes SET ativa=false WHERE representante_fornecedor_id=$1",
            "UPDATE autorizacoes_produtos_representantes SET ativa=true WHERE representante_fornecedor_id=$1",
            vinculoA,
          ],
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
        ];
        for (const [revogar, restaurar, id] of alteracoes) {
          await pool.query(revogar, [id]);
          assert.equal(
            (await executar(() => listarProdutosAdminPaginados())).total,
            0,
          );
          await assert.rejects(executar(() => getProduct(produtoA)));
          await assert.rejects(
            executar(() =>
              updateProduct(
                produtoA,
                {} as Parameters<typeof updateProduct>[1],
              ),
            ),
          );
          await pool.query(restaurar, [id]);
        }
      },
    );
    await teste.test(
      "Etapa 3: duas gravações concorrentes durante revogação não alteram produtos",
      async () => {
        const conexao = await pool.connect();
        try {
          await conexao.query("BEGIN");
          await conexao.query(
            "UPDATE autorizacoes_produtos_representantes SET ativa=false WHERE representante_fornecedor_id=$1",
            [vinculoA],
          );
          const resultados = await Promise.allSettled([
            executar(() =>
              updateProduct(
                produtoA,
                {} as Parameters<typeof updateProduct>[1],
              ),
            ),
            executar(() => deleteProduct(produtoA)),
          ]);
          assert.ok(resultados.every((r) => r.status === "rejected"));
          await conexao.query("COMMIT");
          await assert.rejects(executar(() => getProduct(produtoA)));
          assert.deepEqual(await retrato(), antes);
        } finally {
          await conexao.query("ROLLBACK");
          conexao.release();
          await pool.query(
            "UPDATE autorizacoes_produtos_representantes SET ativa=true WHERE representante_fornecedor_id=$1",
            [vinculoA],
          );
        }
      },
    );
    await teste.test(
      "Etapa 3: principal mantém leitura global e histórico bloqueia exclusão sem perda de preço",
      async () => {
        sessao("gestor");
        assert.equal(
          (await executar(() => listarProdutosAdminPaginados())).total,
          3,
        );
        assert.equal(
          (await executar(() => getProduct(produtoB))).success,
          true,
        );
        assert.equal(
          (await executar(() => getProductImages(varianteB)))[0].id,
          imagemB,
        );
        assert.equal(
          (await executar(() => buscarConfiguracaoVendaCruzadaAdmin(produtoA)))
            .produtos[0].id,
          produtoB,
        );
        for (const ativa of [true, false]) {
          await pool.query(
            "UPDATE autorizacoes_produtos_representantes SET ativa=$2 WHERE representante_fornecedor_id=$1",
            [vinculoA, ativa],
          );
          const resultado = await executar(() => deleteProduct(produtoA));
          assert.equal(resultado.success, false);
          assert.match(resultado.message, /histórico/);
          assert.deepEqual(await retrato(), antes);
        }
        await pool.query(
          "UPDATE autorizacoes_produtos_representantes SET ativa=true WHERE representante_fornecedor_id=$1",
          [vinculoA],
        );
        sessao("usuario-a");
      },
    );
    await teste.test(
      "Etapa 3: exclusão do gestor preserva preços no rollback e funciona sem referências",
      async () => {
        sessao("gestor");
        const temporario = randomUUID();
        await pool.query(
          "INSERT INTO product (id,category_id,marca_id,name,slug,description) SELECT $1,category_id,marca_id,'Temporario','temporario-fixture','Fixture' FROM product WHERE id=$2",
          [temporario, produtoA],
        );
        await pool.query(
          "INSERT INTO product_pricing (product_id,type,price_in_cents) VALUES ($1,'stock',1000)",
          [temporario],
        );
        await pool.query(
          "INSERT INTO fornecedor_produto_vinculos (fornecedor_id,produto_id) VALUES ($1,$2)",
          [fornecedorA, temporario],
        );
        assert.equal(
          (await executar(() => deleteProduct(temporario))).success,
          false,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT price_in_cents FROM product_pricing WHERE product_id=$1",
              [temporario],
            )
          ).rows[0].price_in_cents,
          1000,
        );
        await pool.query(
          "DELETE FROM fornecedor_produto_vinculos WHERE produto_id=$1",
          [temporario],
        );
        assert.equal(
          (await executar(() => deleteProduct(temporario))).success,
          true,
        );
        assert.equal(
          (await pool.query("SELECT id FROM product WHERE id=$1", [temporario]))
            .rowCount,
          0,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT id FROM product_pricing WHERE product_id=$1",
              [temporario],
            )
          ).rowCount,
          0,
        );
        assert.deepEqual(await retrato(), antes);
        sessao("usuario-a");
      },
    );
    await teste.test(
      "Etapa 3: usuário comum e sem sessão não obtêm administração; catálogo público independe do representante",
      async () => {
        sessao("usuario-a");
        const publico = await executar(() => getProductsByFlag(["general"]));
        assert.deepEqual(
          publico.map((p) => p.id),
          [produtoPublico],
        );
        await assert.rejects(executar(() => getProduct(produtoPublico)));
        for (const usuario of ["usuario-b", null]) {
          sessao(usuario);
          await assert.rejects(executar(() => listarProdutosAdminPaginados()));
          await assert.rejects(
            executar(() => getProductGalleryImages(produtoA)),
          );
          assert.deepEqual(
            await executar(() => getProductsByFlag(["general"])),
            publico,
          );
        }
        assert.deepEqual(await retrato(), antes);
      },
    );
  } finally {
    sessao("usuario-a");
    await pool.query("DELETE FROM product WHERE id=$1", [produtoPublico]);
    await pool.query(
      "UPDATE representantes_fornecedores SET ativo=true WHERE id=$1",
      [segundoVinculo],
    );
    await pool.query(
      "DELETE FROM produtos_venda_cruzada WHERE produto_principal_id=$1",
      [produtoA],
    );
    await pool.query("DELETE FROM product_gallery_images WHERE id IN ($1,$2)", [
      galeriaA,
      galeriaB,
    ]);
    await pool.query("DELETE FROM product_image WHERE id IN ($1,$2)", [
      imagemA,
      imagemB,
    ]);
    await pool.query("DELETE FROM product_variant WHERE id=$1", [varianteB]);
  }
}
