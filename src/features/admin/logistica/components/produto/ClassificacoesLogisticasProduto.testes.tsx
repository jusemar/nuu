import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ClassificacoesLogisticasProduto } from "./ClassificacoesLogisticasProduto";

describe("classificacoes logisticas do produto", () => {
  it("renderiza ajuda operacional e classificacoes disponiveis", () => {
    const html = renderToStaticMarkup(
      <ClassificacoesLogisticasProduto
        produtoId="p1"
        classificacoesDisponiveis={[
          { id: "t1", nome: "Produto pesado", ativo: true },
          { id: "t2", nome: "Grande volume", ativo: true },
          { id: "t3", nome: "Produto frágil", ativo: true },
        ]}
        classificacoesVinculadas={[]}
      />,
    );

    assert.equal(html.includes("Classificações Logísticas"), true);
    assert.equal(html.includes("Ajuda: Classificação logística"), true);
    assert.equal(html.includes("transportadoras e"), true);
    assert.equal(
      html.includes("serviços podem ser usados neste produto"),
      true,
    );
    assert.equal(html.includes("Produto pesado"), true);
    assert.equal(html.includes("Grande volume"), true);
    assert.equal(html.includes("Produto frágil"), true);
    assert.equal(html.includes("Correios"), false);
    assert.equal(html.includes("Jadlog"), false);
  });

  it("mostra classificacoes vinculadas com acao para remocao", () => {
    const html = renderToStaticMarkup(
      <ClassificacoesLogisticasProduto
        produtoId="p1"
        classificacoesDisponiveis={[
          { id: "t1", nome: "Produto pesado", ativo: true },
          { id: "t2", nome: "Produto frágil", ativo: true },
        ]}
        classificacoesVinculadas={[
          {
            vinculoId: "v1",
            tipoLogisticoId: "t1",
            tipoLogisticoNome: "Produto pesado",
          },
        ]}
      />,
    );

    assert.equal(html.includes("Vinculadas ao produto"), true);
    assert.equal(html.includes("Remover"), true);
    assert.equal(html.includes('value="t1"'), false);
    assert.equal(html.includes('value="t2"'), true);
  });

  it("produto novo exibe opções reais para seleção", () => {
    const htmlProdutoNovo = renderToStaticMarkup(
      <ClassificacoesLogisticasProduto
        classificacoesDisponiveis={[
          { id: "t1", nome: "Produto pesado", ativo: true },
        ]}
        classificacoesVinculadas={[]}
      />,
    );
    const htmlCompleto = renderToStaticMarkup(
      <ClassificacoesLogisticasProduto
        produtoId="p1"
        classificacoesDisponiveis={[
          { id: "t1", nome: "Produto pesado", ativo: true },
        ]}
        classificacoesVinculadas={[
          {
            vinculoId: "v1",
            tipoLogisticoId: "t1",
            tipoLogisticoNome: "Produto pesado",
          },
        ]}
      />,
    );

    assert.equal(htmlProdutoNovo.includes("Selecionar classificação"), true);
    assert.equal(htmlProdutoNovo.includes('value="t1"'), true);
    assert.equal(
      htmlCompleto.includes("Nenhuma classificação disponível para vincular."),
      true,
    );
  });

  it("produto novo visualiza classificações selecionadas", () => {
    const html = renderToStaticMarkup(
      <ClassificacoesLogisticasProduto
        classificacoesDisponiveis={[
          { id: "t1", nome: "Produto pesado", ativo: true },
        ]}
        classificacoesVinculadas={[]}
        classificacoesSelecionadasNoCadastro={["t1"]}
      />,
    );

    assert.equal(html.includes("Produto pesado"), true);
    assert.equal(html.includes("Remover"), true);
  });

  it("usa layout adaptavel no seletor e nos vinculos", () => {
    const html = renderToStaticMarkup(
      <ClassificacoesLogisticasProduto
        produtoId="p1"
        classificacoesDisponiveis={[
          { id: "t2", nome: "Grande volume", ativo: true },
        ]}
        classificacoesVinculadas={[
          {
            vinculoId: "v1",
            tipoLogisticoId: "t1",
            tipoLogisticoNome: "Produto pesado",
          },
        ]}
      />,
    );

    assert.equal(html.includes("sm:grid-cols-[minmax(0,1fr)_auto]"), true);
    assert.equal(html.includes("sm:grid-cols-2"), true);
    assert.equal(html.includes("flex flex-wrap"), true);
  });
});
