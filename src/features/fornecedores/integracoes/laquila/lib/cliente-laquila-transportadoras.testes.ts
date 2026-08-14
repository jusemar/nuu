import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  consultarTransportadorasLaquila,
  criarClienteLaquila,
  normalizarTransportadorasLaquila,
} from "./cliente-laquila";

const configuracao = {
  id: "integracao-teste",
  urlBase: "https://api-dropshipping.laquila.com.br/token-rota",
  cnpjEmpresa: "00000000000000",
  tokenClienteCriptografado: null,
};

describe("transportadoras Laquila", () => {
  it("normaliza código, descrição e CNPJ do contrato 00015", () => {
    const transportadoras = normalizarTransportadorasLaquila({
      resultado: {
        transportadores: [
          {
            transportador: {
              cd_transportador: "17499",
              cnpj_transportador: "00000000000000",
              descricao: "17499 - CORREIO",
            },
          },
          {
            transportador: {
              CD_TRANSPORTADOR: 49096,
              CNPJ_TRANSPORTADOR: null,
              DS_TRANSPORTADOR: "49096 - MERCADO ENVIOS COLET",
            },
          },
        ],
      },
    });

    assert.deepEqual(transportadoras, [
      {
        codigo: "17499",
        cnpj: "00000000000000",
        descricao: "CORREIO",
      },
      {
        codigo: "49096",
        cnpj: null,
        descricao: "MERCADO ENVIOS COLET",
      },
    ]);
  });

  it("devolve falha controlada quando a API fica indisponível", async () => {
    const fetchOriginal = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("falha simulada de rede");
    };

    try {
      const resultado = await consultarTransportadorasLaquila({
        cliente: criarClienteLaquila(configuracao, 50),
        tokenCliente: "token-somente-teste",
      });

      assert.equal(resultado.sucesso, false);
      if (!resultado.sucesso) {
        assert.equal(
          resultado.erro,
          "Falha de rede ao comunicar com a API Laquila.",
        );
      }
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  });
});
