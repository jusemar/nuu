import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

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
  const caminhoBuscaProduto = join(
    process.cwd(),
    "src/features/admin/products/service/getProductById.ts",
  );
  const caminhoIdentificacaoLaquila = join(
    process.cwd(),
    "src/features/fornecedores/integracoes/laquila/queries/verificar-logistica-laquila-produto.ts",
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

  it("identifica Logística Laquila pelo vínculo ativo existente", () => {
    const conteudoBusca = readFileSync(caminhoBuscaProduto, "utf-8");
    const conteudoIdentificacao = readFileSync(
      caminhoIdentificacaoLaquila,
      "utf-8",
    );

    assert.equal(
      conteudoBusca.includes("verificarLogisticaLaquilaProduto(id)"),
      true,
    );
    assert.equal(
      conteudoIdentificacao.includes(
        "listarProvedoresExpedicaoProdutos",
      ),
      true,
    );
    assert.equal(
      conteudoIdentificacao.includes("PROVEDOR_INTEGRACAO_LAQUILA"),
      true,
    );
  });

  it("mantém somente a retirada indisponível para produto Laquila", () => {
    const conteudoEdicao = readFileSync(caminhoEdicao, "utf-8");
    const conteudoEntrega = readFileSync(caminhoEntregaTab, "utf-8");

    assert.equal(
      conteudoEdicao.includes("usaLogisticaLaquila={Boolean("),
      true,
    );
    assert.equal(conteudoEntrega.includes("Logística Laquila"), true);
    assert.equal(conteudoEntrega.includes("Ativa"), true);
    assert.equal(
      conteudoEntrega.includes(
        "Indisponível porque o produto é expedido pela Laquila.",
      ),
      true,
    );
    assert.equal(conteudoEntrega.includes("Retirada pelo cliente"), true);
    assert.equal(
      conteudoEntrega.includes(
        "Este produto é separado e expedido pela Laquila. O frete é",
      ),
      true,
    );
  });

  it("reutiliza controles normais de Entrega própria e Frete externo para Laquila", () => {
    const conteudoEntrega = readFileSync(caminhoEntregaTab, "utf-8");

    assert.equal(conteudoEntrega.includes("Permitir Entrega Própria"), true);
    assert.equal(conteudoEntrega.includes("handleOwnDeliveryChange"), true);
    assert.equal(
      conteudoEntrega.includes("<ProdutoEntregaPropriaPrecos"),
      true,
    );
    assert.equal(conteudoEntrega.includes("<DimensoesFreteExterno"), true);
    assert.equal(conteudoEntrega.includes("<ResumoLogisticaProduto"), true);
    assert.equal(
      conteudoEntrega.includes(
        "Indisponível para produtos com Logística Laquila.",
      ),
      false,
    );
  });

  it("consulta e exibe transportadoras somente no ramo Laquila", () => {
    const conteudoBusca = readFileSync(caminhoBuscaProduto, "utf-8");
    const conteudoEntrega = readFileSync(caminhoEntregaTab, "utf-8");

    assert.equal(
      conteudoBusca.includes("listarTransportadorasLaquila(ambienteLaquila)"),
      true,
    );
    assert.equal(conteudoEntrega.includes("Transportadoras Laquila"), true);
    assert.equal(
      conteudoEntrega.includes(
        "Códigos de transportador aceitos pela integração Laquila. O frete",
      ),
      true,
    );
    assert.equal(
      conteudoEntrega.includes("“O PROPRIO” identifica a coleta pela"),
      true,
    );
    assert.equal(
      conteudoEntrega.includes(
        "Nenhuma transportadora foi retornada pela Laquila.",
      ),
      true,
    );
    assert.equal(
      conteudoEntrega.includes(
        "Não foi possível consultar as transportadoras da Laquila no momento.",
      ),
      false,
    );
    assert.equal(conteudoEntrega.includes('type="radio"'), false);
  });
});
