import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { alternarRegraCategoriaFrete } from "./alternar-regra-categoria-frete";
import { editarRegraCategoriaFrete } from "./editar-regra-categoria-frete";
import { removerRegraCategoriaFrete } from "./remover-regra-categoria-frete";

describe("acoes admin regras por categoria", () => {
  it("falha ao editar sem id", async () => {
    const resposta = await editarRegraCategoriaFrete("", { efeito: "bloquear" });
    assert.equal(resposta.sucesso, false);
  });

  it("falha ao remover sem id", async () => {
    const resposta = await removerRegraCategoriaFrete("");
    assert.equal(resposta.sucesso, false);
  });

  it("falha ao desativar sem id", async () => {
    const resposta = await alternarRegraCategoriaFrete("", false);
    assert.equal(resposta.sucesso, false);
  });
});

