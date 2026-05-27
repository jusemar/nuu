import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { alternarRegraProdutoFrete } from "./alternar-regra-produto-frete";
import { editarRegraProdutoFrete } from "./editar-regra-produto-frete";
import { removerRegraProdutoFrete } from "./remover-regra-produto-frete";

describe("acoes admin regras por produto", () => {
  it("falha ao editar sem id", async () => {
    const resposta = await editarRegraProdutoFrete("", { efeito: "bloquear" });
    assert.equal(resposta.sucesso, false);
  });

  it("falha ao remover sem id", async () => {
    const resposta = await removerRegraProdutoFrete("");
    assert.equal(resposta.sucesso, false);
  });

  it("falha ao desativar sem id", async () => {
    const resposta = await alternarRegraProdutoFrete("", false);
    assert.equal(resposta.sucesso, false);
  });
});

