import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  obterAmbienteAplicacaoLaquila,
  resolverUrlBaseLaquila,
  validarAmbienteLaquilaAplicacao,
} from "./ambiente-laquila";

describe("isolamento de ambiente Laquila", () => {
  it("exige APP_ENVIRONMENT explícito e válido", () => {
    assert.equal(obterAmbienteAplicacaoLaquila("homologacao"), "homologacao");
    assert.equal(obterAmbienteAplicacaoLaquila("producao"), "producao");
    assert.throws(() => obterAmbienteAplicacaoLaquila(undefined));
    assert.throws(() => obterAmbienteAplicacaoLaquila("preview"));
  });

  it("bloqueia configuração de outro ambiente", () => {
    assert.equal(
      validarAmbienteLaquilaAplicacao("homologacao", "homologacao"),
      "homologacao",
    );
    assert.throws(() =>
      validarAmbienteLaquilaAplicacao("producao", "homologacao"),
    );
    assert.throws(() =>
      validarAmbienteLaquilaAplicacao("homologacao", "producao"),
    );
  });

  it("aceita somente o host canônico do ambiente e nunca faz fallback", () => {
    const anterior = process.env.APP_ENVIRONMENT;

    try {
      process.env.APP_ENVIRONMENT = "homologacao";
      assert.match(
        resolverUrlBaseLaquila(
          "homologacao",
          "https://hom-api-dropshipping.laquila.com.br/token",
        ),
        /^https:\/\/hom-api-dropshipping\.laquila\.com\.br\/token/u,
      );
      assert.throws(() =>
        resolverUrlBaseLaquila(
          "homologacao",
          "https://api-dropshipping.laquila.com.br/token",
        ),
      );
    } finally {
      if (anterior === undefined) delete process.env.APP_ENVIRONMENT;
      else process.env.APP_ENVIRONMENT = anterior;
    }
  });
});
