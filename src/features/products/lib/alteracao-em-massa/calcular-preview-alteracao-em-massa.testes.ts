import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
import {
  calcularPlanoAlteracaoEmMassa,
  calcularPreviewAlteracaoEmMassa,
} from "./calcular-preview-alteracao-em-massa";

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
  precosEntregaPropria: [
    {
      id: 10,
      tipoDestino: "region",
      destino: "Região · regra #10",
      precoEmCentavos: 2_500,
      prazoEntregaRapida: "Hoje",
      ativo: true,
      entregaProgramadaAtiva: false,
      prazoMinimoProgramadaDias: 2,
      precoProgramadaEmCentavos: 1_500,
      atualizadoEm: agora,
      versaoConcorrencia: "2026-01-01 00:00:00.000000",
    },
    {
      id: 11,
      tipoDestino: "cep-especifico",
      destino: "CEP · regra #11",
      precoEmCentavos: 3_000,
      prazoEntregaRapida: null,
      ativo: true,
      entregaProgramadaAtiva: true,
      prazoMinimoProgramadaDias: 4,
      precoProgramadaEmCentavos: 2_000,
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

const modalidadesTeste = [
  "stock",
  "preSale",
  "dropshipping",
  "orderBasis",
] as const;

function produtoComModalidades(quantidade: number) {
  return {
    ...produto,
    precosModalidades: modalidadesTeste
      .slice(0, quantidade)
      .map((modalidade, indice) => ({
        ...produto.precosModalidades[0],
        id: `00000000-0000-4000-8000-00000000001${indice}`,
        modalidade,
        precoEmCentavos: 10_000 + indice * 2_000,
        prazo: `${indice + 1} dia(s)`,
      })),
  } satisfies ProdutoAlteracaoEmMassa;
}

function operacaoPreco(
  operacao:
    | "definir"
    | "aumentar_valor"
    | "reduzir_valor"
    | "aumentar_percentual"
    | "reduzir_percentual",
  valor: number,
): OperacaoAlteracaoEmMassa {
  return {
    campo: "preco",
    escopo: "todas_modalidades_com_preco",
    operacao,
    valor,
  };
}

describe("motor de alteração em massa", () => {
  it("aceita valor programado zero e exige seleção explícita de campo", () => {
    assert.equal(
      solicitarPreviewAlteracaoEmMassaSchema.safeParse({
        produtosIds: [produto.id],
        operacoes: [
          {
            campo: "entrega_programada",
            ativa: true,
            prazoMinimoDias: 3,
            valor: 0,
          },
        ],
      }).success,
      true,
    );
    assert.equal(
      solicitarPreviewAlteracaoEmMassaSchema.safeParse({
        produtosIds: [produto.id],
        operacoes: [{ campo: "entrega_programada" }],
      }).success,
      false,
    );
  });

  it("altera somente os campos marcados da entrega programada em todos os destinos existentes", () => {
    const plano = calcular([
      {
        campo: "entrega_programada",
        ativa: true,
        prazoMinimoDias: 3,
        valor: 0,
      },
    ]);

    assert.equal(plano.alteracoes.entregaPropria.length, 2);
    assert.deepEqual(plano.alteracoes.entregaPropria[0], {
      precoEntregaId: 10,
      entregaProgramadaAtiva: true,
      prazoMinimoProgramadaDias: 3,
      precoProgramadaEmCentavos: 0,
    });
    assert.equal(
      plano.linhas.some(
        (linha) =>
          linha.campo.includes("Valor") && linha.novo === "R$ 0,00",
      ),
      true,
    );
  });

  it("altera somente o prazo programado e preserva status e valores atuais", () => {
    const plano = calcular([
      { campo: "entrega_programada", prazoMinimoDias: 3 },
    ]);

    assert.deepEqual(plano.alteracoes.entregaPropria[0], {
      precoEntregaId: 10,
      prazoMinimoProgramadaDias: 3,
    });
    assert.equal(
      plano.alteracoes.entregaPropria.every(
        (alteracao) =>
          alteracao.entregaProgramadaAtiva === undefined &&
          alteracao.precoProgramadaEmCentavos === undefined,
      ),
      true,
    );
  });

  it("desativa a programada sem alterar a entrega rápida", () => {
    const plano = calcular([
      { campo: "entrega_programada", ativa: false },
    ]);

    assert.equal(plano.alteracoes.entregaPropria.length, 1);
    assert.equal(
      plano.alteracoes.entregaPropria[0].entregaProgramadaAtiva,
      false,
    );
    assert.equal(plano.alteracoes.entregaPropria[0].ativo, undefined);
    assert.equal(
      plano.alteracoes.entregaPropria[0].precoEmCentavos,
      undefined,
    );
  });

  it("altera status e preço rápido sem tocar agenda, prazo ou programada", () => {
    const plano = calcular([
      { campo: "entrega_rapida", ativo: false, preco: 25 },
    ]);

    assert.equal(plano.alteracoes.entregaPropria.length, 2);
    assert.deepEqual(plano.alteracoes.entregaPropria[0], {
      precoEntregaId: 10,
      ativo: false,
    });
    assert.deepEqual(plano.alteracoes.entregaPropria[1], {
      precoEntregaId: 11,
      ativo: false,
      precoEmCentavos: 2_500,
    });
    assert.equal(
      plano.alteracoes.entregaPropria.every(
        (alteracao) =>
          alteracao.entregaProgramadaAtiva === undefined &&
          alteracao.prazoMinimoProgramadaDias === undefined,
      ),
      true,
    );
  });

  it("não cria cobertura quando o produto não possui destino", () => {
    const semDestino = { ...produto, precosEntregaPropria: [] };
    const plano = calcularPlanoAlteracaoEmMassa(
      [semDestino],
      [{ campo: "entrega_programada", ativa: true }],
      { ...dados, produtos: [semDestino] },
    )[0];

    assert.equal(plano.linhas[0].resultado, "conflito");
    assert.deepEqual(plano.alteracoes.entregaPropria, []);
  });

  it("reconhece Estoque Próprio e calcula percentual em centavos", () => {
    assert.equal(normalizarModalidadePreco("stock"), "stock");
    const plano = calcular([
      {
        campo: "preco",
        escopo: "todas_modalidades_com_preco",
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
        escopo: "todas_modalidades_com_preco",
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

  it("preserva a causa específica quando a variante técnica é inconsistente", () => {
    const plano = calcularPlanoAlteracaoEmMassa(
      [
        {
          ...produto,
          varianteTecnicaId: null,
          estoqueVarianteTecnica: null,
          conflitoVarianteTecnica:
            "Produto simples possui 2 registros internos; deveria possuir exatamente um.",
        },
      ],
      [{ campo: "estoque", operacao: "definir", valor: 8 }],
      dados,
    )[0];

    assert.equal(plano.linhas[0].resultado, "conflito");
    assert.match(plano.linhas[0].motivo ?? "", /2 registros internos/);
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
        escopo: "todas_modalidades_com_preco",
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

  it("altera somente o prazo e preserva o preço da modalidade", () => {
    const plano = calcular([
      {
        campo: "prazo",
        modalidade: "stock",
        valor: "2-3 dias úteis",
      },
    ]);

    assert.equal(plano.linhas.length, 1);
    assert.equal(plano.linhas[0].campo, "Prazo · Estoque Próprio");
    assert.equal(plano.linhas[0].resultado, "alterado");
    assert.equal(plano.alteracoes.precos.length, 1);
    assert.equal(plano.alteracoes.precos[0].precoEmCentavos, undefined);
    assert.equal(plano.alteracoes.precos[0].prazo, "2-3 dias úteis");
  });

  it("altera somente o preço sem planejar alteração de prazo", () => {
    const plano = calcular([
      {
        campo: "preco",
        escopo: "todas_modalidades_com_preco",
        operacao: "definir",
        valor: 120,
      },
    ]);

    assert.equal(plano.alteracoes.precos[0].precoEmCentavos, 12_000);
    assert.equal(plano.alteracoes.precos[0].prazo, undefined);
  });

  it("mantém conflito de prazo somente no produto sem modalidade real", () => {
    const semModalidade: ProdutoAlteracaoEmMassa = {
      ...produto,
      id: "00000000-0000-4000-8000-000000000099",
      precosModalidades: [],
    };
    const planos = calcularPlanoAlteracaoEmMassa(
      [produto, semModalidade],
      [{ campo: "prazo", modalidade: "stock", valor: "2 dias" }],
      { ...dados, produtos: [produto, semModalidade] },
    );

    assert.equal(planos[0].linhas[0].resultado, "alterado");
    assert.equal(planos[1].linhas[0].resultado, "conflito");
    assert.equal(planos[1].alteracoes.precos.length, 0);
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

  it("mapeia todos os campos suportados para as fontes oficiais", () => {
    const novaCategoria = {
      id: "00000000-0000-4000-8000-000000000006",
      nome: "Nova categoria",
      parentId: null,
      nivel: 0,
      ordem: 1,
      ativa: true,
    };
    const novaMarca = {
      id: "00000000-0000-4000-8000-000000000007",
      nome: "Nova marca",
      ativa: true,
    };
    const plano = calcularPlanoAlteracaoEmMassa(
      [produto],
      [
        { campo: "status", valor: false },
        { campo: "categoria", categoriaId: novaCategoria.id },
        { campo: "marca", marcaId: novaMarca.id },
        {
          campo: "preco",
          escopo: "todas_modalidades_com_preco",
          operacao: "definir",
          valor: 125,
        },
        { campo: "prazo", modalidade: "stock", valor: "3 dias" },
        { campo: "estoque", operacao: "definir", valor: 8 },
        { campo: "ncm", valor: "12345678" },
        { campo: "peso", operacao: "definir", valor: 2.5 },
        { campo: "altura", operacao: "definir", valor: 11 },
        { campo: "largura", operacao: "definir", valor: 21 },
        { campo: "comprimento", operacao: "definir", valor: 31 },
      ],
      {
        ...dados,
        categorias: [...dados.categorias, novaCategoria],
        marcas: [...dados.marcas, novaMarca],
      },
    )[0];

    assert.deepEqual(plano.alteracoes.produto, {
      ativo: false,
      categoriaId: novaCategoria.id,
      marcaId: novaMarca.id,
      marcaNome: novaMarca.nome,
      ncm: "1234.56.78",
      pesoEmGramas: 2500,
      alturaEmCm: 11,
      larguraEmCm: 21,
      comprimentoEmCm: 31,
    });
    assert.deepEqual(plano.alteracoes.precos, [
      {
        precoId: produto.precosModalidades[0].id,
        modalidade: "stock",
        precoEmCentavos: 12_500,
        prazo: "3 dias",
      },
    ]);
    assert.deepEqual(plano.alteracoes.estoque, {
      varianteId: produto.varianteTecnicaId,
      quantidade: 8,
    });
  });

  it("altera uma, duas e quatro modalidades já existentes", () => {
    for (const quantidade of [1, 2, 4]) {
      const item = produtoComModalidades(quantidade);
      const plano = calcularPlanoAlteracaoEmMassa(
        [item],
        [operacaoPreco("aumentar_percentual", 10)],
        { ...dados, produtos: [item] },
      )[0];
      assert.equal(plano.alteracoes.precos.length, quantidade);
      assert.equal(
        plano.linhas.filter((linha) => linha.campo.startsWith("Preço ·"))
          .length,
        quantidade,
      );
    }
  });

  it("aplica todas as operações de preço a todas as modalidades", () => {
    const item = produtoComModalidades(2);
    const casos = [
      ["definir", 150, [15_000, 15_000]],
      ["aumentar_valor", 10, [11_000, 13_000]],
      ["reduzir_valor", 10, [9_000, 11_000]],
      ["aumentar_percentual", 10, [11_000, 13_200]],
      ["reduzir_percentual", 10, [9_000, 10_800]],
    ] as const;

    casos.forEach(([operacao, valor, esperados]) => {
      const plano = calcularPlanoAlteracaoEmMassa(
        [item],
        [operacaoPreco(operacao, valor)],
        { ...dados, produtos: [item] },
      )[0];
      assert.deepEqual(
        plano.alteracoes.precos.map((preco) => preco.precoEmCentavos),
        esperados,
      );
    });
  });

  it("não cria modalidades ausentes e preserva prazos sem operação explícita", () => {
    const item = produtoComModalidades(2);
    const plano = calcularPlanoAlteracaoEmMassa(
      [item],
      [operacaoPreco("definir", 150)],
      { ...dados, produtos: [item] },
    )[0];
    assert.equal(plano.alteracoes.precos.length, 2);
    assert.deepEqual(
      plano.alteracoes.precos.map((preco) => preco.modalidade),
      ["stock", "preSale"],
    );
    assert.equal(
      plano.alteracoes.precos.every((preco) => preco.prazo === undefined),
      true,
    );
  });

  it("continua ignorando produtos com variantes", () => {
    const variavel: ProdutoAlteracaoEmMassa = {
      ...produtoComModalidades(4),
      tipoProduto: "variable",
    };
    const plano = calcularPlanoAlteracaoEmMassa(
      [variavel],
      [operacaoPreco("definir", 150)],
      { ...dados, produtos: [variavel] },
    )[0];
    assert.equal(plano.linhas[0].resultado, "ignorado");
    assert.equal(plano.alteracoes.precos.length, 0);
  });

  it("mantém preview client-side e plano autoritativo equivalentes", () => {
    const item = produtoComModalidades(4);
    const operacoes = [operacaoPreco("aumentar_percentual", 10)];
    const dadosTeste = { ...dados, produtos: [item] };
    const linhasServidor = calcularPlanoAlteracaoEmMassa(
      [item],
      operacoes,
      dadosTeste,
    ).flatMap((plano) => plano.linhas);
    assert.deepEqual(
      calcularPreviewAlteracaoEmMassa([item], operacoes, dadosTeste),
      linhasServidor,
    );
  });

  it("preserva promoções e atualiza modalidades do produto na mesma transação", () => {
    const fonte = readFileSync(
      new URL("../../actions/aplicar-alteracao-em-massa.ts", import.meta.url),
      "utf8",
    );
    assert.match(fonte, /dbTransacional\.transaction/);
    assert.match(fonte, /for \(const preco of plano\.alteracoes\.precos\)/);
    assert.doesNotMatch(fonte, /promoPrice|promo_price_in_cents|hasPromo/);
  });

  it("atualiza regras de entrega existentes na transação sem inserir ou excluir cobertura", () => {
    const fonte = readFileSync(
      new URL("../../actions/aplicar-alteracao-em-massa.ts", import.meta.url),
      "utf8",
    );
    assert.match(
      fonte,
      /for \(const entrega of plano\.alteracoes\.entregaPropria\)/,
    );
    assert.match(fonte, /\.update\(productOwnDeliveryPrices\)/);
    assert.match(
      fonte,
      /eq\(\s*productOwnDeliveryPrices\.productId,\s*plano\.produto\.id/,
    );
    assert.doesNotMatch(fonte, /\.insert\(productOwnDeliveryPrices\)/);
    assert.doesNotMatch(fonte, /\.delete\(productOwnDeliveryPrices\)/);
  });
});
