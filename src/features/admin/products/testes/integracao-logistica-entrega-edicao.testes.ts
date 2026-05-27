import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("integração logística na edição de produto", () => {
  const caminhoEdicao = join(
    process.cwd(),
    "src/app/admin/products/[id]/edit/page.tsx",
  );
  const caminhoEntregaTab = join(
    process.cwd(),
    "src/app/admin/products/new/components/tabs/EntregaTab.tsx",
  );
  const caminhoCriarProduto = join(
    process.cwd(),
    "src/actions/admin/products/create.ts",
  );
  const caminhoAtualizarProduto = join(
    process.cwd(),
    "src/actions/admin/products/update.ts",
  );

  it("reutiliza o mesmo componente EntregaTab na edição", () => {
    const conteudo = readFileSync(caminhoEdicao, "utf-8");
    assert.equal(
      conteudo.includes(
        'import { EntregaTab } from "../../new/components/tabs/EntregaTab";',
      ),
      true,
    );
  });

  it("passa productId para EntregaTab na edição", () => {
    const conteudo = readFileSync(caminhoEdicao, "utf-8");
    assert.equal(conteudo.includes("productId={productId}"), true);
  });

  it("EntregaTab possui aba de regras logísticas", () => {
    const conteudo = readFileSync(caminhoEntregaTab, "utf-8");
    assert.equal(conteudo.includes('value="regras-logisticas"'), true);
    assert.equal(conteudo.includes("<ResumoLogisticaProduto"), true);
    assert.equal(conteudo.includes("<DimensoesFreteExterno"), true);
  });

  it("edição carrega e altera dimensões de frete externo", () => {
    const conteudoEdicao = readFileSync(caminhoEdicao, "utf-8");
    const conteudoEntrega = readFileSync(caminhoEntregaTab, "utf-8");

    assert.equal(conteudoEdicao.includes("dimensoesFreteExterno:"), true);
    assert.equal(conteudoEdicao.includes("pesoEmKg:"), true);
    assert.equal(conteudoEdicao.includes("aoAlterarDimensoes="), true);
    assert.equal(
      conteudoEntrega.includes("aoAlterar={aoAlterarDimensoes}"),
      true,
    );
  });

  it("cadastro e edição salvam dimensões de frete externo", () => {
    const conteudoCriacao = readFileSync(caminhoCriarProduto, "utf-8");
    const conteudoAtualizacao = readFileSync(caminhoAtualizarProduto, "utf-8");

    assert.equal(
      conteudoCriacao.includes("dimensoesFreteExterno?.pesoEmKg"),
      true,
    );
    assert.equal(
      conteudoAtualizacao.includes("dimensoesFreteExterno.pesoEmKg"),
      true,
    );
    assert.equal(conteudoCriacao.includes("converterPesoEmGramas"), true);
    assert.equal(conteudoAtualizacao.includes("converterPesoEmGramas"), true);
  });

  it("EntregaTab vincula e remove classificacoes pelo resumo do produto", () => {
    const conteudo = readFileSync(caminhoEntregaTab, "utf-8");
    assert.equal(conteudo.includes("vincularTipoLogisticoProduto"), true);
    assert.equal(conteudo.includes("desvincularTipoLogisticoProduto"), true);
    assert.equal(
      conteudo.includes("Classificação logística vinculada com sucesso."),
      true,
    );
    assert.equal(
      conteudo.includes("Classificação logística removida com sucesso."),
      true,
    );
  });

  it("cadastro permite selecionar e salva classificações reais", () => {
    const conteudoEntrega = readFileSync(caminhoEntregaTab, "utf-8");
    const conteudoCriacao = readFileSync(caminhoCriarProduto, "utf-8");

    assert.equal(conteudoEntrega.includes("classificacoesLogisticasIds"), true);
    assert.equal(
      conteudoCriacao.includes("produtosTiposLogisticosTable"),
      true,
    );
  });
});
