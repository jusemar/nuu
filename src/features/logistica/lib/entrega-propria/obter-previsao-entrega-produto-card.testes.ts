import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ResultadoConsultaEntregaPropriaLoja } from "../../actions/consultar-entrega-propria-loja";
import { obterPrevisaoEntregaProdutoCard } from "./obter-previsao-entrega-produto-card";

describe("previsão curta da Entrega Própria nos cards", () => {
  it("exibe somente a promessa calculada para produto e endereço válidos", () => {
    const resultado = {
      disponivel: true,
      valorEmCentavos: 1800,
      nivel: "regiao",
      descricao: "Entrega própria",
      prazoEntrega: "Entrega hoje",
      promessaEntrega: {
        dataPrometida: "2026-07-22",
        texto: "Entrega hoje",
        observacaoPagamento: "Para pedidos com pagamento aprovado até 13:00.",
        diasConfigurados: [1, 3],
        horarioCorteAplicado: "13:00",
        periodoEntrega: null,
        timezone: "America/Sao_Paulo",
        calculadoEm: "2026-07-22T15:00:00.000Z",
        feriadosConsiderados: false,
      },
      bairro: "Centro",
      cidade: "Belo Horizonte",
      uf: "MG",
      endereco: {
        cep: "30140071",
        logradouro: "Rua da Bahia",
        bairro: "Centro",
        cidade: "Belo Horizonte",
        uf: "MG",
      },
    } satisfies ResultadoConsultaEntregaPropriaLoja;

    assert.equal(obterPrevisaoEntregaProdutoCard(resultado), "Entrega hoje");
  });

  it("não exibe fallback nem previsão genérica sem agenda válida", () => {
    const resultado = {
      disponivel: false,
      mensagem: "Consulte o vendedor",
    } satisfies ResultadoConsultaEntregaPropriaLoja;

    assert.equal(obterPrevisaoEntregaProdutoCard(resultado), null);
  });
});
