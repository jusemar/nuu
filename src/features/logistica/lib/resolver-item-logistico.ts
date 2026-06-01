import { esquemaItemLogistico } from "../schemas/contratos-frete";
import type { DimensoesPacote, ItemLogistico } from "../types/contratos-frete";

export type ProdutoParaItemLogistico = {
  identificador: string;
  nome: string;
  codigoSku?: string | null;
  tipo: "simples" | "com-variantes";
  pesoEmGramas?: number | null;
  alturaEmCm?: number | null;
  larguraEmCm?: number | null;
  comprimentoEmCm?: number | null;
};

export type VarianteParaItemLogistico = {
  identificador: string;
  nome?: string | null;
  codigoSku?: string | null;
  pesoEmGramas?: number | null;
  alturaEmCm?: number | null;
  larguraEmCm?: number | null;
  comprimentoEmCm?: number | null;
};

export type CampoObrigatorioItemLogistico =
  | "pesoEmGramas"
  | "alturaEmCm"
  | "larguraEmCm"
  | "comprimentoEmCm";

export type ErroResolucaoItemLogistico = {
  codigo:
    | "quantidade-invalida"
    | "variante-obrigatoria"
    | "dimensoes-incompletas"
    | "item-logistico-invalido";
  mensagem: string;
  camposAusentes: CampoObrigatorioItemLogistico[];
};

export type ResultadoResolucaoItemLogistico =
  | {
      sucesso: true;
      item: ItemLogistico;
    }
  | {
      sucesso: false;
      erro: ErroResolucaoItemLogistico;
    };

type EntradaResolverItemLogistico = {
  produto: ProdutoParaItemLogistico;
  variante?: VarianteParaItemLogistico | null;
  quantidade: number;
  identificadorItem?: string;
  valorDeclaradoEmCentavos?: number | null;
};

type MedidasItemLogistico = {
  pesoEmGramas?: number | null;
  alturaEmCm?: number | null;
  larguraEmCm?: number | null;
  comprimentoEmCm?: number | null;
};

type MedidasItemLogisticoResolvidas = {
  pesoEmGramas: number;
  alturaEmCm: number;
  larguraEmCm: number;
  comprimentoEmCm: number;
};

const camposObrigatoriosItemLogistico = [
  "pesoEmGramas",
  "alturaEmCm",
  "larguraEmCm",
  "comprimentoEmCm",
] as const satisfies readonly CampoObrigatorioItemLogistico[];

function obterCamposAusentes(medidas: MedidasItemLogistico) {
  return camposObrigatoriosItemLogistico.filter((campo) => {
    const valor = medidas[campo];
    return typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0;
  });
}

function temMedidasCompletas(
  medidas: MedidasItemLogistico,
): medidas is MedidasItemLogisticoResolvidas {
  return obterCamposAusentes(medidas).length === 0;
}

function montarErroResolucaoItemLogistico(
  codigo: ErroResolucaoItemLogistico["codigo"],
  mensagem: string,
  camposAusentes: CampoObrigatorioItemLogistico[] = [],
): ResultadoResolucaoItemLogistico {
  return {
    sucesso: false,
    erro: {
      codigo,
      mensagem,
      camposAusentes,
    },
  };
}

function montarDimensoesPacote(medidas: MedidasItemLogisticoResolvidas) {
  return {
    alturaEmCm: medidas.alturaEmCm,
    larguraEmCm: medidas.larguraEmCm,
    comprimentoEmCm: medidas.comprimentoEmCm,
  } satisfies DimensoesPacote;
}

function resolverMedidasItem({
  produto,
  variante,
}: {
  produto: ProdutoParaItemLogistico;
  variante?: VarianteParaItemLogistico | null;
}): MedidasItemLogistico {
  if (!variante) return produto;

  return {
    pesoEmGramas: variante.pesoEmGramas ?? produto.pesoEmGramas,
    alturaEmCm: variante.alturaEmCm ?? produto.alturaEmCm,
    larguraEmCm: variante.larguraEmCm ?? produto.larguraEmCm,
    comprimentoEmCm: variante.comprimentoEmCm ?? produto.comprimentoEmCm,
  };
}

export function resolverItemLogistico({
  produto,
  variante,
  quantidade,
  identificadorItem,
  valorDeclaradoEmCentavos,
}: EntradaResolverItemLogistico): ResultadoResolucaoItemLogistico {
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return montarErroResolucaoItemLogistico(
      "quantidade-invalida",
      "Informe uma quantidade inteira e maior que zero para cotar frete.",
    );
  }

  if (produto.tipo === "com-variantes" && !variante) {
    return montarErroResolucaoItemLogistico(
      "variante-obrigatoria",
      "Selecione uma variante antes de resolver o item logistico.",
    );
  }

  const origemMedidas =
    produto.tipo === "simples"
      ? produto
      : resolverMedidasItem({ produto, variante });

  if (!temMedidasCompletas(origemMedidas)) {
    return montarErroResolucaoItemLogistico(
      "dimensoes-incompletas",
      "Peso e dimensoes do item logistico precisam estar completos.",
      obterCamposAusentes(origemMedidas),
    );
  }

  const medidas = origemMedidas;
  const itemCandidato: ItemLogistico = {
    identificador:
      identificadorItem ||
      [produto.identificador, variante?.identificador || "produto"].join(":"),
    produtoId: produto.identificador,
    varianteId: variante?.identificador ?? null,
    nome: variante?.nome?.trim() || produto.nome,
    codigoSku: variante?.codigoSku ?? produto.codigoSku ?? null,
    quantidade,
    pesoEmGramas: medidas.pesoEmGramas,
    dimensoes: montarDimensoesPacote(medidas),
    valorDeclaradoEmCentavos: valorDeclaradoEmCentavos ?? null,
  };
  const validacao = esquemaItemLogistico.safeParse(itemCandidato);

  if (!validacao.success) {
    return montarErroResolucaoItemLogistico(
      "item-logistico-invalido",
      "Os dados resolvidos nao formam um item logistico valido.",
    );
  }

  return {
    sucesso: true,
    item: validacao.data,
  };
}
