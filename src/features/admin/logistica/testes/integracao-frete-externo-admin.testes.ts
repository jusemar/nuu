import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

// Regressões de ligação do Admin: garantem que o gate do Frete Externo
// continua na tela, é salvo com validação e usa a mesma regra da loja.
const ler = (caminho: string) =>
  readFileSync(join(process.cwd(), caminho), "utf-8");

describe("Frete Externo no Admin (Produto e Categoria)", () => {
  it("Produto → Entrega → Frete Externo mostra o gate antes das regras", () => {
    const entregaTab = ler(
      "src/app/admin/products/new/components/tabs/EntregaTab.tsx",
    );
    const posicaoGate = entregaTab.indexOf(
      "<DisponibilidadeFreteExternoProduto",
    );
    const posicaoDimensoes = entregaTab.indexOf("<DimensoesFreteExterno");
    assert.ok(posicaoGate > 0, "gate presente na aba Frete Externo");
    assert.ok(posicaoGate < posicaoDimensoes, "gate no início da seção");
    assert.equal(entregaTab.includes("categoriaId={categoriaId}"), true);

    for (const pagina of [
      "src/app/admin/products/new/page.tsx",
      "src/app/admin/products/[id]/edit/page.tsx",
    ]) {
      assert.equal(
        ler(pagina).includes("categoriaId={productData.categoryId || null}"),
        true,
        pagina,
      );
    }
  });

  it("valor efetivo do Admin usa a mesma regra pura da loja", () => {
    for (const componente of [
      "src/features/admin/logistica/components/produto/DisponibilidadeFreteExternoProduto.tsx",
      "src/features/admin/categories/components/secao-frete-externo-categoria.tsx",
    ]) {
      const conteudo = ler(componente);
      assert.equal(
        conteudo.includes("resolverDisponibilidadeFreteExterno"),
        true,
        componente,
      );
      assert.equal(conteudo.includes("<AjudaFreteExterno />"), true);
    }
    const motorPublico = ler(
      "src/features/logistica/queries/disponibilidade/buscar-disponibilidade-frete-externo.ts",
    );
    assert.equal(
      motorPublico.includes("resolverDisponibilidadeFreteExterno"),
      true,
    );
  });

  it("Produto salva e carrega o modo com validação no servidor", () => {
    for (const acao of [
      "src/actions/admin/products/create.ts",
      "src/actions/admin/products/update.ts",
    ]) {
      const conteudo = ler(acao);
      assert.equal(
        conteudo.includes("modoDisponibilidadeFreteExternoSchema.safeParse"),
        true,
        acao,
      );
      assert.equal(conteudo.includes("disponibilidadeFreteExterno"), true);
    }
    assert.equal(
      ler("src/features/admin/products/service/getProductById.ts").includes(
        "disponibilidadeFreteExterno: productTable.disponibilidadeFreteExterno",
      ),
      true,
    );
  });

  it("Categoria tem seção própria, protegida por permissão e Zod", () => {
    assert.equal(
      ler("src/features/admin/categories/form/CategoryForm/index.tsx").includes(
        "<SecaoFreteExternoCategoria categoriaId={initialData?.id} />",
      ),
      true,
    );
    const acao = ler(
      "src/features/admin/categories/actions/disponibilidade-frete-externo-categoria.ts",
    );
    assert.equal(
      acao.includes("PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR"),
      true,
    );
    assert.equal(
      acao.includes("salvarFreteExternoCategoriaSchema.safeParse"),
      true,
    );
  });

  it("Produto Laquila informa que o gate não se aplica", () => {
    const componente = ler(
      "src/features/admin/logistica/components/produto/DisponibilidadeFreteExternoProduto.tsx",
    );
    assert.equal(componente.includes("usaLogisticaLaquila ?"), true);
    assert.equal(componente.includes("Não se aplica"), true);
  });
});
