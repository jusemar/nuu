import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  AlvoMatrizFreteMerchant,
  ProdutoPadraoMatrizFreteMerchant,
} from "../types/matriz-frete-merchant";
import { analisarMatrizFreteMerchant } from "./analisar-matriz-frete-merchant";

const produtos: ProdutoPadraoMatrizFreteMerchant[] = [
  {
    merchantId: "entregavel",
    titulo: "Produto entregável",
    produtoId: "p1",
    varianteId: null,
    modalidadeComercial: "stock",
  },
  {
    merchantId: "bloqueado",
    titulo: "Produto bloqueado",
    produtoId: "p2",
    varianteId: "v2",
    modalidadeComercial: null,
  },
];

const alvo = (id: string, cep: string): AlvoMatrizFreteMerchant => ({
  id,
  tipo: "faixa-regiao",
  nome: id,
  amostras: [
    { cep, logradouro: "", bairro: "Centro", cidade: "Teste", uf: "MG" },
  ],
});

describe("matriz de frete Merchant", () => {
  it("distingue cobertura total/parcial e calcula máximos", async () => {
    const resultados = await analisarMatrizFreteMerchant({
      produtos,
      alvos: [alvo("total", "30000000"), alvo("parcial", "31000000")],
      concorrencia: 2,
      intervaloEntreCotacoesMs: 0,
      async cotar({ produto, endereco }) {
        if (produto.merchantId === "bloqueado" && endereco.cep === "31000000") {
          return {
            entregavel: false,
            menorCustoEmCentavos: null,
            maiorPrazoEmDiasUteis: null,
            causa: "Restrição logística",
          };
        }
        return {
          entregavel: true,
          menorCustoEmCentavos:
            produto.merchantId === "entregavel" ? 1200 : 2500,
          maiorPrazoEmDiasUteis: produto.merchantId === "entregavel" ? 3 : 7,
        };
      },
    });

    assert.equal(resultados[0]?.coberturaPadraoSeguraNaAmostra, true);
    assert.equal(resultados[0]?.quantidadeEntregavel, 2);
    assert.equal(resultados[0]?.maiorCustoMinimoEmCentavos, 2500);
    assert.equal(resultados[0]?.maiorPrazoEmDiasUteis, 7);
    assert.equal(resultados[1]?.coberturaPadraoSeguraNaAmostra, false);
    assert.equal(resultados[1]?.quantidadeNaoEntregavel, 1);
    assert.equal(resultados[1]?.impedimentos[0]?.causa, "Restrição logística");
  });

  it("não considera seguro um alvo sem CEP conhecido", async () => {
    const [resultado] = await analisarMatrizFreteMerchant({
      produtos: [produtos[0]!],
      alvos: [
        {
          id: "sem-amostra",
          tipo: "bairro-avulso",
          nome: "Sem amostra",
          amostras: [],
          motivoSemAmostra: "CEP ausente",
        },
      ],
      concorrencia: 1,
      intervaloEntreCotacoesMs: 0,
      async cotar() {
        throw new Error("não deveria cotar");
      },
    });
    assert.equal(resultado?.coberturaPadraoSeguraNaAmostra, false);
    assert.equal(resultado?.quantidadeNaoEntregavel, 1);
    assert.equal(resultado?.impedimentos[0]?.causa, "CEP ausente");
  });
});
