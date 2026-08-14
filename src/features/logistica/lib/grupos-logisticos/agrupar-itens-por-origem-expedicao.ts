import type {
  GrupoLogistico,
  ItemAgrupavelLogisticamente,
} from "../../types/grupos-logisticos";

function normalizarProvedor(item: ItemAgrupavelLogisticamente, indice: number) {
  if (item.origemExpedicao === "loja") {
    if (item.fornecedorProvedor !== null) {
      throw new TypeError(
        `Item ${indice}: origem loja nao pode possuir fornecedorProvedor.`,
      );
    }

    return null;
  }

  const provedor = item.fornecedorProvedor?.trim().toLowerCase();

  if (!provedor) {
    throw new TypeError(
      `Item ${indice}: origem fornecedor exige fornecedorProvedor.`,
    );
  }

  return provedor;
}

function criarChaveGrupo(
  origemExpedicao: ItemAgrupavelLogisticamente["origemExpedicao"],
  fornecedorProvedor: string | null,
) {
  return origemExpedicao === "loja"
    ? "expedicao:loja"
    : `expedicao:fornecedor:${fornecedorProvedor}`;
}

function compararGrupos<TItem extends ItemAgrupavelLogisticamente>(
  grupoA: GrupoLogistico<TItem>,
  grupoB: GrupoLogistico<TItem>,
) {
  if (grupoA.origemExpedicao !== grupoB.origemExpedicao) {
    return grupoA.origemExpedicao === "loja" ? -1 : 1;
  }

  return (grupoA.fornecedorProvedor ?? "").localeCompare(
    grupoB.fornecedorProvedor ?? "",
  );
}

export function agruparItensPorOrigemExpedicao<
  TItem extends ItemAgrupavelLogisticamente,
>(itens: readonly TItem[]): GrupoLogistico<TItem>[] {
  const gruposPorChave = new Map<string, GrupoLogistico<TItem>>();

  itens.forEach((item, indice) => {
    const fornecedorProvedor = normalizarProvedor(item, indice);
    const chave = criarChaveGrupo(item.origemExpedicao, fornecedorProvedor);
    const grupoExistente = gruposPorChave.get(chave);

    if (grupoExistente) {
      if (
        grupoExistente.necessitaEtiquetaFornecedor !==
        item.necessitaEtiquetaFornecedor
      ) {
        throw new TypeError(
          `Item ${indice}: itens do mesmo grupo devem compartilhar a regra de etiqueta.`,
        );
      }

      grupoExistente.itens.push(item);
      return;
    }

    gruposPorChave.set(chave, {
      chave,
      origemExpedicao: item.origemExpedicao,
      fornecedorProvedor,
      itens: [item],
      necessitaEtiquetaFornecedor: item.necessitaEtiquetaFornecedor,
    });
  });

  return [...gruposPorChave.values()].sort(compararGrupos);
}
