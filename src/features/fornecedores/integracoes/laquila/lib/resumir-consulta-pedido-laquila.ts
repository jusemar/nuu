import type {
  RespostaLaquilaJson,
  ResultadoChamadaLaquila,
} from "./cliente-laquila";

export type ResumoConsultaPedidoLaquila = {
  metodo: "00008";
  consultadoEm: string;
  sucesso: boolean;
  codigoHttp: number | null;
  pedidoEncontrado: boolean;
  statusInicial: string | null;
  datas: Record<string, string>;
  erro?: string;
};

function normalizarChave(chave: string) {
  return chave.toLowerCase().replace(/[^a-z0-9]/gu, "");
}

function encontrarRegistroPedido(dados: RespostaLaquilaJson, idPedido: string) {
  const fila: unknown[] = [dados];

  while (fila.length > 0) {
    const atual = fila.shift();
    if (!atual || typeof atual !== "object") continue;

    if (!Array.isArray(atual)) {
      const registro = atual as Record<string, unknown>;
      const contemPedido = Object.entries(registro).some(
        ([chave, valor]) =>
          normalizarChave(chave) === "idpedido" &&
          String(valor).trim() === idPedido,
      );
      if (contemPedido) return registro;
    }

    fila.push(...Object.values(atual));
  }

  return null;
}

function extrairStatusInicial(registro: Record<string, unknown> | null) {
  if (!registro) return null;

  const chavesStatus = new Set([
    "status",
    "statuspedido",
    "situacao",
    "situacaopedido",
    "dssituacao",
    "stpedido",
  ]);

  for (const [chave, valor] of Object.entries(registro)) {
    if (!chavesStatus.has(normalizarChave(chave)) || valor == null) continue;
    const status = String(valor).trim();
    if (status) return status;
  }

  return null;
}

function extrairDatas(registro: Record<string, unknown> | null) {
  if (!registro) return {};

  return Object.fromEntries(
    Object.entries(registro)
      .filter(([chave, valor]) => {
        const normalizada = normalizarChave(chave);
        return (
          (normalizada.startsWith("dt") || normalizada.includes("data")) &&
          (typeof valor === "string" || typeof valor === "number")
        );
      })
      .slice(0, 10)
      .map(([chave, valor]) => [chave, String(valor)]),
  );
}

function sanitizarErroConsulta(mensagem: string) {
  return mensagem
    .replace(/https:\/\/[^\s/]+\/[^\s/]+/giu, "[url-removida]")
    .replace(/\b\d{11,14}\b/gu, "[documento-removido]")
    .slice(0, 500);
}

/** Mantém no banco apenas a evidência operacional necessária da leitura 00008. */
export function resumirConsultaPedidoLaquila({
  resposta,
  idPedido,
  consultadoEm = new Date(),
}: {
  resposta: ResultadoChamadaLaquila;
  idPedido: string;
  consultadoEm?: Date;
}): ResumoConsultaPedidoLaquila {
  if (!resposta.sucesso) {
    return {
      metodo: "00008",
      consultadoEm: consultadoEm.toISOString(),
      sucesso: false,
      codigoHttp: resposta.codigoHttp,
      pedidoEncontrado: false,
      statusInicial: null,
      datas: {},
      erro: sanitizarErroConsulta(resposta.erro),
    };
  }

  const registro = encontrarRegistroPedido(resposta.dados, idPedido);

  return {
    metodo: "00008",
    consultadoEm: consultadoEm.toISOString(),
    sucesso: Boolean(registro),
    codigoHttp: resposta.codigoHttp,
    pedidoEncontrado: Boolean(registro),
    statusInicial: extrairStatusInicial(registro),
    datas: extrairDatas(registro),
    ...(!registro
      ? { erro: "Consulta 00008 não confirmou o pedido externo informado." }
      : {}),
  };
}
