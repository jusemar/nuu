import type { ProdutoRecebidoFornecedor } from "../../types/produto-recebido-fornecedor.types";

export type LinhaStagingExcelParaProdutoRecebido = {
  id: string;
  importacaoId: string;
  fornecedorId: string;
  codigoFornecedor: string | null;
  nomeProduto: string;
  categoriaFornecedor: string | null;
  marcaFornecedor: string | null;
  precoFornecedor: string | null;
  precoOriginal: string | null;
  precoCalculado: string | null;
  estoqueFornecedor: number | null;
  status: string;
  errosValidacao: Array<{ codigo: string; mensagem: string; campo?: string }>;
  dadosBrutos: Record<string, unknown>;
};

function normalizarChave(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function obterTexto(
  dados: Record<string, unknown>,
  aliases: readonly string[],
) {
  const aliasesNormalizados = new Set(aliases.map(normalizarChave));

  for (const [chave, valor] of Object.entries(dados)) {
    if (!aliasesNormalizados.has(normalizarChave(chave))) continue;
    if (valor === null || valor === undefined) continue;

    const texto = String(valor).trim();
    if (texto) return texto;
  }

  return null;
}

function obterImagens(dados: Record<string, unknown>) {
  const valor = obterTexto(dados, [
    "imagem",
    "imagens",
    "foto",
    "fotos",
    "url_imagem",
    "lista_fotos",
  ]);

  if (!valor) return [];

  return Array.from(
    new Set(
      valor
        .split(/[\n;,|]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

/** Converte staging Excel para o mesmo contrato consumível pelo fluxo comum. */
export function adaptarLinhaStagingExcelParaProdutoRecebido(
  linha: LinhaStagingExcelParaProdutoRecebido,
): ProdutoRecebidoFornecedor {
  const dadosBrutos = { ...linha.dadosBrutos };

  return {
    id: linha.id,
    origem: {
      tipo: "arquivo_excel",
      fornecedorId: linha.fornecedorId,
      importacaoId: linha.importacaoId,
      stagingId: linha.id,
      codigoFornecedor: linha.codigoFornecedor?.trim() || null,
    },
    nome: linha.nomeProduto.trim(),
    descricao: obterTexto(dadosBrutos, [
      "descricao",
      "descricao_produto",
      "detalhes",
    ]),
    ean: obterTexto(dadosBrutos, ["ean", "gtin", "codigo_ean", "cd_ean"]),
    ncm: obterTexto(dadosBrutos, ["ncm", "codigo_ncm"]),
    precoFornecedor: linha.precoFornecedor ?? linha.precoOriginal,
    precoCalculado: linha.precoCalculado,
    estoqueFornecedor: linha.estoqueFornecedor,
    imagens: obterImagens(dadosBrutos),
    peso: obterTexto(dadosBrutos, ["peso_bruto", "peso", "peso_kg"]),
    altura: obterTexto(dadosBrutos, ["altura_caixa", "altura"]),
    largura: obterTexto(dadosBrutos, ["largura_caixa", "largura"]),
    comprimento: obterTexto(dadosBrutos, ["comprimento_caixa", "comprimento"]),
    classificacaoOrigem: {
      categoria: linha.categoriaFornecedor,
      marca: linha.marcaFornecedor,
      macroGrupo: obterTexto(dadosBrutos, ["macro_grupo", "ds_ggrupo"]),
      grupo: obterTexto(dadosBrutos, ["grupo", "ds_grupo"]),
      subgrupo: obterTexto(dadosBrutos, ["subgrupo", "ds_sgrupo"]),
    },
    situacaoOrigem: linha.status,
    erros: linha.errosValidacao.map((erro) => ({ ...erro })),
    dadosOrigemJson: dadosBrutos,
  };
}
