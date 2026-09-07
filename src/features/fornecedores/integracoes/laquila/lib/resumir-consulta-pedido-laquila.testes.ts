import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resumirConsultaPedidoLaquila } from "./resumir-consulta-pedido-laquila";

describe("resumo sanitizado da consulta Laquila 00008", () => {
  it("confirma o pedido e preserva somente status e datas operacionais", () => {
    const resumo = resumirConsultaPedidoLaquila({
      idPedido: "1133591",
      consultadoEm: new Date("2026-09-07T12:00:00.000Z"),
      resposta: {
        sucesso: true,
        codigoHttp: 200,
        dados: {
          resultado: {
            pedidos: [
              {
                id_pedido: "1133591",
                situacao: "PROCESSANDO",
                dt_pedido: "07/09/2026 07:06:57",
                cpf_cnpj: "00000000000",
              },
            ],
          },
        },
      },
    });

    assert.deepEqual(resumo, {
      metodo: "00008",
      consultadoEm: "2026-09-07T12:00:00.000Z",
      sucesso: true,
      codigoHttp: 200,
      pedidoEncontrado: true,
      statusInicial: "PROCESSANDO",
      datas: { dt_pedido: "07/09/2026 07:06:57" },
    });
    assert.equal("cpf_cnpj" in resumo, false);
  });

  it("não confunde HTTP 200 com pedido confirmado quando o ID está ausente", () => {
    const resumo = resumirConsultaPedidoLaquila({
      idPedido: "1133591",
      resposta: {
        sucesso: true,
        codigoHttp: 200,
        dados: { resultado: { pedidos: [] } },
      },
    });

    assert.equal(resumo.sucesso, false);
    assert.equal(resumo.pedidoEncontrado, false);
    assert.match(resumo.erro ?? "", /não confirmou/u);
  });

  it("sanitiza documento e URL de uma falha externa", () => {
    const resumo = resumirConsultaPedidoLaquila({
      idPedido: "1133591",
      resposta: {
        sucesso: false,
        codigoHttp: 500,
        erro: "Falha para 48732308000158 em https://host/token/00008",
      },
    });

    assert.equal(resumo.sucesso, false);
    assert.doesNotMatch(resumo.erro ?? "", /48732308000158|token/u);
  });
});
