import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  CodigoMotivoPagamentoNaEntrega,
  ConfiguracaoPagamentoNaEntregaServico,
  EntradaAvaliacaoPagamentoNaEntrega,
  ItemAvaliacaoPagamentoNaEntrega,
  ResultadoAvaliacaoPagamentoNaEntrega,
} from "../types/pagamento-na-entrega.types";
import { avaliarElegibilidadePagamentoNaEntrega } from "./avaliar-elegibilidade-pagamento-na-entrega";

// Instante fixo: o motor recebe o horário por parâmetro justamente para o teste não
// depender do relógio. Com valor constante, a mesma entrada sempre gera a mesma saída.
const AVALIADO_EM = "2026-08-05T12:00:00.000Z";
const CEP = "01234567";

function criarConfiguracao(
  ajustes: Partial<ConfiguracaoPagamentoNaEntregaServico> = {},
): ConfiguracaoPagamentoNaEntregaServico {
  return {
    id: "cfg-1",
    servicoFreteId: "svc-uuid-1",
    servicoIdentificador: "entrega-propria-atual",
    servicoNome: "Entrega rápida",
    servicoAtivo: true,
    aceitaPagamentoNaEntrega: true,
    aceitaDinheiro: true,
    aceitaPixNaEntrega: false,
    aceitaDebito: true,
    aceitaCredito: false,
    valorMinimoPedidoEmCentavos: null,
    valorMaximoPedidoEmCentavos: null,
    valorMaximoDinheiroEmCentavos: null,
    exigeTroco: true,
    observacoesCliente: null,
    ativo: true,
    atualizadoEm: "2026-08-04T00:00:00.000Z",
    ...ajustes,
  };
}

function criarItem(
  ajustes: Partial<ItemAvaliacaoPagamentoNaEntrega> = {},
): ItemAvaliacaoPagamentoNaEntrega {
  return {
    itemCarrinhoId: "item-1",
    produtoId: "prod-1",
    varianteId: null,
    produtoAceitaPagamentoNaEntrega: true,
    varianteAceitaPagamentoNaEntrega: null,
    modalidadeComercial: "stock",
    frete: {
      provedor: "entrega-propria",
      servico: "entrega-propria-atual",
      cepCotado: CEP,
    },
    ...ajustes,
  };
}

function avaliar(
  ajustes: Partial<EntradaAvaliacaoPagamentoNaEntrega> = {},
): ResultadoAvaliacaoPagamentoNaEntrega {
  return avaliarElegibilidadePagamentoNaEntrega({
    contexto: "checkout",
    itens: [criarItem()],
    totalPedidoEmCentavos: 20_000,
    cepEntrega: CEP,
    configuracaoGlobalAtiva: true,
    configuracoesPorServico: [criarConfiguracao()],
    avaliadoEm: AVALIADO_EM,
    ...ajustes,
  });
}

function codigos(
  resultado: ResultadoAvaliacaoPagamentoNaEntrega,
): CodigoMotivoPagamentoNaEntrega[] {
  return resultado.motivos.map((motivo) => motivo.codigo);
}

describe("matriz de decisao do pagamento na entrega", () => {
  it("bloqueia origem Laquila com mensagem neutra e preserva pedido normal", () => {
    const bloqueado = avaliar({
      itens: [criarItem({ origemFornecedorLaquila: true })],
    });

    assert.equal(bloqueado.elegivel, false);
    assert.deepEqual(codigos(bloqueado), [
      "produto-origem-fornecedor-indisponivel",
    ]);
    assert.equal(bloqueado.motivos[0]?.mensagem.includes("Laquila"), false);
    assert.equal(avaliar().elegivel, true);
  });

  it("1. produto permite + servico permite + valor na faixa => elegivel", () => {
    const resultado = avaliar({
      configuracoesPorServico: [
        criarConfiguracao({
          valorMinimoPedidoEmCentavos: 5_000,
          valorMaximoPedidoEmCentavos: 50_000,
        }),
      ],
    });

    assert.equal(resultado.elegivel, true);
    assert.equal(resultado.decisaoParcial, false);
    assert.deepEqual(resultado.motivos, []);
    assert.deepEqual(resultado.formasPermitidas, [
      "dinheiro",
      "debito_entrega",
    ]);
    assert.equal(resultado.servico?.identificador, "entrega-propria-atual");
    // No checkout, com tudo resolvido, a decisão vale por si.
    assert.equal(resultado.exigeRevalidacao, false);
  });

  it("2. servico com pagamento desativado bloqueia", () => {
    const resultado = avaliar({
      configuracoesPorServico: [
        criarConfiguracao({ aceitaPagamentoNaEntrega: false }),
      ],
    });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), ["servico-com-pagamento-desativado"]);
  });

  it("3. produto nao habilitado (opt-in false) bloqueia com escopo de item", () => {
    const resultado = avaliar({
      itens: [criarItem({ produtoAceitaPagamentoNaEntrega: false })],
    });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), ["produto-nao-habilitado"]);
    assert.equal(resultado.motivos[0].escopo, "item");
    assert.equal(resultado.motivos[0].itemCarrinhoId, "item-1");
  });

  it("4. variante false vence produto true", () => {
    const resultado = avaliar({
      itens: [
        criarItem({
          produtoAceitaPagamentoNaEntrega: true,
          varianteAceitaPagamentoNaEntrega: false,
        }),
      ],
    });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), ["produto-nao-habilitado"]);
  });

  it("5. variante null herda o produto true", () => {
    const resultado = avaliar({
      itens: [
        criarItem({
          produtoAceitaPagamentoNaEntrega: true,
          varianteAceitaPagamentoNaEntrega: null,
        }),
      ],
    });

    assert.equal(resultado.elegivel, true);
  });

  it("6. carrinho misto: um item nao habilitado bloqueia o pedido inteiro", () => {
    const resultado = avaliar({
      itens: [
        criarItem({ itemCarrinhoId: "item-1", produtoId: "prod-1" }),
        criarItem({
          itemCarrinhoId: "item-2",
          produtoId: "prod-2",
          produtoAceitaPagamentoNaEntrega: false,
        }),
      ],
    });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), ["produto-nao-habilitado"]);
    // Aponta exatamente qual item derrubou, para a interface conseguir destacá-lo.
    assert.equal(resultado.motivos[0].itemCarrinhoId, "item-2");
    assert.equal(resultado.motivos[0].produtoId, "prod-2");
  });

  it("7. fretes divergentes entre itens bloqueiam", () => {
    const resultado = avaliar({
      itens: [
        criarItem({ itemCarrinhoId: "item-1" }),
        criarItem({
          itemCarrinhoId: "item-2",
          frete: {
            provedor: "entrega-propria",
            servico: "entrega-programada",
            cepCotado: CEP,
          },
        }),
      ],
    });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), ["carrinho-com-fretes-divergentes"]);
  });

  it("8. endereco fora da area: sem servico proprio ofertado", () => {
    // Fora da área, a cotação simplesmente não oferece entrega própria — sobra transportadora.
    const resultado = avaliar({
      itens: [
        criarItem({
          frete: {
            provedor: "frenet",
            servico: "correios-pac",
            cepCotado: CEP,
          },
        }),
      ],
    });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), ["servico-entrega-nao-suportado"]);
  });

  it("9. entrega externa (Frenet) bloqueia", () => {
    const resultado = avaliar({
      itens: [
        criarItem({
          frete: {
            provedor: "frenet",
            servico: "correios-sedex",
            cepCotado: CEP,
          },
        }),
      ],
    });

    assert.deepEqual(codigos(resultado), ["servico-entrega-nao-suportado"]);
  });

  it("10. retirada bloqueia (fora do escopo da V1)", () => {
    const resultado = avaliar({
      itens: [
        criarItem({
          frete: {
            provedor: "retirada",
            servico: "modelo-retirada-uuid",
            cepCotado: null,
          },
        }),
      ],
    });

    assert.deepEqual(codigos(resultado), ["servico-entrega-nao-suportado"]);
  });

  it("11. entrega rapida com config habilitada e elegivel", () => {
    const resultado = avaliar();

    assert.equal(resultado.elegivel, true);
    assert.equal(resultado.servico?.identificador, "entrega-propria-atual");
  });

  it("12. entrega programada tem config independente da rapida", () => {
    const resultado = avaliar({
      itens: [
        criarItem({
          frete: {
            provedor: "entrega-propria",
            servico: "entrega-programada",
            cepCotado: CEP,
          },
        }),
      ],
      configuracoesPorServico: [
        // A rápida está desligada; a programada está ligada. O motor tem que escolher
        // a configuração do serviço realmente usado no pedido.
        criarConfiguracao({ aceitaPagamentoNaEntrega: false }),
        criarConfiguracao({
          id: "cfg-2",
          servicoFreteId: "svc-uuid-2",
          servicoIdentificador: "entrega-programada",
          servicoNome: "Entrega programada",
          aceitaPixNaEntrega: true,
        }),
      ],
    });

    assert.equal(resultado.elegivel, true);
    assert.equal(resultado.servico?.identificador, "entrega-programada");
    assert.equal(resultado.regrasAplicadas?.configuracaoId, "cfg-2");
  });

  it("13. total abaixo do minimo bloqueia", () => {
    const resultado = avaliar({
      totalPedidoEmCentavos: 4_999,
      configuracoesPorServico: [
        criarConfiguracao({ valorMinimoPedidoEmCentavos: 5_000 }),
      ],
    });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), ["valor-abaixo-do-minimo"]);
  });

  it("14. total acima do maximo bloqueia", () => {
    const resultado = avaliar({
      totalPedidoEmCentavos: 50_001,
      configuracoesPorServico: [
        criarConfiguracao({ valorMaximoPedidoEmCentavos: 50_000 }),
      ],
    });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), ["valor-acima-do-maximo"]);
  });

  it("15. acima do limite de dinheiro derruba SO a forma dinheiro", () => {
    const resultado = avaliar({
      totalPedidoEmCentavos: 30_001,
      configuracoesPorServico: [
        criarConfiguracao({ valorMaximoDinheiroEmCentavos: 30_000 }),
      ],
    });

    // O pedido continua elegível — só perdeu uma das formas.
    assert.equal(resultado.elegivel, true);
    assert.deepEqual(resultado.formasPermitidas, ["debito_entrega"]);
    assert.deepEqual(codigos(resultado), ["valor-acima-do-limite-dinheiro"]);
    assert.equal(resultado.motivos[0].escopo, "forma");
    assert.equal(resultado.motivos[0].forma, "dinheiro");
  });

  it("16. so dinheiro habilitado e acima do limite dele bloqueia o pedido", () => {
    const resultado = avaliar({
      totalPedidoEmCentavos: 30_001,
      configuracoesPorServico: [
        criarConfiguracao({
          aceitaDinheiro: true,
          aceitaDebito: false,
          valorMaximoDinheiroEmCentavos: 30_000,
        }),
      ],
    });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(resultado.formasPermitidas, []);
    assert.deepEqual(codigos(resultado), [
      "valor-acima-do-limite-dinheiro",
      "nenhuma-forma-habilitada",
    ]);
  });

  it("17. modalidade diferente de stock bloqueia", () => {
    const resultado = avaliar({
      itens: [criarItem({ modalidadeComercial: "pre_sale" })],
    });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), [
      "modalidade-comercial-nao-suportada",
    ]);
  });

  it("18. PDP sem endereco nem total devolve decisao parcial com as formas", () => {
    const resultado = avaliar({
      contexto: "pdp",
      totalPedidoEmCentavos: null,
      cepEntrega: null,
      itens: [
        criarItem({
          frete: {
            provedor: "entrega-propria",
            servico: "entrega-propria-atual",
            cepCotado: null,
          },
        }),
      ],
    });

    assert.equal(resultado.decisaoParcial, true);
    assert.equal(resultado.elegivel, false);
    assert.equal(resultado.exigeRevalidacao, true);
    assert.deepEqual(codigos(resultado), ["avaliacao-parcial-sem-total"]);
    // É isto que o selo da página de produto lê.
    assert.deepEqual(resultado.formasPermitidas, [
      "dinheiro",
      "debito_entrega",
    ]);
  });

  it("19. CEP do checkout diferente do CEP da cotacao bloqueia", () => {
    const resultado = avaliar({
      cepEntrega: "09876-543",
      itens: [
        criarItem({
          frete: {
            provedor: "entrega-propria",
            servico: "entrega-propria-atual",
            cepCotado: "01234-567",
          },
        }),
      ],
    });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), ["cep-divergente-do-frete"]);
  });

  it("20. kill-switch global desligado bloqueia antes de tudo", () => {
    const resultado = avaliar({ configuracaoGlobalAtiva: false });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), ["configuracao-global-desativada"]);
    // Nem chega a olhar serviço ou formas.
    assert.equal(resultado.servico, null);
    assert.deepEqual(resultado.formasPermitidas, []);
  });
});

describe("motivos fora da matriz e garantias do contrato", () => {
  it("carrinho vazio tem motivo proprio", () => {
    const resultado = avaliar({ itens: [] });

    assert.deepEqual(codigos(resultado), ["carrinho-vazio"]);
  });

  it("item sem frete escolhido pede a escolha da entrega", () => {
    const resultado = avaliar({ itens: [criarItem({ frete: null })] });

    assert.deepEqual(codigos(resultado), ["frete-nao-escolhido"]);
  });

  it("servico sem linha de configuracao bloqueia (ausencia nunca e permissao)", () => {
    const resultado = avaliar({ configuracoesPorServico: [] });

    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), ["servico-sem-configuracao"]);
    assert.equal(resultado.regrasAplicadas, null);
  });

  it("servico de frete inativo bloqueia", () => {
    const resultado = avaliar({
      configuracoesPorServico: [criarConfiguracao({ servicoAtivo: false })],
    });

    assert.deepEqual(codigos(resultado), ["servico-inativo"]);
  });

  it("configuracao desligada pelo campo ativo bloqueia", () => {
    const resultado = avaliar({
      configuracoesPorServico: [criarConfiguracao({ ativo: false })],
    });

    assert.deepEqual(codigos(resultado), ["servico-com-pagamento-desativado"]);
  });

  it("nenhuma forma ligada na configuracao bloqueia", () => {
    const resultado = avaliar({
      configuracoesPorServico: [
        criarConfiguracao({
          aceitaDinheiro: false,
          aceitaPixNaEntrega: false,
          aceitaDebito: false,
          aceitaCredito: false,
        }),
      ],
    });

    assert.deepEqual(codigos(resultado), ["nenhuma-forma-habilitada"]);
  });

  it("checkout sem endereco cobra o endereco", () => {
    const resultado = avaliar({ contexto: "checkout", cepEntrega: null });

    assert.equal(resultado.decisaoParcial, true);
    assert.deepEqual(codigos(resultado), ["endereco-nao-informado"]);
  });

  it("carrinho sem endereco nao cobra endereco, so marca decisao parcial", () => {
    const resultado = avaliar({ contexto: "carrinho", cepEntrega: null });

    assert.equal(resultado.decisaoParcial, true);
    assert.equal(resultado.elegivel, false);
    assert.deepEqual(codigos(resultado), []);
    assert.equal(resultado.exigeRevalidacao, true);
  });

  it("modalidade ausente no produto bloqueia", () => {
    const resultado = avaliar({
      itens: [criarItem({ modalidadeComercial: null })],
    });

    assert.deepEqual(codigos(resultado), [
      "modalidade-comercial-nao-suportada",
    ]);
  });

  it("aceita ampliar as modalidades por parametro sem tocar no motor", () => {
    const resultado = avaliar({
      itens: [criarItem({ modalidadeComercial: "pre_sale" })],
      modalidadesComerciaisSuportadas: ["stock", "pre_sale"],
    });

    assert.equal(resultado.elegivel, true);
    assert.deepEqual(resultado.regrasAplicadas?.modalidadesSuportadas, [
      "stock",
      "pre_sale",
    ]);
  });

  it("CEP com e sem mascara sao tratados como o mesmo CEP", () => {
    const resultado = avaliar({
      cepEntrega: "01234-567",
      itens: [
        criarItem({
          frete: {
            provedor: "entrega-propria",
            servico: "entrega-propria-atual",
            cepCotado: "01234567",
          },
        }),
      ],
    });

    assert.equal(resultado.elegivel, true);
    assert.equal(resultado.cepAvaliado, "01234567");
  });

  it("congela as regras aplicadas para o snapshot do pedido", () => {
    const resultado = avaliar({
      configuracoesPorServico: [
        criarConfiguracao({
          valorMinimoPedidoEmCentavos: 5_000,
          valorMaximoPedidoEmCentavos: 100_000,
          valorMaximoDinheiroEmCentavos: 30_000,
          observacoesCliente: "Confira o PIX antes de liberar a mercadoria.",
        }),
      ],
    });

    assert.deepEqual(resultado.regrasAplicadas, {
      configuracaoId: "cfg-1",
      valorMinimoEmCentavos: 5_000,
      valorMaximoEmCentavos: 100_000,
      valorMaximoDinheiroEmCentavos: 30_000,
      exigeTroco: true,
      observacoesCliente: "Confira o PIX antes de liberar a mercadoria.",
      modalidadesSuportadas: ["stock"],
      configuracaoAtualizadaEm: "2026-08-04T00:00:00.000Z",
    });
    assert.equal(resultado.versao, "1");
    assert.equal(resultado.avaliadoEm, AVALIADO_EM);
    assert.equal(resultado.totalAvaliadoEmCentavos, 20_000);
  });

  it("e uma funcao pura: nao altera a entrada recebida", () => {
    const itens = [criarItem()];
    const configuracoes = [criarConfiguracao()];
    const copiaItens = structuredClone(itens);
    const copiaConfiguracoes = structuredClone(configuracoes);

    avaliar({ itens, configuracoesPorServico: configuracoes });

    assert.deepEqual(itens, copiaItens);
    assert.deepEqual(configuracoes, copiaConfiguracoes);
  });

  it("e deterministica: a mesma entrada produz sempre a mesma saida", () => {
    assert.deepEqual(avaliar(), avaliar());
  });
});
