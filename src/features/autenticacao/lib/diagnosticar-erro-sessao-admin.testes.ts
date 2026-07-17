import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classificarSessaoAdmin,
  consultarSessaoComRepeticao,
  diagnosticarErroSessaoAdmin,
} from "./diagnosticar-erro-sessao-admin";

describe("diagnóstico da sessão administrativa", () => {
  it("diferencia sessão ausente, expirada, sem permissão e autorizada", () => {
    assert.equal(
      classificarSessaoAdmin({
        cookieSessaoPresente: false,
        usuarioPresente: false,
        autorizado: false,
      }),
      "sessao_ausente",
    );
    assert.equal(
      classificarSessaoAdmin({
        cookieSessaoPresente: true,
        usuarioPresente: false,
        autorizado: false,
      }),
      "sessao_expirada",
    );
    assert.equal(
      classificarSessaoAdmin({
        cookieSessaoPresente: true,
        usuarioPresente: true,
        autorizado: false,
      }),
      "sem_permissao",
    );
    assert.equal(
      classificarSessaoAdmin({
        cookieSessaoPresente: true,
        usuarioPresente: true,
        autorizado: true,
      }),
      "ok",
    );
  });

  it("identifica falha transitória do Better Auth sem dados sensíveis", () => {
    const diagnostico = diagnosticarErroSessaoAdmin({
      name: "APIError",
      status: "INTERNAL_SERVER_ERROR",
      body: { code: "INTERNAL_SERVER_ERROR" },
    });
    assert.equal(diagnostico.codigo, "INTERNAL_SERVER_ERROR");
    assert.equal(diagnostico.transitorio, true);
  });

  it("repete uma vez e devolve a sessão quando a conexão se recupera", async () => {
    let tentativas = 0;
    const sessao = await consultarSessaoComRepeticao({
      consultar: async () => {
        tentativas += 1;
        if (tentativas === 1) {
          throw new Error(
            "Error connecting to database: TypeError: fetch failed",
          );
        }
        return { user: { id: "admin" } };
      },
      aguardar: async () => undefined,
    });
    assert.equal(tentativas, 2);
    assert.equal(sessao.user.id, "admin");
  });

  it("não repete erro que não é transitório", async () => {
    let tentativas = 0;
    await assert.rejects(
      consultarSessaoComRepeticao({
        consultar: async () => {
          tentativas += 1;
          throw new Error("Falha de configuração");
        },
        aguardar: async () => undefined,
      }),
    );
    assert.equal(tentativas, 1);
  });
});
