import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizarModalidadePreco } from "../../constants/modalidades-preco";
import type { OperacaoAlteracaoEmMassa } from "../../schemas/alteracao-em-massa/operacoes-alteracao-em-massa.schema";
import {
  aplicarAlteracaoEmMassaSchema,
  solicitarPreviewAlteracaoEmMassaSchema,
} from "../../schemas/alteracao-em-massa/operacoes-alteracao-em-massa.schema";
import type {
  DadosAlteracaoEmMassa,
  ProdutoAlteracaoEmMassa,
} from "../../types/alteracao-em-massa.types";
import { calcularPlanoAlteracaoEmMassa } from "./calcular-preview-alteracao-em-massa";

const agora = new Date("2026-01-01T00:00:00.000Z");
const produto: ProdutoAlteracaoEmMassa = {
  id: "00000000-0000-4000-8000-000000000001",
  nome: "Produto simples",
  slug: "produto-simples",
  sku: "SKU-1",
  ativo: true,
  categoriaId: "00000000-0000-4000-8000-000000000002",
  categoriaNome: "Categoria",
  marcaId: "00000000-0000-4000-8000-000000000003",
  marcaNome: "Marca",
  secoesLoja: ["general"],
  tipoProduto: "simple",
  ncm: null,
  pesoEmGramas: 1000,
  alturaEmCm: 10,
  larguraEmCm: 20,
  comprimentoEmCm: 30,
  varianteTecnicaId: "00000000-0000-4000-8000-000000000004",
  estoqueVarianteTecnica: 5,
  varianteTecnicaAtualizadaEm: agora,
  varianteTecnicaVersaoConcorrencia: "2026-01-01 00:00:00.000000",
  precosModalidades: [
    {
      id: "00000000-0000-4000-8000-000000000005",
      modalidade: "stock",
      precoEmCentavos: 10_000,
      prazo: "Imediato",
      atualizadoEm: agora,
      versaoConcorrencia: "2026-01-01 00:00:00.000000",
    },
  ],
  classificacoesLogisticasIds: [],
  permiteRetirada: false,
  permiteEntregaPropria: false,
  modeloRetiradaId: null,
  atualizadoEm: agora,
  versaoConcorrencia: "2026-01-01 00:00:00.000000",
};

const dados: DadosAlteracaoEmMassa = {
  produtos: [produto],
  categorias: [
    {
      id: produto.categoriaId,
      nome: produto.categoriaNome,
      parentId: null,
      nivel: 0,
      ordem: 0,
      ativa: true,
    },
  ],
  marcas: [{ id: produto.marcaId, nome: produto.marcaNome, ativa: true }],
  classificacoesLogisticas: [],
  modelosRetirada: [],
};

function calcular(operacoes: OperacaoAlteracaoEmMassa[]) {
  return calcularPlanoAlteracaoEmMassa([produto], operacoes, dados)[0];
}

describe("motor de alteração em massa", () => {
  it("reconhece Estoque Próprio e calcula percentual em centavos", () => {
    assert.equal(normalizarModalidadePreco("stock"), "stock");
    const plano = calcular([
      {
        campo: "preco",
        modalidade: "stock",
        operacao: "aumentar_percentual",
        valor: 10,
      },
    ]);
    assert.equal(plano.linhas[0].atual, "R$ 100,00");
    assert.equal(plano.alteracoes.precos[0].precoEmCentavos, 11_000);
  });

  it("bloqueia preço e estoque negativos", () => {
    const plano = calcular([
      {
        campo: "preco",
        modalidade: "stock",
        operacao: "reduzir_valor",
        valor: 101,
      },
      { campo: "estoque", operacao: "reduzir", valor: 6 },
    ]);
    assert.equal(
      plano.linhas.filter((linha) => linha.resultado === "conflito").length,
      2,
    );
    assert.equal(plano.alteracoes.precos.length, 0);
    assert.equal(plano.alteracoes.estoque, undefined);
  });

  it("rejeita payload antigo de Seções da Loja antes do preview", () => {
    const resultado = solicitarPreviewAlteracaoEmMassaSchema.safeParse({
      produtosIds: [produto.id],
      operacoes: [
        {
          campo: "secoes",
          operacao: "adicionar",
          secoesIds: ["featured"],
        },
      ],
    });
    assert.equal(resultado.success, false);
    assert.equal(
      aplicarAlteracaoEmMassaSchema.safeParse({
        produtosIds: [produto.id],
        operacoes: [
          {
            campo: "secoes",
            operacao: "substituir",
            secoesIds: ["sale"],
          },
        ],
        assinaturaPreview: "a".repeat(64),
      }).success,
      false,
    );
  });

  it("mantém catálogo fechado e rejeita logística fora do escopo", () => {
    const resultado = solicitarPreviewAlteracaoEmMassaSchema.safeParse({
      produtosIds: [produto.id],
      operacoes: [
        {
          campo: "classificacoes",
          operacao: "adicionar",
          ids: [produto.id],
        },
      ],
    });
    assert.equal(resultado.success, false);
  });

  it("planeja vários campos do produto sem criar conflito entre eles", () => {
    const plano = calcular([
      { campo: "status", valor: false },
      { campo: "ncm", valor: "85171200" },
      { campo: "estoque", operacao: "aumentar", valor: 2 },
    ]);
    assert.equal(
      plano.linhas.every((linha) => linha.resultado === "alterado"),
      true,
    );
    assert.equal(plano.alteracoes.produto.ativo, false);
    assert.equal(plano.alteracoes.estoque?.quantidade, 7);
  });

  it("combina preço e prazo da mesma modalidade em uma única escrita planejada", () => {
    const plano = calcular([
      {
        campo: "preco",
        modalidade: "stock",
        operacao: "aumentar_valor",
        valor: 10,
      },
      {
        campo: "prazo",
        modalidade: "stock",
        valor: "2 dias",
      },
    ]);
    assert.equal(plano.alteracoes.precos.length, 1);
    assert.equal(plano.alteracoes.precos[0].precoEmCentavos, 11_000);
    assert.equal(plano.alteracoes.precos[0].prazo, "2 dias");
  });

  it("planeja produto pai e variante técnica na mesma aplicação", () => {
    const plano = calcular([
      { campo: "status", valor: false },
      { campo: "estoque", operacao: "definir", valor: 9 },
    ]);
    assert.equal(plano.alteracoes.produto.ativo, false);
    assert.equal(
      plano.alteracoes.estoque?.varianteId,
      produto.varianteTecnicaId,
    );
  });
});
