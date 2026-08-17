import type { ItemSaldoPrecoLaquilaApi } from "./cliente-laquila";

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
    lerTexto(registro, "qt_saldo").replace(/\./gu, "").replace(",", "."),
  );
  return Number.isFinite(numero) ? numero : null;
}

/** O preço do 00006 não participa do payload; vale o snapshot do checkout. */
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

    itensValidados.push({
      cdItem,
      quantidadeSolicitada: item.qt_pedida,
      saldoInformado,
      situacao,
    });
  }

  return { sucesso: true, itens: itensValidados };
}
