import * as XLSX from "xlsx";

import type {
  LinhaPlanilhaFornecedor,
  ResultadoParserFornecedor,
} from "../types/fornecedores.types";

type LinhaBruta = Array<string | number | boolean | Date | null | undefined>;

const aliasesColunas = {
  codigoFornecedor: ["codigo_fornecedor", "codigo fornecedor", "codigo", "sku"],
  nomeProduto: ["nome_produto", "nome produto", "produto", "nome"],
  categoriaFornecedor: [
    "categoria_fornecedor",
    "categoria fornecedor",
    "categoria",
  ],
  precoFornecedor: ["preco_fornecedor", "preco fornecedor", "preco", "valor"],
  estoqueFornecedor: [
    "estoque_fornecedor",
    "estoque fornecedor",
    "estoque",
    "quantidade",
  ],
} as const;

function normalizarCabecalho(valor: unknown) {
  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function localizarIndice(cabecalhos: string[], aliases: readonly string[]) {
  return cabecalhos.findIndex((cabecalho) => aliases.includes(cabecalho));
}

function textoCelula(valor: unknown) {
  const texto = String(valor ?? "").trim();
  return texto.length > 0 ? texto : null;
}

export function lerPlanilhaFornecedor(
  buffer: Buffer,
): ResultadoParserFornecedor {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const nomeAba = workbook.SheetNames[0];

  if (!nomeAba) {
    return { nomeAba: "", linhas: [] };
  }

  const planilha = workbook.Sheets[nomeAba];
  const linhasBrutas = XLSX.utils.sheet_to_json<LinhaBruta>(planilha, {
    header: 1,
    blankrows: false,
    defval: null,
    raw: false,
  });

  const [cabecalhoBruto = [], ...linhas] = linhasBrutas;
  const cabecalhos = cabecalhoBruto.map(normalizarCabecalho);
  const indiceCodigo = localizarIndice(
    cabecalhos,
    aliasesColunas.codigoFornecedor,
  );
  const indiceNome = localizarIndice(cabecalhos, aliasesColunas.nomeProduto);
  const indiceCategoria = localizarIndice(
    cabecalhos,
    aliasesColunas.categoriaFornecedor,
  );
  const indicePreco = localizarIndice(
    cabecalhos,
    aliasesColunas.precoFornecedor,
  );
  const indiceEstoque = localizarIndice(
    cabecalhos,
    aliasesColunas.estoqueFornecedor,
  );

  return {
    nomeAba,
    linhas: linhas.map<LinhaPlanilhaFornecedor>((linha, indice) => {
      const codigoFornecedor =
        indiceCodigo >= 0 ? textoCelula(linha[indiceCodigo]) : null;
      const nomeProduto = indiceNome >= 0 ? textoCelula(linha[indiceNome]) : "";
      const categoriaFornecedor =
        indiceCategoria >= 0 ? textoCelula(linha[indiceCategoria]) : null;
      const precoFornecedorOriginal =
        indicePreco >= 0 ? textoCelula(linha[indicePreco]) : null;
      const estoqueFornecedorOriginal =
        indiceEstoque >= 0 ? textoCelula(linha[indiceEstoque]) : null;

      return {
        numeroLinha: indice + 2,
        codigoFornecedor,
        nomeProduto: nomeProduto ?? "",
        categoriaFornecedor,
        precoFornecedorOriginal,
        estoqueFornecedorOriginal,
        linhaVazia: linha.every((celula) => textoCelula(celula) === null),
      };
    }),
  };
}
