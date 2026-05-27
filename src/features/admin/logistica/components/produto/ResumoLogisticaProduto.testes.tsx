import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ResumoLogisticaProduto } from "./ResumoLogisticaProduto";

describe("resumo logistica produto", () => {
  it("produto mostra tipos vinculados", () => {
    const html = renderToStaticMarkup(
      <ResumoLogisticaProduto
        produtoId="p1"
        tiposDisponiveis={[{ id: "t1", nome: "Produto Frágil", ativo: true }]}
        tiposVinculados={[
          {
            vinculoId: "v1",
            tipoLogisticoId: "t1",
            tipoLogisticoNome: "Produto Frágil",
          },
        ]}
        regrasProduto={[]}
      />,
    );

    assert.equal(html.includes("Produto Frágil"), true);
    assert.equal(html.includes("Remover"), true);
    assert.equal(html.includes("Classificações Logísticas"), true);
  });

  it("produto mostra regras existentes", () => {
    const html = renderToStaticMarkup(
      <ResumoLogisticaProduto
        produtoId="p1"
        tiposDisponiveis={[]}
        tiposVinculados={[]}
        regrasProduto={[
          {
            id: "r1",
            efeito: "bloquear",
            ativo: true,
            provedorNome: "Frenet",
            transportadoraNome: "Correios",
            servicoNome: "Correios PAC",
          },
        ]}
      />,
    );

    assert.equal(html.includes("Regras específicas cadastradas"), true);
    assert.equal(html.includes("Regras específicas"), true);
    assert.equal(html.includes("Bloquear"), true);
    assert.equal(html.includes("Bloquear Correios PAC neste produto"), true);
    assert.equal(html.includes("Herança da variante"), true);
    assert.equal(
      html.includes(
        "Se a variante não possuir configuração própria, o sistema usa a configuração do produto.",
      ),
      true,
    );
    assert.equal(html.includes("Serviços Disponíveis"), false);
    assert.equal(html.includes("Herdadas da categoria"), false);
  });

  it("loading renderiza", () => {
    const html = renderToStaticMarkup(
      <ResumoLogisticaProduto
        produtoId="p1"
        tiposDisponiveis={[]}
        tiposVinculados={[]}
        regrasProduto={[]}
        carregando
      />,
    );
    assert.equal(html.includes("Regras Logísticas"), true);
  });

  it("mensagens renderizam", () => {
    const htmlSucesso = renderToStaticMarkup(
      <ResumoLogisticaProduto
        produtoId="p1"
        tiposDisponiveis={[]}
        tiposVinculados={[]}
        regrasProduto={[]}
        mensagem={{
          tipo: "sucesso",
          texto: "Tipo logístico vinculado com sucesso.",
        }}
      />,
    );
    const htmlErro = renderToStaticMarkup(
      <ResumoLogisticaProduto
        produtoId="p1"
        tiposDisponiveis={[]}
        tiposVinculados={[]}
        regrasProduto={[]}
        mensagem={{ tipo: "erro", texto: "Falha ao vincular." }}
      />,
    );
    assert.equal(
      htmlSucesso.includes("Tipo logístico vinculado com sucesso."),
      true,
    );
    assert.equal(htmlErro.includes("Falha ao vincular."), true);
  });

  it("estados vazios renderizam", () => {
    const html = renderToStaticMarkup(
      <ResumoLogisticaProduto
        produtoId="p1"
        tiposDisponiveis={[]}
        tiposVinculados={[]}
        regrasProduto={[]}
      />,
    );
    assert.equal(
      html.includes("Nenhuma classificação logística vinculada neste produto."),
      true,
    );
    assert.equal(
      html.includes("Nenhuma regra específica configurada para este produto."),
      true,
    );
    assert.equal(html.includes("Serviços Disponíveis"), false);
  });

  it("responsividade basica", () => {
    const html = renderToStaticMarkup(
      <ResumoLogisticaProduto
        produtoId="p1"
        tiposDisponiveis={[{ id: "t1", nome: "Produto Pesado", ativo: true }]}
        tiposVinculados={[
          {
            vinculoId: "v1",
            tipoLogisticoId: "t1",
            tipoLogisticoNome: "Produto Pesado",
          },
        ]}
        regrasProduto={[]}
      />,
    );
    assert.equal(html.includes("sm:grid-cols-2"), true);
    assert.equal(html.includes("flex flex-wrap"), true);
  });
});
