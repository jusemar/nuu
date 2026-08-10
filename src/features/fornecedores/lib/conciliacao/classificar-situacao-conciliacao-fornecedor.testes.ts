import assert from "node:assert/strict";
import test from "node:test";

import { classificarSituacaoConciliacaoFornecedor } from "./classificar-situacao-conciliacao-fornecedor";

test("pendência obrigatória vence aprovação e alertas", () => {
  assert.equal(
    classificarSituacaoConciliacaoFornecedor({
      atualizacao: false,
      possuiPendencia: true,
      possuiAlertaNovo: true,
      status: "pronto_para_publicar",
    }),
    "pendencia",
  );
});

test("item aprovado sem pendência está pronto", () => {
  assert.equal(
    classificarSituacaoConciliacaoFornecedor({
      atualizacao: true,
      possuiPendencia: false,
      possuiAlertaNovo: false,
      status: "pronto_para_publicar",
    }),
    "pronto",
  );
});

test("produto novo completo sem alerta já está pronto", () => {
  assert.equal(
    classificarSituacaoConciliacaoFornecedor({
      atualizacao: false,
      possuiPendencia: false,
      possuiAlertaNovo: false,
      status: "rascunho",
    }),
    "pronto",
  );
});

test("novo incompleto não vira alerta e atualização aguardando aprovação vira", () => {
  assert.equal(
    classificarSituacaoConciliacaoFornecedor({
      atualizacao: false,
      possuiPendencia: true,
      possuiAlertaNovo: true,
      status: "rascunho",
    }),
    "pendencia",
  );
  assert.equal(
    classificarSituacaoConciliacaoFornecedor({
      atualizacao: true,
      possuiPendencia: false,
      possuiAlertaNovo: false,
      status: "pendente_conciliacao",
    }),
    "alerta",
  );
});
