import type { ItemSaldoPrecoLaquilaApi } from "./cliente-laquila";
import { normalizarDecimalLaquila } from "./normalizar-decimal-laquila";

type ItemSolicitadoLaquila = {
  cd_item: string;
  qt_pedida: number;
};

export type ResultadoRevalidacaoEstoqueLaquila =
  | {
      sucesso: true;
      itens: Array<{
        cdItem: string;
        quantidadeSolicitada: number;
        saldoInformado: number;
        situacao: string;
        precoFornecedor: number;
      }>;
    }
  | { sucesso: false; erro: string };

function lerTexto(registro: ItemSaldoPrecoLaquilaApi, chave: string) {
  const valor = registro[chave];
  return typeof valor === "string" || typeof valor === "number"
    ? String(valor).trim()
    : "";
}

function lerSaldo(registro: ItemSaldoPrecoLaquilaApi) {
  const numero = Number(
    normalizarDecimalLaquila(lerTexto(registro, "qt_saldo")),
  );
  return Number.isFinite(numero) ? numero : null;
}

function lerPrecoFornecedor(registro: ItemSaldoPrecoLaquilaApi) {
  const normalizado = normalizarDecimalLaquila(lerTexto(registro, "vl_preco"));
  if (normalizado === null) return null;

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

/** O preço do payload continua histórico; o 00006 confirma que o item é vendável. */
export function revalidarEstoqueItensPedidoLaquila(
  itensSolicitados: readonly ItemSolicitadoLaquila[],
  saldosAtuais: readonly ItemSaldoPrecoLaquilaApi[],
): ResultadoRevalidacaoEstoqueLaquila {
  const saldosPorCodigo = new Map(
    saldosAtuais.map((item) => [lerTexto(item, "cd_item"), item]),
  );
  const itensValidados = [];

  for (const item of itensSolicitados) {
    const cdItem = item.cd_item.trim();
    const saldoAtual = saldosPorCodigo.get(cdItem);
    if (!saldoAtual) {
      return {
        sucesso: false,
        erro: `Estoque Laquila não confirmado: item ${cdItem} ausente no 00006.`,
      };
    }

    const situacao = lerTexto(saldoAtual, "sit_estoque").toUpperCase();
    const saldoInformado = lerSaldo(saldoAtual);
    const precoFornecedor = lerPrecoFornecedor(saldoAtual);
    if (situacao !== "DISPONIVEL") {
      return {
        sucesso: false,
        erro: `Estoque Laquila indisponível para o item ${cdItem}.`,
      };
    }
    if (saldoInformado === null || saldoInformado < item.qt_pedida) {
      return {
        sucesso: false,
        erro: `Saldo Laquila insuficiente para o item ${cdItem}: solicitado ${item.qt_pedida}, disponível ${saldoInformado ?? "inválido"}.`,
      };
    }
    if (precoFornecedor === null || precoFornecedor <= 0) {
      return {
        sucesso: false,
        erro: `Preço Laquila inválido para o item ${cdItem}.`,
      };
    }

    itensValidados.push({
      cdItem,
      quantidadeSolicitada: item.qt_pedida,
      saldoInformado,
      situacao,
      precoFornecedor,
    });
  }

  return { sucesso: true, itens: itensValidados };
}
