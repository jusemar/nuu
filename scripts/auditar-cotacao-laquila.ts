import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  fornecedorIntegracoesApiTable,
  fornecedorProdutoVinculosTable,
  productPricingTable,
  productTable,
} from "@/db/schema";
import { resolverCdTransportadorLaquila } from "@/features/fornecedores/integracoes/laquila/lib/resolver-cd-transportador-laquila";
import { cotarFreteFluxoAtual } from "@/features/logistica/lib/entradas/cotar-frete-fluxo-atual";
import { obterCepOrigemLaquila } from "@/features/logistica/lib/origens/obter-cep-origem-laquila";

import {
  encerrarComFalhaDeDestino,
  exigirBancoLocal,
} from "./lib/guarda-banco-local";

const PRODUTO_TESTE_ID = "832559b8-c125-439c-a59a-71780e8c15ab";
const CEP_DESTINO_TESTE = "30140071";

async function executar() {
  await exigirBancoLocal(["desenvolvimento"]);

  const [auditoria] = await db
    .select({
      total: sql<number>`count(distinct ${productTable.id})`,
      pesoValido: sql<number>`count(distinct ${productTable.id}) filter (where ${productTable.weight} > 0)`,
      alturaValida: sql<number>`count(distinct ${productTable.id}) filter (where ${productTable.height} > 0)`,
      larguraValida: sql<number>`count(distinct ${productTable.id}) filter (where ${productTable.width} > 0)`,
      comprimentoValido: sql<number>`count(distinct ${productTable.id}) filter (where ${productTable.length} > 0)`,
    })
    .from(fornecedorProdutoVinculosTable)
    .innerJoin(
      fornecedorIntegracoesApiTable,
      eq(
        fornecedorIntegracoesApiTable.fornecedorId,
        fornecedorProdutoVinculosTable.fornecedorId,
      ),
    )
    .innerJoin(
      productTable,
      eq(productTable.id, fornecedorProdutoVinculosTable.produtoId),
    )
    .where(
      and(
        eq(fornecedorProdutoVinculosTable.status, "ativo"),
        eq(fornecedorIntegracoesApiTable.provedor, "laquila"),
        eq(fornecedorIntegracoesApiTable.ativo, true),
        eq(productTable.isActive, true),
        eq(productTable.status, "published"),
      ),
    );

  const [produto] = await db
    .select({
      id: productTable.id,
      nome: productTable.name,
      sku: productTable.sku,
      peso: productTable.weight,
      altura: productTable.height,
      largura: productTable.width,
      comprimento: productTable.length,
      precoEmCentavos: productPricingTable.price,
    })
    .from(productTable)
    .innerJoin(
      productPricingTable,
      and(
        eq(productPricingTable.productId, productTable.id),
        eq(productPricingTable.isActive, true),
      ),
    )
    .where(eq(productTable.id, PRODUTO_TESTE_ID))
    .limit(1);

  if (
    !produto?.peso ||
    !produto.altura ||
    !produto.largura ||
    !produto.comprimento
  ) {
    throw new Error("Produto de auditoria ainda possui dimensões inválidas.");
  }

  const cepOrigem = obterCepOrigemLaquila();
  if (!cepOrigem) throw new Error("LAQUILA_CEP_ORIGEM não configurado.");
  const cotacao = await cotarFreteFluxoAtual({
    produtoAtual: {
      identificadorProduto: produto.id,
      nomeProduto: produto.nome,
      codigoSkuProduto: produto.sku,
      tipoProdutoAtual: "simple",
      pesoProdutoEmGramas: produto.peso,
      alturaProdutoEmCm: produto.altura,
      larguraProdutoEmCm: produto.largura,
      comprimentoProdutoEmCm: produto.comprimento,
    },
    quantidade: 1,
    cep: CEP_DESTINO_TESTE,
    valorDeclaradoEmCentavos: produto.precoEmCentavos,
    contextoOrigemExpedicao: {
      origemExpedicao: "fornecedor",
      fornecedorProvedor: "laquila",
      necessitaEtiquetaFornecedor: true,
    },
  });

  const opcoes = cotacao.opcoes.map((opcao) => ({
    servico: opcao.servico,
    nome: opcao.nome,
    transportadora:
      typeof opcao.metadados?.transportadora === "string"
        ? opcao.metadados.transportadora
        : null,
    valorEmCentavos: opcao.valorEmCentavos,
    prazoEmDiasUteis: opcao.prazoMaximoEmDiasUteis ?? null,
  }));
  const escolhida =
    cotacao.opcoes.find((opcao) =>
      ["pac", "sedex"].includes(opcao.servico.trim().toLowerCase()),
    ) ??
    cotacao.opcoes.find((opcao) =>
      String(opcao.metadados?.transportadora ?? "")
        .toLowerCase()
        .includes("jad"),
    );

  const resolucao = escolhida
    ? resolverCdTransportadorLaquila({
        grupo: {
          chaveGrupo: "expedicao:fornecedor:laquila",
          cepOrigem,
          origemExpedicao: "fornecedor",
          fornecedorProvedor: "laquila",
          necessitaEtiquetaFornecedor: true,
          itens: [
            {
              itemCarrinhoId: "auditoria",
              produtoId: produto.id,
              varianteId: null,
              quantidade: 1,
              valorUnitarioEmCentavos: produto.precoEmCentavos,
            },
          ],
          entrega: {
            identificadorOpcao: escolhida.identificador,
            tipo: "entrega",
            provedor: escolhida.provedor,
            servicoId: escolhida.servico,
            servicoNome: escolhida.nome,
            transportadora:
              String(escolhida.metadados?.transportadora ?? "") || null,
            valorEmCentavos: escolhida.valorEmCentavos,
            prazo: escolhida.descricao ?? null,
            metadadosRelevantes: escolhida.metadados ?? null,
          },
        },
        // Códigos já confirmados no catálogo 00015 e exigidos pelo resolver.
        transportadoras00015: [
          { codigo: "17499", cnpj: null, descricao: "CORREIOS" },
          { codigo: "63993", cnpj: null, descricao: "JADLOG" },
        ],
        cepOrigemLaquilaEsperado: cepOrigem,
        contexto: {
          contextoPedido: "loja_propria",
          operacaoColeta: { tipo: "transportadora" },
        },
      })
    : null;

  console.log(
    JSON.stringify(
      {
        auditoria,
        produto,
        cepOrigem,
        cepDestinoMascarado: `${CEP_DESTINO_TESTE.slice(0, 3)}***${CEP_DESTINO_TESTE.slice(-2)}`,
        cotacaoSucesso: cotacao.sucesso,
        opcoes,
        escolhida: escolhida
          ? opcoes.find((opcao) => opcao.servico === escolhida.servico)
          : null,
        resolucaoCdTransportador: resolucao,
        erros: cotacao.sucesso ? [] : cotacao.erros,
      },
      null,
      2,
    ),
  );
}

executar().catch(encerrarComFalhaDeDestino);
