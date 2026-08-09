import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { menuAdmin } from "./sidebar";

describe("menu admin sidebar", () => {
  it("exibe módulos operacionais na seção logística", () => {
    const grupoLogistica = menuAdmin.find((item) => item.id === "logistics");
    assert.ok(grupoLogistica && "items" in grupoLogistica);

    const nomes = (grupoLogistica.items ?? []).map((item) => item.label);
    assert.deepEqual(nomes, [
      "Visão Geral",
      "Integrações",
      "Serviços de Entrega",
      "Regras de Disponibilidade",
      // Entrou no menu junto com o módulo de pagamento na entrega (34f1639);
      // a asserção tinha ficado para trás e quebrava a suíte desde então.
      "Pagamento na Entrega",
      "Retirada",
      "Entrega Própria",
    ]);
  });

  it("separa Fornecedores, Importações e Integrações", () => {
    const ids = menuAdmin.map((item) => item.id);
    assert.ok(ids.includes("fornecedores"));
    assert.ok(ids.includes("importacoes"));
    assert.ok(ids.includes("integracoes"));
  });

  it("mantém Laquila navegável e o roteiro sem link quebrado", () => {
    const integracoes = menuAdmin.find((item) => item.id === "integracoes");
    assert.ok(integracoes && "items" in integracoes);

    const subgrupos = integracoes.items.filter((item) => "items" in item);
    assert.deepEqual(
      subgrupos.map((item) => item.label),
      ["Fornecedores API", "Marketplaces", "Canais de venda"],
    );

    // Laquila é a única integração realmente implementada: precisa ter rota.
    const fornecedoresApi = subgrupos.find(
      (item) => item.id === "integracoes-fornecedores-api",
    );
    assert.ok(fornecedoresApi && "items" in fornecedoresApi);
    const laquila = fornecedoresApi.items[0];
    assert.ok(laquila && "href" in laquila);
    assert.equal(laquila.href, "/admin/fornecedores/integracoes/laquila");
    assert.notEqual("emBreve" in laquila && laquila.emBreve, true);

    // Marketplaces e canais entram como roteiro: visíveis, porém sem navegar,
    // para não existir item de menu que devolve 404.
    for (const id of ["integracoes-marketplaces", "integracoes-canais-venda"]) {
      const subgrupo = subgrupos.find((item) => item.id === id);
      assert.ok(subgrupo && "items" in subgrupo);
      for (const filho of subgrupo.items) {
        assert.equal(
          "emBreve" in filho && filho.emBreve,
          true,
          `${id} > ${filho.label} deveria estar marcado como em breve`,
        );
      }
    }
  });

  it("exibe somente a entrada principal do treinamento do Atendente IA", () => {
    const grupoAtendenteIa = menuAdmin.find(
      (item) => item.id === "atendente-ia",
    );
    assert.ok(grupoAtendenteIa && "items" in grupoAtendenteIa);
    assert.deepEqual(
      grupoAtendenteIa.items.map((item) => item.label),
      ["Treinamento da IA"],
    );
  });
});
