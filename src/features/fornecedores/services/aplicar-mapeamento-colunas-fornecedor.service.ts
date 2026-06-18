import { and, eq } from "drizzle-orm";

import {
  fornecedorMapeamentosColunasTable,
  fornecedorProdutosStagingTable,
  importacoesFornecedorTable,
} from "@/db/schema";
import { db } from "@/db/connection";
import { dbTransacional } from "@/db/transaction";

import { aplicarMapeamentoImportacaoFornecedorSchema } from "../schemas/fornecedores.schema";
import type {
  CampoMapeamentoColunaFornecedor,
  ColunaPlanilhaFornecedor,
  EntradaAplicarMapeamentoImportacaoFornecedor,
  LinhaPlanilhaFornecedor,
  MapeamentoColunaFornecedor,
} from "../types/fornecedores.types";
import { analisarProdutosImportadosFornecedor } from "./analise-produtos-importados.service";
import {
  aliasesColunasFornecedor,
  detectarMapeamentoColunasFornecedor,
  normalizarCabecalhoFornecedor,
} from "./parser-planilha-fornecedor.service";
import { prepararLinhaStagingFornecedor } from "./validacao-linha-importacao.service";
import { salvarMapeamentoColunasFornecedor } from "./salvar-mapeamento-colunas-fornecedor.service";

type DadosBrutos = Record<string, string | number | boolean | Date | null>;

function valorTexto(dados: DadosBrutos, nomeColuna?: string | null) {
  if (!nomeColuna) return null;
  const valor = dados[nomeColuna];
  const texto = String(valor ?? "").trim();
  return texto.length > 0 ? texto : null;
}

function resolverColunasPorCampo(
  colunas: ColunaPlanilhaFornecedor[],
  mapeamentos: MapeamentoColunaFornecedor[],
) {
  const destinoPorCampo = new Map<CampoMapeamentoColunaFornecedor, string>();

  mapeamentos.forEach((mapeamento) => {
    const nomeNormalizado = normalizarCabecalhoFornecedor(
      mapeamento.nomeColunaOrigem,
    );
    const coluna = colunas.find(
      (item) => item.nomeNormalizado === nomeNormalizado,
    );

    if (coluna) {
      destinoPorCampo.set(mapeamento.campoDestino, coluna.nomeOriginal);
    }
  });

  colunas.forEach((coluna) => {
    Object.entries(aliasesColunasFornecedor).forEach(([campo, aliases]) => {
      const campoDestino = campo as CampoMapeamentoColunaFornecedor;

      if (
        !destinoPorCampo.has(campoDestino) &&
        aliases.includes(coluna.nomeNormalizado)
      ) {
        destinoPorCampo.set(campoDestino, coluna.nomeOriginal);
      }
    });
  });

  return destinoPorCampo;
}

function montarLinhaPlanilha(
  numeroLinha: number,
  dadosBrutos: DadosBrutos,
  colunasPorCampo: Map<CampoMapeamentoColunaFornecedor, string>,
): LinhaPlanilhaFornecedor {
  return {
    numeroLinha,
    codigoFornecedor: valorTexto(
      dadosBrutos,
      colunasPorCampo.get("codigo_fornecedor"),
    ),
    nomeProduto:
      valorTexto(dadosBrutos, colunasPorCampo.get("nome_produto")) ?? "",
    categoriaFornecedor: valorTexto(
      dadosBrutos,
      colunasPorCampo.get("categoria_fornecedor"),
    ),
    marcaFornecedor: valorTexto(
      dadosBrutos,
      colunasPorCampo.get("marca_fornecedor"),
    ),
    precoFornecedorOriginal: valorTexto(
      dadosBrutos,
      colunasPorCampo.get("preco_fornecedor"),
    ),
    estoqueFornecedorOriginal: valorTexto(
      dadosBrutos,
      colunasPorCampo.get("estoque_fornecedor"),
    ),
    linhaVazia: Object.values(dadosBrutos).every(
      (valor) => String(valor ?? "").trim().length === 0,
    ),
    dadosBrutos,
  };
}

async function buscarMapeamentosSalvosFornecedor(fornecedorId: string) {
  return db
    .select({
      nomeColunaOrigem: fornecedorMapeamentosColunasTable.nomeColunaOrigem,
      campoDestino: fornecedorMapeamentosColunasTable.campoDestino,
    })
    .from(fornecedorMapeamentosColunasTable)
    .where(
      and(
        eq(fornecedorMapeamentosColunasTable.fornecedorId, fornecedorId),
        eq(fornecedorMapeamentosColunasTable.ativo, true),
      ),
    );
}

export async function aplicarMapeamentoColunasFornecedor(
  entrada: EntradaAplicarMapeamentoImportacaoFornecedor,
) {
  const dados = aplicarMapeamentoImportacaoFornecedorSchema.parse(entrada);

  const [importacao] = await db
    .select({
      id: importacoesFornecedorTable.id,
      fornecedorId: importacoesFornecedorTable.fornecedorId,
      colunasPlanilha: importacoesFornecedorTable.colunasPlanilha,
    })
    .from(importacoesFornecedorTable)
    .where(eq(importacoesFornecedorTable.id, dados.importacaoId))
    .limit(1);

  if (!importacao) {
    throw new Error("Importação de fornecedor não encontrada.");
  }

  const mapeamentosConfirmados = dados.mapeamentos;
  const mapeamentosSalvos =
    mapeamentosConfirmados.length > 0
      ? []
      : await buscarMapeamentosSalvosFornecedor(importacao.fornecedorId);
  const mapeamentosAplicados =
    mapeamentosConfirmados.length > 0
      ? mapeamentosConfirmados
      : mapeamentosSalvos;

  if (dados.salvarParaFornecedor) {
    await salvarMapeamentoColunasFornecedor({
      fornecedorId: importacao.fornecedorId,
      mapeamentos: mapeamentosConfirmados,
    });
  }

  const linhasAtuais = await db
    .select({
      id: fornecedorProdutosStagingTable.id,
      dadosBrutos: fornecedorProdutosStagingTable.dadosBrutos,
    })
    .from(fornecedorProdutosStagingTable)
    .where(eq(fornecedorProdutosStagingTable.importacaoId, dados.importacaoId));

  const colunasPorCampo = resolverColunasPorCampo(
    importacao.colunasPlanilha,
    mapeamentosAplicados,
  );
  const mapeamentoColunas = detectarMapeamentoColunasFornecedor(
    importacao.colunasPlanilha,
    mapeamentosSalvos,
    mapeamentosConfirmados,
  );
  const agora = new Date();
  const linhasPreparadas = linhasAtuais.map((linha, indice) => ({
    id: linha.id,
    dados: prepararLinhaStagingFornecedor(
      montarLinhaPlanilha(
        indice + 2,
        linha.dadosBrutos as DadosBrutos,
        colunasPorCampo,
      ),
    ),
  }));
  const totalErros = linhasPreparadas.filter(
    (linha) => linha.dados.status === "erro",
  ).length;

  await dbTransacional.transaction(async (tx) => {
    for (const linha of linhasPreparadas) {
      await tx
        .update(fornecedorProdutosStagingTable)
        .set({
          codigoFornecedor: linha.dados.codigoFornecedor,
          nomeProduto: linha.dados.nomeProduto,
          categoriaFornecedor: linha.dados.categoriaFornecedor,
          marcaFornecedor: linha.dados.marcaFornecedor,
          precoFornecedor: linha.dados.precoFornecedor,
          precoOriginal: linha.dados.precoFornecedor,
          estoqueFornecedor: linha.dados.estoqueFornecedor,
          produtoLocalizadoId: null,
          criterioLocalizacao: null,
          errosValidacao: linha.dados.errosValidacao,
          status: linha.dados.status,
          atualizadoEm: agora,
        })
        .where(eq(fornecedorProdutosStagingTable.id, linha.id));
    }

    await tx
      .update(importacoesFornecedorTable)
      .set({
        mapeamentoColunas,
        totalProcessadas: linhasPreparadas.length - totalErros,
        totalErros,
        atualizadoEm: agora,
      })
      .where(eq(importacoesFornecedorTable.id, dados.importacaoId));
  });

  await analisarProdutosImportadosFornecedor(dados.importacaoId);

  return {
    importacaoId: dados.importacaoId,
    totalProcessados: linhasPreparadas.length,
    totalErros,
  };
}
