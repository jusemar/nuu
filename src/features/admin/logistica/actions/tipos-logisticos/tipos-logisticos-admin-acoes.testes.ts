import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { alternarTipoLogistico } from "./alternar-tipo-logistico";
import { desvincularProdutoTipoLogistico } from "./desvincular-produto-tipo-logistico";
import { desvincularVarianteTipoLogistico } from "./desvincular-variante-tipo-logistico";
import { editarTipoLogistico } from "./editar-tipo-logistico";

describe("acoes tipos logisticos admin", () => {
  it("falha ao editar sem id", async () => {
    const resposta = await editarTipoLogistico("", { nome: "Frágil" });
    assert.equal(resposta.sucesso, false);
  });

  it("falha ao desativar sem id", async () => {
    const resposta = await alternarTipoLogistico("", false);
    assert.equal(resposta.sucesso, false);
  });

  it("falha ao desvincular sem id", async () => {
    const resposta = await desvincularProdutoTipoLogistico("");
    assert.equal(resposta.sucesso, false);
  });

  it("falha ao remover classificação de variante sem id", async () => {
    const resposta = await desvincularVarianteTipoLogistico("");
    assert.equal(resposta.sucesso, false);
  });
});
