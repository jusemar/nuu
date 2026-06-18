import * as XLSX from "xlsx";

import type {
  CampoMapeamentoColunaFornecedor,
  ColunaPlanilhaFornecedor,
  LinhaPlanilhaFornecedor,
  MapeamentoColunaFornecedor,
  OrigemMapeamentoColunaFornecedor,
  ResultadoParserFornecedor,
  ResultadoDeteccaoColunaFornecedor,
} from "../types/fornecedores.types";

type LinhaBruta = Array<string | number | boolean | Date | null | undefined>;
type MapaIndices = Partial<Record<CampoMapeamentoColunaFornecedor, number>>;

export const camposMapeamentoColunaFornecedor = [
  "codigo_fornecedor",
  "nome_produto",
  "categoria_fornecedor",
  "marca_fornecedor",
  "preco_fornecedor",
  "estoque_fornecedor",
] as const;

export const aliasesColunasFornecedor: Record<
  CampoMapeamentoColunaFornecedor,
  readonly string[]
> = {
  codigo_fornecedor: [
    "codigo_fornecedor",
    "codigo fornecedor",
    "codigo",
    "sku",
    "codigo auxiliar",
    "codigo produto",
    "cod produto",
    "cod fornecedor",
    "referencia",
  ],
  nome_produto: [
    "nome_produto",
    "nome produto",
    "produto",
    "nome",
    "descricao",
    "descrição",
  ],
  categoria_fornecedor: [
    "categoria_fornecedor",
    "categoria fornecedor",
    "categoria",
    "grupo",
  ],
  marca_fornecedor: ["marca_fornecedor", "marca fornecedor", "marca"],
  preco_fornecedor: [
    "preco_fornecedor",
    "preco fornecedor",
    "preco",
    "valor",
    "r$ preco",
    "preco r$",
    "valor r$",
  ],
  estoque_fornecedor: [
    "estoque_fornecedor",
    "estoque fornecedor",
    "estoque",
    "quantidade",
    "estoque disponivel",
    "qtd",
    "saldo",
  ],
} as const;

export function normalizarCabecalhoFornecedor(valor: unknown) {
  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s$]/g, " ")
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

function montarColunas(cabecalhoBruto: LinhaBruta): ColunaPlanilhaFornecedor[] {
  return cabecalhoBruto.map((nomeOriginal, indice) => ({
    indice,
    nomeOriginal: String(nomeOriginal ?? "").trim(),
    nomeNormalizado: normalizarCabecalhoFornecedor(nomeOriginal),
  }));
}

function criarRegistroBruto(
  colunas: ColunaPlanilhaFornecedor[],
  linha: LinhaBruta,
) {
  return colunas.reduce<
    Record<string, string | number | boolean | Date | null>
  >((dados, coluna) => {
    dados[coluna.nomeOriginal || `coluna_${coluna.indice + 1}`] =
      linha[coluna.indice] ?? null;
    return dados;
  }, {});
}

function resolverIndicesPorMapeamento(
  colunas: ColunaPlanilhaFornecedor[],
  mapeamentos: MapeamentoColunaFornecedor[] = [],
) {
  return mapeamentos.reduce<MapaIndices>((indices, mapeamento) => {
    const nomeNormalizado = normalizarCabecalhoFornecedor(
      mapeamento.nomeColunaOrigem,
    );
    const coluna = colunas.find(
      (item) => item.nomeNormalizado === nomeNormalizado,
    );

    if (coluna) {
      indices[mapeamento.campoDestino] = coluna.indice;
    }

    return indices;
  }, {});
}

function resolverIndicesAutomaticos(
  cabecalhos: string[],
  indicesBase: MapaIndices,
) {
  return camposMapeamentoColunaFornecedor.reduce<MapaIndices>(
    (indices, campo) => {
      if (indices[campo] !== undefined) return indices;

      const indice = localizarIndice(
        cabecalhos,
        aliasesColunasFornecedor[campo],
      );
      if (indice >= 0) {
        indices[campo] = indice;
      }

      return indices;
    },
    { ...indicesBase },
  );
}

export function detectarMapeamentoColunasFornecedor(
  colunas: ColunaPlanilhaFornecedor[],
  mapeamentoSalvo: MapeamentoColunaFornecedor[] = [],
  mapeamentoConfirmado: MapeamentoColunaFornecedor[] = [],
): ResultadoDeteccaoColunaFornecedor[] {
  const destinosUsados = new Map<CampoMapeamentoColunaFornecedor, string>();
  return colunas.map((coluna) => {
    const confirmado = mapeamentoConfirmado.find(
      (item) =>
        normalizarCabecalhoFornecedor(item.nomeColunaOrigem) ===
        coluna.nomeNormalizado,
    );
    const salvo = mapeamentoSalvo.find(
      (item) =>
        normalizarCabecalhoFornecedor(item.nomeColunaOrigem) ===
        coluna.nomeNormalizado,
    );
    const automatico = camposMapeamentoColunaFornecedor.find((campo) =>
      aliasesColunasFornecedor[campo].includes(coluna.nomeNormalizado),
    );
    const resolvido = confirmado ?? salvo;
    const campoDestino = resolvido?.campoDestino ?? automatico ?? null;
    const origem: OrigemMapeamentoColunaFornecedor | null = confirmado
      ? "confirmado"
      : salvo
        ? "salvo"
        : automatico
          ? "automatico"
          : null;

    const destinoDuplicado =
      campoDestino && destinosUsados.has(campoDestino)
        ? destinosUsados.get(campoDestino)
        : null;

    if (campoDestino && !destinoDuplicado) {
      destinosUsados.set(campoDestino, coluna.nomeOriginal);
    }

    return {
      nomeColunaOrigem: coluna.nomeOriginal,
      nomeColunaNormalizada: coluna.nomeNormalizado,
      campoDestino,
      origem,
      situacao: destinoDuplicado
        ? "conflito"
        : origem === "salvo"
          ? "vindo_do_mapeamento_salvo"
          : origem === "automatico" || origem === "confirmado"
            ? "detectado_automaticamente"
            : "pendente",
    };
  });
}

export function lerPlanilhaFornecedor(
  buffer: Buffer,
  opcoes: {
    mapeamentoSalvo?: MapeamentoColunaFornecedor[];
    mapeamentoConfirmado?: MapeamentoColunaFornecedor[];
  } = {},
): ResultadoParserFornecedor {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const nomeAba = workbook.SheetNames[0];

  if (!nomeAba) {
    return { nomeAba: "", colunas: [], mapeamentoColunas: [], linhas: [] };
  }

  const planilha = workbook.Sheets[nomeAba];
  const linhasBrutas = XLSX.utils.sheet_to_json<LinhaBruta>(planilha, {
    header: 1,
    blankrows: false,
    defval: null,
    raw: false,
  });

  const [cabecalhoBruto = [], ...linhas] = linhasBrutas;
  const colunas = montarColunas(cabecalhoBruto);
  const cabecalhos = colunas.map((coluna) => coluna.nomeNormalizado);
  const indicesMapeados = resolverIndicesPorMapeamento(colunas, [
    ...(opcoes.mapeamentoSalvo ?? []),
    ...(opcoes.mapeamentoConfirmado ?? []),
  ]);
  const indices = resolverIndicesAutomaticos(cabecalhos, indicesMapeados);
  const mapeamentoColunas = detectarMapeamentoColunasFornecedor(
    colunas,
    opcoes.mapeamentoSalvo,
    opcoes.mapeamentoConfirmado,
  );

  return {
    nomeAba,
    colunas,
    mapeamentoColunas,
    linhas: linhas.map<LinhaPlanilhaFornecedor>((linha, indice) => {
      const codigoFornecedor =
        indices.codigo_fornecedor !== undefined
          ? textoCelula(linha[indices.codigo_fornecedor])
          : null;
      const nomeProduto =
        indices.nome_produto !== undefined
          ? textoCelula(linha[indices.nome_produto])
          : "";
      const categoriaFornecedor =
        indices.categoria_fornecedor !== undefined
          ? textoCelula(linha[indices.categoria_fornecedor])
          : null;
      const marcaFornecedor =
        indices.marca_fornecedor !== undefined
          ? textoCelula(linha[indices.marca_fornecedor])
          : null;
      const precoFornecedorOriginal =
        indices.preco_fornecedor !== undefined
          ? textoCelula(linha[indices.preco_fornecedor])
          : null;
      const estoqueFornecedorOriginal =
        indices.estoque_fornecedor !== undefined
          ? textoCelula(linha[indices.estoque_fornecedor])
          : null;

      return {
        numeroLinha: indice + 2,
        codigoFornecedor,
        nomeProduto: nomeProduto ?? "",
        categoriaFornecedor,
        marcaFornecedor,
        precoFornecedorOriginal,
        estoqueFornecedorOriginal,
        linhaVazia: linha.every((celula) => textoCelula(celula) === null),
        dadosBrutos: criarRegistroBruto(colunas, linha),
      };
    }),
  };
}
