import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calcularPrecosProduto } from "./calcular-precos-produto";
import type {
  ConfiguracaoPagamentoCalculavel,
  EntradaPrecificacaoProduto,
  PromocaoPrecificacaoProduto,
} from "../../types/precificacao.types";

const configuracaoTeste: ConfiguracaoPagamentoCalculavel = {
  pixAtivo: true,
  cartaoAtivo: true,
  boletoAtivo: false,
  percentualAcrescimoCartaoBps: 1000,
  parcelasSemJuros: 1,
  taxaJurosMensalBps: 0,
  maximoParcelas: 1,
  valorMinimoParcelaEmCentavos: 100,
};

function criarPromocaoPrecificacao(
  entrada: EntradaPrecificacaoProduto,
  sobrescritas: Partial<PromocaoPrecificacaoProduto> = {},
): PromocaoPrecificacaoProduto {
  return {
    ativa: false,
    precoOriginalEmCentavos: entrada.precoBaseEmCentavos,
    precoFinalEmCentavos: entrada.precoBaseEmCentavos,
    descontoAplicadoEmCentavos: 0,
    regraAplicadaId: null,
    tipoDesconto: null,
    valorDesconto: 0,
    ...sobrescritas,
  };
}

describe("calcularPrecosProduto", () => {
  it("mantem preco original quando nao ha promocao", async () => {
    const entrada: EntradaPrecificacaoProduto = {
      produtoId: "produto-sem-promocao",
      modalidade: "stock",
      precoBaseEmCentavos: 10000,
    };
    const resultado = await calcularPrecosProduto([entrada], {
      buscarConfiguracao: async () => configuracaoTeste,
      aplicarPromocoes: async (entradas) =>
        entradas.map((entradaAtual) => ({
          entrada: entradaAtual,
          promocao: criarPromocaoPrecificacao(entradaAtual),
        })),
    });

    assert.equal(resultado.stock?.pix.valorEmCentavos, 10000);
    assert.equal(resultado.stock?.cartao.valorEmCentavos, 11000);
    assert.equal(resultado.stock?.promocao.ativa, false);
  });

  it("aplica promocao antes das modalidades de pagamento", async () => {
    const entrada: EntradaPrecificacaoProduto = {
      produtoId: "produto-com-promocao",
      modalidade: "stock",
      precoBaseEmCentavos: 10000,
    };
    const resultado = await calcularPrecosProduto([entrada], {
      buscarConfiguracao: async () => configuracaoTeste,
      aplicarPromocoes: async (entradas) =>
        entradas.map((entradaAtual) => ({
          entrada: entradaAtual,
          promocao: criarPromocaoPrecificacao(entradaAtual, {
            ativa: true,
            precoFinalEmCentavos: 8000,
            descontoAplicadoEmCentavos: 2000,
            regraAplicadaId: "regra-promocao",
            tipoDesconto: "percentual",
            valorDesconto: 20,
          }),
        })),
    });

    assert.equal(resultado.stock?.precoOriginalEmCentavos, 10000);
    assert.equal(resultado.stock?.precoFinalEmCentavos, 8000);
    assert.equal(resultado.stock?.pix.valorEmCentavos, 8000);
    assert.equal(resultado.stock?.cartao.valorEmCentavos, 8800);
    assert.equal(resultado.stock?.promocao.regraAplicadaId, "regra-promocao");
    assert.ok(resultado.stock?.regrasAplicadas.includes("promotion_engine"));
  });

  it("processa multiplas entradas em uma unica chamada de promocoes", async () => {
    let chamadasPromocoes = 0;
    const entradas: EntradaPrecificacaoProduto[] = [
      {
        produtoId: "produto-1",
        modalidade: "stock",
        precoBaseEmCentavos: 10000,
      },
      {
        produtoId: "produto-2",
        modalidade: "pre_sale",
        precoBaseEmCentavos: 5000,
      },
    ];
    const resultado = await calcularPrecosProduto(entradas, {
      buscarConfiguracao: async () => configuracaoTeste,
      aplicarPromocoes: async (entradasAtuais) => {
        chamadasPromocoes += 1;

        return entradasAtuais.map((entradaAtual) => ({
          entrada: entradaAtual,
          promocao: criarPromocaoPrecificacao(entradaAtual, {
            ativa: entradaAtual.produtoId === "produto-2",
            precoFinalEmCentavos:
              entradaAtual.produtoId === "produto-2"
                ? 4000
                : entradaAtual.precoBaseEmCentavos,
            descontoAplicadoEmCentavos:
              entradaAtual.produtoId === "produto-2" ? 1000 : 0,
            regraAplicadaId:
              entradaAtual.produtoId === "produto-2" ? "regra-2" : null,
            tipoDesconto:
              entradaAtual.produtoId === "produto-2" ? "valor_fixo" : null,
            valorDesconto: entradaAtual.produtoId === "produto-2" ? 1000 : 0,
          }),
        }));
      },
    });

    assert.equal(chamadasPromocoes, 1);
    assert.equal(resultado.stock?.pix.valorEmCentavos, 10000);
    assert.equal(resultado.pre_sale?.pix.valorEmCentavos, 4000);
  });

  it("retorna objeto vazio sem consultar promocoes quando nao ha entradas", async () => {
    let chamadasPromocoes = 0;
    let chamadasConfiguracao = 0;
    const resultado = await calcularPrecosProduto([], {
      buscarConfiguracao: async () => {
        chamadasConfiguracao += 1;
        return configuracaoTeste;
      },
      aplicarPromocoes: async () => {
        chamadasPromocoes += 1;
        return [];
      },
    });

    assert.deepEqual(resultado, {});
    assert.equal(chamadasConfiguracao, 0);
    assert.equal(chamadasPromocoes, 0);
  });

  it("usa fallback com preco original se promotion engine falhar", async () => {
    const erroOriginal = console.error;
    console.error = () => {};

    try {
      const entrada: EntradaPrecificacaoProduto = {
        produtoId: "produto-fallback",
        modalidade: "stock",
        precoBaseEmCentavos: 10000,
      };
      const resultado = await calcularPrecosProduto([entrada], {
        buscarConfiguracao: async () => configuracaoTeste,
        aplicarPromocoes: async () => {
          throw new Error("falha promocional");
        },
      });

      assert.equal(resultado.stock?.pix.valorEmCentavos, 10000);
      assert.equal(resultado.stock?.promocao.ativa, false);
      assert.equal(
        resultado.stock?.regrasAplicadas.includes("promotion_engine"),
        false,
      );
    } finally {
      console.error = erroOriginal;
    }
  });
});
