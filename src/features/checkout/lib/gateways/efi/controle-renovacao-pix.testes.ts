import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  decidirRetomadaPix,
  montarProviderResponsePixRenovado,
  obterGeracaoAtualPix,
} from "./controle-renovacao-pix";

const cobrancaCompleta = {
  transactionId: "txid",
  pixTxid: "txid",
  qrCode: "data:image/png;base64,abc",
  copiaECola: "000201",
  expiresAt: new Date("2026-09-06T18:00:00.000Z"),
};

describe("retomada segura do Pix Efí", () => {
  it("reutiliza uma cobrança ainda válida", () => {
    assert.equal(
      decidirRetomadaPix({
        statusPagamento: "pending",
        statusPedido: "pending",
        referencias: cobrancaCompleta,
        providerResponse: null,
        agora: new Date("2026-09-06T17:59:59.000Z"),
      }),
      "reutilizar",
    );
  });

  it("renova cobrança vencida derivada ou já persistida como expirada", () => {
    assert.equal(
      decidirRetomadaPix({
        statusPagamento: "pending",
        statusPedido: "pending",
        referencias: cobrancaCompleta,
        providerResponse: null,
        agora: new Date("2026-09-06T18:00:00.000Z"),
      }),
      "renovar",
    );
    assert.equal(
      decidirRetomadaPix({
        statusPagamento: "expired",
        statusPedido: "expired",
        referencias: cobrancaCompleta,
        providerResponse: null,
      }),
      "renovar",
    );
  });

  it("não gera Pix quando o pagamento já foi confirmado", () => {
    assert.equal(
      decidirRetomadaPix({
        statusPagamento: "paid",
        statusPedido: "paid",
        referencias: cobrancaCompleta,
        providerResponse: null,
      }),
      "pagamento_confirmado",
    );
  });

  it("bloqueia clique concorrente enquanto outra geração está em andamento", () => {
    assert.equal(
      decidirRetomadaPix({
        statusPagamento: "failed",
        statusPedido: "expired",
        referencias: cobrancaCompleta,
        providerResponse: {
          controlePix: { estado: "gerando", geracao: 2 },
        },
      }),
      "em_processamento",
    );
  });

  it("preserva a geração anterior no histórico estruturado", () => {
    const provider = montarProviderResponsePixRenovado({
      providerResponseAnterior: { cobranca: { txid: "anterior" } },
      providerResponseNovo: { cobranca: { txid: "novo" } },
      txidAnterior: "anterior",
      expiresAtAnterior: new Date("2026-09-06T18:00:00.000Z"),
      geracaoAnterior: 1,
      geracaoNova: 2,
      renovadoEm: new Date("2026-09-06T19:00:00.000Z"),
    });

    assert.equal(obterGeracaoAtualPix(provider), 2);
    assert.deepEqual(provider.historicoCobrancasPix, [
      {
        geracao: 1,
        txid: "anterior",
        expiresAt: "2026-09-06T18:00:00.000Z",
        substituidaEm: "2026-09-06T19:00:00.000Z",
        motivo: "expirada",
      },
    ]);
  });
});
