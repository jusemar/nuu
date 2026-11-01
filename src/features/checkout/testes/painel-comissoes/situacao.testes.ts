import assert from "node:assert/strict";
import test from "node:test";

import {
  formatarCentavosHistoricos,
  formatarRegraHistorica,
} from "../../lib/painel-comissoes/formatar-valores";
import { derivarSituacaoComissao } from "../../lib/painel-comissoes/situacao-comissao";
import {
  filtrosComissoesSchema,
  quitarComissaoSchema,
} from "../../schemas/painel-comissoes/painel.schema";
const sinais = {
  confirmada: true,
  cancelada: false,
  estornada: false,
  pedidoCancelado: false,
  pedidoReembolsado: false,
  quitada: false,
};
test("precedência conserva invalidação após quitação e durante atraso de eventos", () => {
  assert.equal(derivarSituacaoComissao(sinais), "a_receber");
  assert.equal(
    derivarSituacaoComissao({ ...sinais, quitada: true }),
    "quitada",
  );
  assert.equal(
    derivarSituacaoComissao({ ...sinais, confirmada: false, quitada: true }),
    "aguardando_confirmacao",
  );
  for (const invalidacao of [{ cancelada: true }, { pedidoCancelado: true }])
    assert.equal(
      derivarSituacaoComissao({ ...sinais, quitada: true, ...invalidacao }),
      "cancelada",
    );
  for (const invalidacao of [{ estornada: true }, { pedidoReembolsado: true }])
    assert.equal(
      derivarSituacaoComissao({
        ...sinais,
        quitada: true,
        cancelada: true,
        ...invalidacao,
      }),
      "estornada",
    );
});
test("centavos agregados acima do limite de Number não perdem precisão", () => {
  assert.equal(
    formatarCentavosHistoricos("900719925474099199"),
    "R$ 9.007.199.254.740.991,99",
  );
  assert.equal(formatarCentavosHistoricos("-1"), "-R$ 0,01");
  assert.equal(formatarRegraHistorica("percentual", 525), "5,25% nesta venda");
  assert.equal(formatarRegraHistorica("fixa", 1000), "R$ 10,00 por unidade");
});
test("entradas rejeitam campos inesperados e intervalos e paginações inválidos", () => {
  for (const f of [
    { pagina: 0 },
    { pagina: 100001 },
    { de: "2026-02-30" },
    { de: "2026-10-01", ate: "2026-09-01" },
    { situacao: "saldo_sacavel" },
    { representativeId: "outro" },
  ])
    assert.equal(filtrosComissoesSchema.safeParse(f).success, false);
  assert.equal(
    quitarComissaoSchema.safeParse({
      comissaoId: "00000000-0000-4000-8000-000000000001",
      data: "2026-01-10",
      valorEmCentavos: 1,
    }).success,
    false,
  );
});
