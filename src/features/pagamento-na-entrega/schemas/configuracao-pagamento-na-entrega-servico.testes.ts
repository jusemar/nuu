import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extrairDadosFormularioConfiguracao,
  salvarConfiguracaoPagamentoNaEntregaServicoSchema,
} from "./configuracao-pagamento-na-entrega-servico.schema";

const SERVICO_ID = "11111111-1111-4111-8111-111111111111";

/**
 * Monta um `FormData` como o navegador realmente envia.
 *
 * Detalhe que os testes precisam respeitar: checkbox e switch desmarcados **não são
 * enviados**. Por isso os campos booleanos só entram quando o valor é `true`.
 */
function montarFormData(campos: Record<string, string | boolean | undefined>) {
  const formData = new FormData();

  for (const [chave, valor] of Object.entries(campos)) {
    if (valor === undefined || valor === false) continue;
    formData.set(chave, valor === true ? "on" : valor);
  }

  return formData;
}

function validar(campos: Record<string, string | boolean | undefined>) {
  return salvarConfiguracaoPagamentoNaEntregaServicoSchema.safeParse(
    extrairDadosFormularioConfiguracao(montarFormData(campos)),
  );
}

describe("schema da configuracao de pagamento na entrega por servico", () => {
  it("converte reais digitados para centavos", () => {
    const resultado = validar({
      servicoFreteId: SERVICO_ID,
      aceitaPagamentoNaEntrega: true,
      aceitaDinheiro: true,
      valorMinimoPedidoEmCentavos: "50",
      valorMaximoPedidoEmCentavos: "1000.50",
      ativo: true,
    });

    assert.equal(resultado.success, true);
    assert.equal(resultado.data?.valorMinimoPedidoEmCentavos, 5_000);
    assert.equal(resultado.data?.valorMaximoPedidoEmCentavos, 100_050);
  });

  it("arredonda em vez de truncar valores com centavos quebrados", () => {
    // 50.9 * 100 dá 5089.999... em ponto flutuante. Truncar viraria R$ 50,89.
    const resultado = validar({
      servicoFreteId: SERVICO_ID,
      aceitaPagamentoNaEntrega: true,
      aceitaDinheiro: true,
      valorMinimoPedidoEmCentavos: "50.9",
      ativo: true,
    });

    assert.equal(resultado.data?.valorMinimoPedidoEmCentavos, 5_090);
  });

  it("campo monetario vazio vira null (sem limite), nunca zero", () => {
    const resultado = validar({
      servicoFreteId: SERVICO_ID,
      aceitaPagamentoNaEntrega: true,
      aceitaDinheiro: true,
      valorMinimoPedidoEmCentavos: "",
      ativo: true,
    });

    assert.equal(resultado.data?.valorMinimoPedidoEmCentavos, null);
  });

  it("trata checkbox ausente como false", () => {
    const resultado = validar({
      servicoFreteId: SERVICO_ID,
      aceitaPagamentoNaEntrega: false,
      ativo: false,
    });

    assert.equal(resultado.success, true);
    assert.equal(resultado.data?.aceitaPagamentoNaEntrega, false);
    assert.equal(resultado.data?.aceitaDinheiro, false);
    assert.equal(resultado.data?.exigeTroco, false);
    assert.equal(resultado.data?.ativo, false);
  });

  it("recusa ligar o servico sem nenhuma forma habilitada", () => {
    const resultado = validar({
      servicoFreteId: SERVICO_ID,
      aceitaPagamentoNaEntrega: true,
      ativo: true,
    });

    assert.equal(resultado.success, false);
    assert.match(
      resultado.error?.issues[0]?.message ?? "",
      /ao menos uma forma/i,
    );
  });

  it("permite desligar o servico sem exigir formas", () => {
    const resultado = validar({
      servicoFreteId: SERVICO_ID,
      aceitaPagamentoNaEntrega: false,
      ativo: true,
    });

    assert.equal(resultado.success, true);
  });

  it("recusa minimo maior que o maximo", () => {
    const resultado = validar({
      servicoFreteId: SERVICO_ID,
      aceitaPagamentoNaEntrega: true,
      aceitaDinheiro: true,
      valorMinimoPedidoEmCentavos: "200",
      valorMaximoPedidoEmCentavos: "100",
      ativo: true,
    });

    assert.equal(resultado.success, false);
    assert.match(resultado.error?.issues[0]?.message ?? "", /mínimo/i);
  });

  it("recusa limite de dinheiro acima do maximo do pedido", () => {
    const resultado = validar({
      servicoFreteId: SERVICO_ID,
      aceitaPagamentoNaEntrega: true,
      aceitaDinheiro: true,
      valorMaximoPedidoEmCentavos: "300",
      valorMaximoDinheiroEmCentavos: "500",
      ativo: true,
    });

    assert.equal(resultado.success, false);
    assert.match(
      resultado.error?.issues[0]?.message ?? "",
      /limite de dinheiro/i,
    );
  });

  it("recusa id de servico que nao e uuid", () => {
    const resultado = validar({
      servicoFreteId: "entrega-propria-atual",
      aceitaPagamentoNaEntrega: false,
    });

    assert.equal(resultado.success, false);
  });

  it("recusa valor monetario negativo", () => {
    const resultado = validar({
      servicoFreteId: SERVICO_ID,
      aceitaPagamentoNaEntrega: true,
      aceitaDinheiro: true,
      valorMinimoPedidoEmCentavos: "-10",
      ativo: true,
    });

    assert.equal(resultado.success, false);
  });

  it("normaliza observacoes: espaco em branco vira null", () => {
    const resultado = validar({
      servicoFreteId: SERVICO_ID,
      aceitaPagamentoNaEntrega: true,
      aceitaDinheiro: true,
      observacoesCliente: "   ",
      ativo: true,
    });

    assert.equal(resultado.data?.observacoesCliente, null);
  });

  it("recusa observacoes acima de 500 caracteres", () => {
    const resultado = validar({
      servicoFreteId: SERVICO_ID,
      aceitaPagamentoNaEntrega: true,
      aceitaDinheiro: true,
      observacoesCliente: "a".repeat(501),
      ativo: true,
    });

    assert.equal(resultado.success, false);
  });
});
