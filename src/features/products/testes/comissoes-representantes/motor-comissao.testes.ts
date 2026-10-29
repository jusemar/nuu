import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { avaliarEfeitoPedidoComissao } from "../../lib/comissoes-representantes/avaliar-efeito-pedido-comissao";
import { calcularComissaoRepresentante } from "../../lib/comissoes-representantes/calcular-comissao-representante";
import { converterValorComissao } from "../../lib/comissoes-representantes/converter-valor-comissao";
import { criarSnapshotComissaoRepresentante } from "../../lib/comissoes-representantes/criar-snapshot-comissao-representante";
import { configurarComissaoRepresentanteSchema } from "../../schemas/comissoes-representantes/comissao-representante.schema";
import type { EntradaCalculoComissaoRepresentante } from "../../types/comissoes-representantes/comissao-representante.types";

function entrada(
  tipo: "percentual" | "fixa" = "percentual",
  valor = 1000,
  quantidade = 1,
  preco = 10000,
  desconto = 0,
): EntradaCalculoComissaoRepresentante {
  const atribuicao = {
    representanteId: "rep-a",
    representanteFornecedorId: randomUUID(),
    fornecedorId: randomUUID(),
    produtoId: randomUUID(),
    autorizacaoId: randomUUID(),
  };
  return {
    atribuicao,
    regra: {
      atribuicao: { ...atribuicao },
      versao: "2026-10-29T12:00:00.000Z",
      ativa: true,
      regra: { tipo, valor },
    },
    item: {
      quantidade,
      precoUnitarioVendidoCentavos: preco,
      descontoItemCentavos: desconto,
      valorLiquidoItemCentavos: preco * quantidade - desconto,
    },
  };
}
for (const [nome, tipo, valor, quantidade, preco, desconto, esperado] of [
  ["percentual", "percentual", 1000, 1, 10000, 0, 1000],
  [
    "percentual sobre total de três unidades",
    "percentual",
    500,
    3,
    1999,
    0,
    300,
  ],
  ["fixa por quantidade", "fixa", 1000, 3, 9000, 0, 3000],
  ["percentual zero", "percentual", 0, 2, 9000, 0, 0],
  ["fixa zero", "fixa", 0, 2, 9000, 0, 0],
  ["cem por cento", "percentual", 10000, 2, 10000, 1000, 19000],
  ["desconto rateado ao item", "percentual", 1000, 2, 10000, 2000, 1800],
  ["meio centavo arredonda para cima", "percentual", 5000, 1, 1, 0, 1],
  ["fração abaixo de meio centavo", "percentual", 4999, 1, 1, 0, 0],
  ["base totalmente descontada", "percentual", 1000, 2, 10000, 20000, 0],
] as const)
  test(nome, () =>
    assert.equal(
      calcularComissaoRepresentante(
        entrada(tipo, valor, quantidade, preco, desconto),
      ),
      esperado,
    ),
  );

test("percentual e valor fixo inválidos são rejeitados", () => {
  for (const [tipo, valor] of [
    ["percentual", -1],
    ["percentual", 10001],
    ["percentual", 1.5],
    ["fixa", -1],
    ["fixa", 0.1],
    ["fixa", 2147483648],
  ] as const)
    assert.throws(() => calcularComissaoRepresentante(entrada(tipo, valor)));
});
test("dinheiro e quantidade não aceitam float, negativos, inconsistência ou overflow", () => {
  for (const item of [
    { quantidade: 0 },
    { quantidade: 1.1 },
    { precoUnitarioVendidoCentavos: 1.1 },
    { valorLiquidoItemCentavos: 1.1 },
    { descontoItemCentavos: -1 },
    { valorLiquidoItemCentavos: 9999 },
    { descontoItemCentavos: 10001 },
  ]) {
    const dados = entrada();
    Object.assign(dados.item, item);
    assert.throws(() => calcularComissaoRepresentante(dados));
  }
  const dados = entrada("fixa", 2147483647, Number.MAX_SAFE_INTEGER, 0);
  assert.throws(() => calcularComissaoRepresentante(dados), /limite/);
  const seguro = entrada("percentual", 10000, 1, Number.MAX_SAFE_INTEGER);
  assert.equal(calcularComissaoRepresentante(seguro), Number.MAX_SAFE_INTEGER);
});
test("frete e taxa não pertencem ao contrato de cálculo", () => {
  for (const campo of ["freteCentavos", "taxaPagamentoCentavos"]) {
    const dados = entrada();
    Object.assign(dados.item, { [campo]: 100 });
    assert.throws(() => calcularComissaoRepresentante(dados));
  }
});
test("regra inativa e IDs de outra atribuição não calculam comissão", () => {
  const dados = entrada();
  dados.regra.ativa = false;
  assert.throws(() => calcularComissaoRepresentante(dados));
  for (const chave of [
    "representanteId",
    "representanteFornecedorId",
    "fornecedorId",
    "produtoId",
    "autorizacaoId",
  ] as const) {
    const outro = entrada();
    outro.regra.atribuicao[chave] =
      chave === "representanteId" ? "rep-b" : randomUUID();
    assert.throws(() => calcularComissaoRepresentante(outro));
  }
});
test("alterar regra/preço posterior não modifica snapshot serializável e imutável", () => {
  const dados = entrada();
  const snapshot = criarSnapshotComissaoRepresentante({
    ...dados,
    ocorridoEm: "2026-10-29T12:00:00.000Z",
  });
  assert.ok(snapshot);
  const registro = JSON.stringify(snapshot);
  dados.regra.regra.valor = 500;
  dados.item.precoUnitarioVendidoCentavos = 20000;
  assert.equal(snapshot.comissaoCentavos, 1000);
  assert.equal(JSON.stringify(snapshot), registro);
  assert.ok(Object.isFrozen(snapshot.regra));
  assert.throws(() => Object.assign(snapshot.regra, { valor: 500 }));
  assert.throws(() => Object.assign(snapshot, { comissaoCentavos: 1 }));
  assert.equal(JSON.parse(registro).regra.versao, "2026-10-29T12:00:00.000Z");
});
test("sem atribuição não há ganho e vários representantes não são selecionados implicitamente", () => {
  assert.equal(criarSnapshotComissaoRepresentante({ atribuicao: null }), null);
  const dados = entrada();
  assert.throws(() =>
    calcularComissaoRepresentante({
      ...dados,
      atribuicao: [
        dados.atribuicao,
        { ...dados.atribuicao, representanteId: "rep-b" },
      ],
    } as unknown as EntradaCalculoComissaoRepresentante),
  );
});
test("ativação da comissão é independente da autorização e visibilidade", () => {
  const config = {
    autorizacaoId: randomUUID(),
    produtoId: randomUUID(),
    tipo: "percentual",
    valor: 1000,
    ativa: true,
    visivel: false,
  };
  assert.ok(configurarComissaoRepresentanteSchema.safeParse(config).success);
  assert.equal(
    configurarComissaoRepresentanteSchema.parse({ ...config, ativa: false })
      .ativa,
    false,
  );
  assert.equal(
    configurarComissaoRepresentanteSchema.parse({ ...config, ativa: undefined })
      .ativa,
    false,
  );
  assert.equal(
    configurarComissaoRepresentanteSchema.safeParse({
      ...config,
      tipo: null,
      valor: null,
    }).success,
    false,
  );
});
test("efeitos futuros reutilizam estados do pedido sem mutar snapshot ou pagar", () => {
  assert.equal(
    avaliarEfeitoPedidoComissao({ status: "paid", pagamentoStatus: "paid" }),
    "avaliar_venda_valida",
  );
  assert.equal(
    avaliarEfeitoPedidoComissao({
      status: "pending",
      pagamentoStatus: "pending",
    }),
    "aguardar",
  );
  assert.equal(
    avaliarEfeitoPedidoComissao({
      status: "canceled",
      pagamentoStatus: "paid",
    }),
    "anular_por_cancelamento",
  );
  assert.equal(
    avaliarEfeitoPedidoComissao({
      status: "refunded",
      pagamentoStatus: "paid",
    }),
    "anular_por_estorno",
  );
  assert.equal(
    avaliarEfeitoPedidoComissao({
      status: "paid",
      pagamentoStatus: "paid",
      reembolsoStatus: "concluido",
    }),
    "anular_por_estorno",
  );
  assert.equal(
    avaliarEfeitoPedidoComissao({
      status: "delivered",
      pagamentoStatus: "paid",
      decisaoCancelamento: "orientar_devolucao",
    }),
    "revisar_devolucao",
  );
  assert.equal(
    avaliarEfeitoPedidoComissao({
      status: "pagamento_recebido_sem_recursos",
      pagamentoStatus: "paid",
    }),
    "revisar_antes_de_comissionar",
  );
  assert.equal(
    avaliarEfeitoPedidoComissao({
      status: "paid",
      pagamentoStatus: "paid",
      reembolsoStatus: "falhou",
    }),
    "revisar_antes_de_comissionar",
  );
});

test("entrada decimal de comissão é convertida exatamente sem float", () => {
  assert.equal(converterValorComissao("1,15"), 115);
  assert.equal(converterValorComissao("0,29"), 29);
  assert.equal(converterValorComissao("100"), 10000);
  assert.equal(converterValorComissao("21474836,47"), 2147483647);
  for (const v of ["-1", "0,001", "Infinity", "21474836,48"])
    assert.throws(() => converterValorComissao(v));
});
