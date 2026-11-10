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
  const caminhoCadastro = join(
    process.cwd(),
    "src/app/admin/products/new/page.tsx",
  );
  const caminhoRascunhoFornecedor = join(
    process.cwd(),
    "src/features/fornecedores/components/admin/modal-rascunho-produto-fornecedor.tsx",
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
  const caminhoPrecosEntregaPropria = join(
    process.cwd(),
    "src/features/admin/logistics/entrega-propria/components/admin/produto-entrega-propria-precos.tsx",
  );
  const caminhoSalvarPrecos = join(
    process.cwd(),
    "src/features/admin/logistics/entrega-propria/actions/admin-entrega-propria.actions.ts",
  );

  it("cadastro persiste tipos selecionados na aba Entrega com validação no servidor", () => {
    const conteudo = readFileSync(caminhoCriarProduto, "utf-8");
    assert.equal(conteudo.includes("resolverTiposEntregaCadastro(data)"), true);
    assert.equal(
      conteudo.includes('z.enum(["own", "supplier", "carrier"])'),
      true,
    );
    assert.equal(
      conteudo.includes("allowedDeliveryTypes: tiposEntregaPermitidos.data"),
      true,
    );
  });

  it("carrega todas as condições antes de liberar a edição e não faz segunda leitura tardia", () => {
    const busca = readFileSync(caminhoBuscaProduto, "utf-8");
    const componente = readFileSync(caminhoPrecosEntregaPropria, "utf-8");
    const edicao = readFileSync(caminhoEdicao, "utf-8");
    for (const campo of [
      "rapidDeliveryActive: preco.rapidDeliveryActive",
      "scheduledDeliveryActive: preco.scheduledDeliveryActive",
      "scheduledDeliveryMinDays: preco.scheduledDeliveryMinDays",
      "scheduledDeliveryPrice: preco.scheduledDeliveryPrice",
    ]) {
      assert.equal(busca.includes(campo), true);
    }
    assert.equal(
      componente.includes("listarPrecosEntregaPropriaProduto"),
      false,
    );
    assert.equal(
      edicao.includes("!carregamentoInicialAplicadoRef.current"),
      true,
    );
  });

  it("salvamento sem mudança logística não regrava preços", () => {
    const edicao = readFileSync(caminhoEdicao, "utf-8");
    const atualizacao = readFileSync(caminhoAtualizarProduto, "utf-8");
    const salvamento = readFileSync(caminhoSalvarPrecos, "utf-8");
    assert.equal(edicao.includes("omitirLogisticaInalterada("), true);
    assert.equal(
      atualizacao.includes("resolverPrecosAtualizacaoProduto("),
      true,
    );
    assert.equal(
      salvamento.includes("precosEntregaPropriaAlterados(precosAtuais, items)"),
      true,
    );
  });

  it("reutiliza o mesmo componente EntregaTab na edição", () => {
    const conteudo = readFileSync(caminhoEdicao, "utf-8");
    assert.equal(
      conteudo.includes(
        'import { EntregaTab } from "../../new/components/tabs/EntregaTab";',
      ),
      true,
    );
  });

  it("exibe apenas Entrega nos formulários administrativos e uma vez os dados físicos", () => {
    for (const caminho of [
      caminhoCadastro,
      caminhoEdicao,
      caminhoRascunhoFornecedor,
    ]) {
      const conteudo = readFileSync(caminho, "utf-8");
      assert.equal(conteudo.includes("ShippingTab"), false, caminho);
      assert.equal(conteudo.includes('value: "shipping"'), false, caminho);
      assert.equal(conteudo.includes('valor: "shipping"'), false, caminho);
      assert.equal(conteudo.includes("<EntregaTab"), true, caminho);
    }
    const entrega = readFileSync(caminhoEntregaTab, "utf-8");
    assert.equal(entrega.match(/<DimensoesFreteExterno\b/g)?.length, 1);
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
      conteudoIdentificacao.includes("listarProvedoresExpedicaoProdutos"),
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

    // O controle "Permitir Entrega Própria" (Herdar/Ativado/Desativado)
    // vive em componente próprio, ligado pelo mesmo handler da aba.
    assert.equal(
      conteudoEntrega.includes("<DisponibilidadeEntregaPropriaProduto"),
      true,
    );
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

  it("exibe a agenda herdada como leitura e mantém os preços editáveis", () => {
    const conteudo = readFileSync(caminhoPrecosEntregaPropria, "utf-8");

    // Agenda resolvida exibida somente leitura, com origem e link oficial.
    assert.equal(conteudo.includes("Agenda de entrega"), true);
    assert.equal(conteudo.includes("Dias:"), true);
    assert.equal(conteudo.includes("Horário de corte:"), true);
    assert.equal(conteudo.includes("Origem:"), true);
    assert.equal(
      conteudo.includes("Sem agenda de entrega para este destino"),
      true,
    );
    assert.equal(conteudo.includes("Ver Agenda Geográfica"), true);
    // O Produto nunca grava dias/corte: não usa as actions da Agenda Geográfica.
    assert.equal(
      conteudo.includes("salvarAgendaGeograficaEntregaPropria"),
      false,
    );
    // Preços e programada continuam editáveis no Produto.
    assert.equal(conteudo.includes("handlePriceChange"), true);
    assert.equal(conteudo.includes("handleProgramadaChange"), true);
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
