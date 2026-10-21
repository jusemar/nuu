import type { ResultadoChamadaLaquila } from "../cliente-laquila";

export type EstadoExternoPedidoLaquila = {
  estado: "aberto" | "cancelado" | "desconhecido";
  terminal: boolean;
  codigoHttp: number | null;
  campos: Record<string, string>;
  erro: string | null;
};

export type SincronizacaoPedidoLaquila = {
  versao: 1;
  ultimoEstado: EstadoExternoPedidoLaquila | null;
  consultadoEm: string;
  atualizadoEstadoEm: string | null;
  proximaConsultaEm: string | null;
  falhasConsecutivas: number;
  erro: string | null;
  revisaoOperacional?: string | null;
};

const INTERVALO_MS = 60 * 60 * 1000;

function objeto(valor: unknown): valor is Record<string, unknown> {
  return Boolean(valor && typeof valor === "object" && !Array.isArray(valor));
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Só campos operacionais escalares entram no diagnóstico; nunca o payload bruto. */
function textoSeguro(valor: unknown, segredos: readonly string[]) {
  if (typeof valor !== "string" && typeof valor !== "number") return null;
  let texto = String(valor).slice(0, 500);
  for (const segredo of segredos) {
    if (segredo) texto = texto.split(segredo).join("[removido]");
  }
  return texto
    .replace(/https?:\/\/\S+/gi, "[url-removida]")
    .replace(/[\w.+-]+@[\w.-]+/g, "[email-removido]")
    .replace(/\b\d{11,14}\b/g, "[documento-removido]");
}

/**
 * O cancelamento HTTP 400 é um contrato observado em produção em 20/10/2026.
 * A frase deve referir-se exatamente ao pedido consultado. Um 5xx, outro ID ou
 * texto como "não cancelado" nunca se transforma em cancelamento.
 */
export function interpretarConsultaPedidoLaquila(
  resposta: ResultadoChamadaLaquila,
  idPedido: string,
  segredos: readonly string[] = [],
): EstadoExternoPedidoLaquila {
  const mensagem = resposta.dados?.erro;
  const canceladoPorMensagem =
    resposta.codigoHttp === 400 &&
    typeof mensagem === "string" &&
    normalizar(mensagem.trim()) === `o pedido ${idPedido} esta cancelado.`;

  if (canceladoPorMensagem) {
    return {
      estado: "cancelado",
      terminal: true,
      codigoHttp: 400,
      campos: {
        id_pedido: idPedido,
        mensagem: `O pedido ${idPedido} está cancelado.`,
      },
      erro: null,
    };
  }

  if (!resposta.sucesso) {
    return {
      estado: "desconhecido",
      terminal: false,
      codigoHttp: resposta.codigoHttp,
      campos: {},
      erro: "Não foi possível confirmar o estado externo nesta consulta.",
    };
  }

  const fila: unknown[] = [resposta.dados];
  let registro: Record<string, unknown> | null = null;
  // Limita a travessia mesmo se o fornecedor mudar a estrutura da resposta.
  for (let indice = 0; indice < fila.length && indice < 1000; indice += 1) {
    const atual = fila[indice];
    if (!atual || typeof atual !== "object") continue;
    if (objeto(atual) && String(atual.id_pedido ?? "").trim() === idPedido) {
      registro = atual;
      break;
    }
    fila.push(...Object.values(atual));
  }
  if (!registro) {
    return {
      estado: "desconhecido",
      terminal: false,
      codigoHttp: resposta.codigoHttp,
      campos: {},
      erro: "A resposta não confirmou o pedido externo consultado.",
    };
  }

  const campos: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(registro)) {
    if (
      !/^(id_pedido|status|status_pedido|situacao(_pedido|_venda)?|estagio(_venda)?|ds_(situacao|estagio).*|st_pedido|cd_(situacao|estagio).*|dt_.*|nr_prenota|prenota|id_prenota|nr_nota|situacao_remessa)$/i.test(
        chave,
      )
    )
      continue;
    const texto = textoSeguro(valor, segredos);
    if (texto !== null) campos[chave] = texto;
  }
  // Sem documentação de novos códigos, persistimos o valor e mantemos aberto.
  return {
    estado: "aberto",
    terminal: false,
    codigoHttp: resposta.codigoHttp,
    campos,
    erro: null,
  };
}

export function lerSincronizacaoPedidoLaquila(
  valor: unknown,
): SincronizacaoPedidoLaquila | null {
  if (
    !objeto(valor) ||
    valor.versao !== 1 ||
    typeof valor.consultadoEm !== "string"
  )
    return null;
  return valor as SincronizacaoPedidoLaquila;
}

export function atualizarSincronizacaoPedidoLaquila({
  anterior,
  consulta,
  agora,
}: {
  anterior: SincronizacaoPedidoLaquila | null;
  consulta: EstadoExternoPedidoLaquila;
  agora: Date;
}): SincronizacaoPedidoLaquila {
  const falhas = consulta.erro ? (anterior?.falhasConsecutivas ?? 0) + 1 : 0;
  const ultimoEstado = consulta.erro
    ? (anterior?.ultimoEstado ?? null)
    : consulta;
  const mudou =
    JSON.stringify(ultimoEstado) !==
    JSON.stringify(anterior?.ultimoEstado ?? null);
  return {
    versao: 1,
    ultimoEstado,
    consultadoEm: agora.toISOString(),
    atualizadoEstadoEm: mudou
      ? agora.toISOString()
      : (anterior?.atualizadoEstadoEm ?? null),
    proximaConsultaEm: ultimoEstado?.terminal
      ? null
      : new Date(
          agora.getTime() +
            INTERVALO_MS * Math.min(2 ** Math.max(0, falhas - 1), 6),
        ).toISOString(),
    falhasConsecutivas: falhas,
    erro: consulta.erro,
    revisaoOperacional: anterior?.revisaoOperacional ?? null,
  };
}
