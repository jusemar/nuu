import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  alternarSelecaoVendaCruzada,
  calcularResumoVendaCruzada,
  montarTextoUnidadesVendaCruzada,
  podeAdicionarVendaCruzada,
} from "../../lib/calcular-resumo-venda-cruzada";
import type { ProdutoVendaCruzadaPdp } from "../../queries/venda-cruzada/buscar-venda-cruzada-pdp";

const produtos = [1000, 2500, 5000].map(
  (precoEmCentavos, indice) =>
    ({ id: `produto-${indice}`, precoEmCentavos }) as ProdutoVendaCruzadaPdp,
);

describe("seleção e total da venda cruzada", () => {
  it("permite marcar, desmarcar e remarcar sem bloquear os demais produtos", () => {
    let selecionados = new Set<string>();

    selecionados = alternarSelecaoVendaCruzada(selecionados, "produto-0", true);
    let resumo = calcularResumoVendaCruzada({
      precoPrincipalEmCentavos: 10_000,
      quantidadePrincipal: 1,
      produtos,
      idsSelecionados: selecionados,
    });
    assert.deepEqual([...selecionados], ["produto-0"]);
    assert.equal(resumo.quantidadeProdutos, 2);
    assert.equal(resumo.totalEmCentavos, 11_000);
    assert.equal(
      podeAdicionarVendaCruzada(true, resumo.quantidadeAdicionais),
      true,
    );

    selecionados = alternarSelecaoVendaCruzada(selecionados, "produto-0", true);
    resumo = calcularResumoVendaCruzada({
      precoPrincipalEmCentavos: 10_000,
      quantidadePrincipal: 1,
      produtos,
      idsSelecionados: selecionados,
    });
    assert.equal(selecionados.size, 0);
    assert.equal(resumo.quantidadeProdutos, 1);
    assert.equal(resumo.totalEmCentavos, 10_000);
    assert.equal(
      podeAdicionarVendaCruzada(true, resumo.quantidadeAdicionais),
      false,
    );

    selecionados = alternarSelecaoVendaCruzada(selecionados, "produto-0", true);
    selecionados = alternarSelecaoVendaCruzada(selecionados, "produto-1", true);
    resumo = calcularResumoVendaCruzada({
      precoPrincipalEmCentavos: 10_000,
      quantidadePrincipal: 1,
      produtos,
      idsSelecionados: selecionados,
    });
    assert.deepEqual([...selecionados], ["produto-0", "produto-1"]);
    assert.equal(resumo.quantidadeProdutos, 3);
    assert.equal(resumo.totalEmCentavos, 13_500);
    assert.equal(
      podeAdicionarVendaCruzada(true, resumo.quantidadeAdicionais),
      true,
    );
    assert.equal(
      podeAdicionarVendaCruzada(false, resumo.quantidadeAdicionais),
      false,
    );
  });

  it("mantém indisponível desabilitado sem confundi-lo com desmarcado", () => {
    const desmarcados = new Set<string>();
    const aposProdutoIndisponivel = alternarSelecaoVendaCruzada(
      desmarcados,
      "produto-0",
      false,
    );
    const aposProdutoDisponivel = alternarSelecaoVendaCruzada(
      desmarcados,
      "produto-1",
      true,
    );

    assert.equal(aposProdutoIndisponivel.has("produto-0"), false);
    assert.equal(aposProdutoDisponivel.has("produto-1"), true);
  });

  it("mantém o principal no resumo mesmo sem adicionais", () => {
    const resumo = calcularResumoVendaCruzada({
      precoPrincipalEmCentavos: 10_000,
      quantidadePrincipal: 2,
      produtos,
      idsSelecionados: new Set(),
    });
    assert.deepEqual(resumo, {
      quantidadeProdutos: 1,
      quantidadeAdicionais: 0,
      totalEmCentavos: 20_000,
    });
  });

  it("soma somente os adicionais marcados, com uma unidade de cada", () => {
    const resumo = calcularResumoVendaCruzada({
      precoPrincipalEmCentavos: 10_000,
      quantidadePrincipal: 2,
      produtos,
      idsSelecionados: new Set(["produto-0", "produto-2"]),
    });
    assert.equal(resumo.quantidadeProdutos, 3);
    assert.equal(resumo.quantidadeAdicionais, 2);
    assert.equal(resumo.totalEmCentavos, 26_000);
  });

  it("não calcula valor antes da variante obrigatória do principal", () => {
    const resumo = calcularResumoVendaCruzada({
      precoPrincipalEmCentavos: null,
      quantidadePrincipal: 1,
      produtos,
      idsSelecionados: new Set(["produto-1"]),
    });
    assert.equal(resumo.quantidadeProdutos, 2);
    assert.equal(resumo.totalEmCentavos, null);
  });

  it("monta os textos de unidades no singular, plural e com adicionais", () => {
    assert.equal(
      montarTextoUnidadesVendaCruzada(1, 0),
      "Produto principal: 1 unidade.",
    );
    assert.equal(
      montarTextoUnidadesVendaCruzada(2, 0),
      "Produto principal: 2 unidades.",
    );
    assert.equal(
      montarTextoUnidadesVendaCruzada(1, 2),
      "Produto principal: 1 unidade. Adicionais selecionados: 1 unidade de cada.",
    );
  });
});
