import type { ItemProdutoLaquilaApi } from "./cliente-laquila";

export type ProdutoLaquilaNormalizado = {
  codigoFornecedor: string;
  nomeProduto: string;
  ean: string | null;
  ncm: string | null;
  marcaFornecedor: string | null;
  grupoFornecedor: string | null;
  subgrupoFornecedor: string | null;
  precoFornecedor: string | null;
  estoqueFornecedor: number | null;
  imagemUrl: string | null;
  unidade: string | null;
  pesoBruto: string | null;
  pesoLiquido: string | null;
  largura: string | null;
  altura: string | null;
  comprimento: string | null;
  dadosBrutosJson: ItemProdutoLaquilaApi;
};

function lerTexto(
  item: ItemProdutoLaquilaApi,
  chaves: string[],
): string | null {
  for (const chave of chaves) {
    const valor = item[chave];

    if (typeof valor === "string" && valor.trim()) {
      return valor.trim();
    }

    if (typeof valor === "number") {
      return String(valor);
    }
  }

  return null;
}

function normalizarDecimal(valor: string | null) {
  if (!valor) return null;

  const normalizado = valor.replace(/\./g, "").replace(",", ".").trim();
  const numero = Number(normalizado);

  if (!Number.isFinite(numero)) return null;

  return normalizado;
}

function normalizarInteiro(valor: string | null) {
  if (!valor) return null;

  const numero = Number(valor.replace(/\./g, "").replace(",", ".").trim());

  if (!Number.isFinite(numero)) return null;

  return Math.trunc(numero);
}

export function normalizarProdutoLaquila(
  item: ItemProdutoLaquilaApi,
): ProdutoLaquilaNormalizado | null {
  const codigoFornecedor = lerTexto(item, ["cd_item"]);
  const nomeProduto = lerTexto(item, ["descricao", "ds_item"]);

  if (!codigoFornecedor || !nomeProduto) {
    return null;
  }

  return {
    codigoFornecedor,
    nomeProduto,
    ean: lerTexto(item, ["cd_ean", "ean"]),
    ncm: lerTexto(item, ["NCM", "ncm"]),
    marcaFornecedor: lerTexto(item, ["ds_marca", "marca"]),
    grupoFornecedor: lerTexto(item, ["ds_grupo", "grupo", "ds_ggrupo"]),
    subgrupoFornecedor: lerTexto(item, ["ds_sgrupo", "subgrupo"]),
    precoFornecedor: normalizarDecimal(
      lerTexto(item, ["vl_preco", "preco", "preco_venda", "valor"]),
    ),
    estoqueFornecedor: normalizarInteiro(
      lerTexto(item, ["saldo", "estoque", "qt_saldo", "quantidade"]),
    ),
    imagemUrl: lerTexto(item, ["imagem", "imagem_url", "url_imagem", "foto"]),
    unidade: lerTexto(item, ["unidade"]),
    pesoBruto: normalizarDecimal(lerTexto(item, ["peso_bruto"])),
    pesoLiquido: normalizarDecimal(lerTexto(item, ["peso_liquido"])),
    largura: normalizarDecimal(lerTexto(item, ["largura_caixa", "largura"])),
    altura: normalizarDecimal(lerTexto(item, ["altura_caixa", "altura"])),
    comprimento: normalizarDecimal(
      lerTexto(item, ["comprimento", "comprimento_caixa", "complemento_caixa"]),
    ),
    dadosBrutosJson: item,
  };
}

export function normalizarProdutosLaquila(itens: ItemProdutoLaquilaApi[]) {
  return itens.flatMap((item) => {
    const produto = normalizarProdutoLaquila(item);

    return produto ? [produto] : [];
  });
}
