import type { ItemSaldoPrecoLaquilaApi } from "./cliente-laquila";

export type SaldoPrecoLaquilaNormalizado = {
  codigoFornecedor: string;
  precoFornecedor: string | null;
  estoqueFornecedor: number | null;
};

function lerTexto(
  item: ItemSaldoPrecoLaquilaApi,
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

  const texto = valor.trim();
  const temVirgulaDecimal = texto.includes(",");
  const normalizado = temVirgulaDecimal
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const numero = Number(normalizado);

  if (!Number.isFinite(numero)) return null;

  return numero.toFixed(2);
}

function normalizarInteiro(valor: string | null) {
  if (!valor) return null;

  const normalizado = valor.trim().replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);

  if (!Number.isFinite(numero)) return null;

  return Math.trunc(numero);
}

export function normalizarSaldoPrecoLaquila(
  item: ItemSaldoPrecoLaquilaApi,
): SaldoPrecoLaquilaNormalizado | null {
  const codigoFornecedor = lerTexto(item, ["cd_item"]);

  if (!codigoFornecedor) return null;

  return {
    codigoFornecedor,
    precoFornecedor: normalizarDecimal(
      lerTexto(item, ["vl_preco", "preco", "preco_venda", "valor"]),
    ),
    estoqueFornecedor: normalizarInteiro(
      lerTexto(item, ["qt_saldo", "saldo", "estoque", "quantidade"]),
    ),
  };
}

export function normalizarSaldosPrecosLaquila(
  itens: ItemSaldoPrecoLaquilaApi[],
) {
  return itens.flatMap((item) => {
    const saldoPreco = normalizarSaldoPrecoLaquila(item);

    return saldoPreco ? [saldoPreco] : [];
  });
}
