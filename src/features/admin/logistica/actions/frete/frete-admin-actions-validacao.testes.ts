import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { alternarProvedorFrete } from "./provedores";
import { alternarServicoFrete } from "./servicos";
import { editarTransportadoraFrete } from "./transportadoras";

describe("actions admin frete - validacao", () => {
  it("falha edicao de transportadora sem id", async () => {
    const resposta = await editarTransportadoraFrete("", { nome: "Atualizada" });

    assert.equal(resposta.sucesso, false);
    if (!resposta.sucesso) {
      assert.equal(resposta.erro, "ID da transportadora é obrigatório");
    }
  });

  it("falha ativacao de provedor com payload invalido", async () => {
    const resposta = await alternarProvedorFrete(
      "9f59069c-0f06-4c5e-9d8c-69f47e212f2d",
      { ativo: "sim" },
    );

    assert.equal(resposta.sucesso, false);
  });

  it("falha ativacao de servico sem id", async () => {
    const resposta = await alternarServicoFrete("", { ativo: true });

    assert.equal(resposta.sucesso, false);
    if (!resposta.sucesso) {
      assert.equal(resposta.erro, "ID do serviço é obrigatório");
    }
  });
});

