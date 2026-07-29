import {
  type AgendaEntregaPropria,
  TIMEZONE_ENTREGA_PROPRIA,
} from "./calcular-promessa-entrega-propria";

export type PromessaEntregaProgramada = {
  dataPrometida: string;
  texto: string;
  prazoMinimoEmDiasCorridos: number;
  diasConfigurados: number[];
  timezone: typeof TIMEZONE_ENTREGA_PROPRIA;
  calculadoEm: string;
};

function obterDataLocal(data: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_ENTREGA_PROPRIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);
  const obter = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value ?? 0);

  return { ano: obter("year"), mes: obter("month"), dia: obter("day") };
}

function adicionarDias(
  data: { ano: number; mes: number; dia: number },
  dias: number,
) {
  const resultado = new Date(Date.UTC(data.ano, data.mes - 1, data.dia + dias));
  return {
    ano: resultado.getUTCFullYear(),
    mes: resultado.getUTCMonth() + 1,
    dia: resultado.getUTCDate(),
    diaDaSemana: resultado.getUTCDay(),
  };
}

function formatarIso(data: { ano: number; mes: number; dia: number }) {
  return `${data.ano.toString().padStart(4, "0")}-${data.mes
    .toString()
    .padStart(2, "0")}-${data.dia.toString().padStart(2, "0")}`;
}

function formatarTexto(diferencaEmDias: number, data: Date) {
  if (diferencaEmDias <= 7) {
    const dia = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      timeZone: "UTC",
    }).format(data);
    return `Receba ${dia}`;
  }

  return `Receba ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(data)}`;
}

/**
 * Soma dias corridos e só então procura o primeiro dia atendido. O horário de
 * corte não participa da promessa programada.
 */
export function calcularPromessaEntregaProgramada({
  agenda,
  prazoMinimoEmDiasCorridos,
  dataReferencia = new Date(),
}: {
  agenda: AgendaEntregaPropria | null | undefined;
  prazoMinimoEmDiasCorridos: number;
  dataReferencia?: Date;
}): PromessaEntregaProgramada | null {
  const dias = [...new Set(agenda?.diasDaSemana ?? [])]
    .filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6)
    .sort((a, b) => a - b);
  const prazo = Math.max(0, Math.trunc(prazoMinimoEmDiasCorridos));

  if (!agenda?.ativa || dias.length === 0) return null;

  const hoje = obterDataLocal(dataReferencia);
  for (let diferenca = prazo; diferenca <= prazo + 14; diferenca += 1) {
    const candidata = adicionarDias(hoje, diferenca);
    if (!dias.includes(candidata.diaDaSemana)) continue;

    const dataUtc = new Date(
      Date.UTC(candidata.ano, candidata.mes - 1, candidata.dia),
    );
    return {
      dataPrometida: formatarIso(candidata),
      texto: formatarTexto(diferenca, dataUtc),
      prazoMinimoEmDiasCorridos: prazo,
      diasConfigurados: dias,
      timezone: TIMEZONE_ENTREGA_PROPRIA,
      calculadoEm: dataReferencia.toISOString(),
    };
  }

  return null;
}
