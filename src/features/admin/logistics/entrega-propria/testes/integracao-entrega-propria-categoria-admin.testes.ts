import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

// Regressões de ligação do Admin: garantem que a Entrega Própria por
// Categoria continua na tela, é salva com validação e usa a mesma regra
// pura do motor público.
const ler = (caminho: string) =>
  readFileSync(join(process.cwd(), caminho), "utf-8");

const HERANCA =
  "src/features/admin/logistics/entrega-propria/components/admin/heranca";

describe("Entrega Própria por Categoria no Admin", () => {
  it("Categoria tem seção própria, protegida por permissão e Zod", () => {
    assert.equal(
      ler("src/features/admin/categories/form/CategoryForm/index.tsx").includes(
        "<SecaoEntregaPropriaCategoria categoriaId={initialData?.id} />",
      ),
      true,
    );
    const acao = ler(
      "src/features/admin/logistics/entrega-propria/actions/entrega-propria-categoria.actions.ts",
    );
    assert.equal(
      acao.includes("PERMISSOES_ADMIN.CATEGORIAS.ADMINISTRAR"),
      true,
    );
    assert.equal(
      acao.includes("salvarEntregaPropriaCategoriaSchema.safeParse"),
      true,
    );
  });

  it("Admin (Produto e Categoria) e loja usam a mesma regra pura", () => {
    for (const arquivo of [
      `${HERANCA}/disponibilidade-entrega-propria-produto.tsx`,
      `${HERANCA}/secao-entrega-propria-categoria.tsx`,
      "src/features/logistica/queries/resolver-entrega-propria.ts",
      "src/features/logistica/queries/buscar-disponibilidade-entrega-propria.ts",
    ]) {
      assert.equal(
        ler(arquivo).includes("resolverDisponibilidadeEntregaPropria"),
        true,
        arquivo,
      );
    }
    assert.equal(
      ler(
        "src/features/logistica/queries/resolver-entrega-propria.ts",
      ).includes("escolherFonteComercialEntregaPropria"),
      true,
    );
  });

  it("Produto mostra a herança fechada, somente leitura, com link para a categoria", () => {
    const heranca = ler(`${HERANCA}/heranca-entrega-propria-categoria.tsx`);
    assert.equal(
      heranca.includes(
        "Este produto usa configuração de Entrega Própria da categoria",
      ),
      true,
    );
    assert.equal(heranca.includes("Abrir configuração da categoria"), true);
    assert.equal(heranca.includes("/admin/categories/"), true);
    assert.equal(
      heranca.includes("Configuração herdada da categoria"),
      false,
      "título proibido",
    );
    const produto = ler(
      `${HERANCA}/disponibilidade-entrega-propria-produto.tsx`,
    );
    assert.equal(produto.includes("Permitir Entrega Própria"), true);
    assert.equal(produto.includes("<AjudaEntregaPropriaCategoria />"), true);
  });

  it("Produto salva o modo com validação e mantém o boolean legado coerente", () => {
    for (const acao of [
      "src/actions/admin/products/create.ts",
      "src/actions/admin/products/update.ts",
    ]) {
      const conteudo = ler(acao);
      assert.equal(
        conteudo.includes("modoDisponibilidadeEntregaPropriaSchema.safeParse"),
        true,
        acao,
      );
      assert.equal(conteudo.includes("disponibilidadeEntregaPropria"), true);
    }
    // Laquila: a edição força "desativado" antes de validar o modo.
    assert.match(
      ler("src/actions/admin/products/update.ts"),
      /usaLogisticaLaquila\s*\?\s*"desativado"/,
    );
  });
  it("ligar a programada grava os valores exibidos (0 janelas e R$ 0 = grátis)", () => {
    const precos = ler(
      "src/features/admin/logistics/entrega-propria/components/admin/produto-entrega-propria-precos.tsx",
    );
    assert.match(
      precos,
      /scheduledDeliveryMinDays: item\.scheduledDeliveryMinDays \?\? 0/,
    );
    assert.match(
      precos,
      /scheduledDeliveryPrice: item\.scheduledDeliveryPrice \?\? 0/,
    );
    assert.equal(
      (precos.match(/handleAtivarProgramada\(index, item, checked\)/g) ?? [])
        .length,
      2,
      "tabela desktop e cartões mobile",
    );
  });

  it("Alteração em Massa oferece Herdar/Ativado/Desativado", () => {
    const configurador = ler(
      "src/features/products/components/admin/alteracao-em-massa/configurador-operacoes-produtos.tsx",
    );
    for (const opcao of [
      'value="herdar"',
      'value="ativado"',
      'value="desativado"',
      '"disponibilidade_entrega_propria"',
    ]) {
      assert.equal(configurador.includes(opcao), true, opcao);
    }
  });

  it("desativar a Entrega Própria não remove a origem de estoque próprio", () => {
    const entregaTab = ler(
      "src/app/admin/products/new/components/tabs/EntregaTab.tsx",
    );
    assert.equal(
      entregaTab.includes('tiposAtuais.filter((tipo) => tipo !== "own")'),
      false,
    );
  });
});
