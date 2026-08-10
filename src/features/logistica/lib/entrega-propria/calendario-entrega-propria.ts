export const TIMEZONE_ENTREGA_PROPRIA = "America/Sao_Paulo";

export type DataCalendarioEntregaPropria = {
  ano: number;
  mes: number;
  dia: number;
  diaDaSemana: number;
};

export function normalizarDiasAtendidos(dias: number[]) {
  return [...new Set(dias)]
    .filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6)
    .sort((a, b) => a - b);
}

export function obterPartesDataEntregaPropria(data: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_ENTREGA_PROPRIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);
  const obter = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value ?? 0);

  return {
    ano: obter("year"),
    mes: obter("month"),
    dia: obter("day"),
    hora: obter("hour"),
    minuto: obter("minute"),
  };
}

export function adicionarDiasCalendario(
  data: { ano: number; mes: number; dia: number },
  dias: number,
): DataCalendarioEntregaPropria {
  const resultado = new Date(Date.UTC(data.ano, data.mes - 1, data.dia + dias));
  return {
    ano: resultado.getUTCFullYear(),
    mes: resultado.getUTCMonth() + 1,
    dia: resultado.getUTCDate(),
    diaDaSemana: resultado.getUTCDay(),
  };
}

export function formatarDataIsoEntregaPropria(
  data: Pick<DataCalendarioEntregaPropria, "ano" | "mes" | "dia">,
) {
  return `${data.ano.toString().padStart(4, "0")}-${data.mes
    .toString()
    .padStart(2, "0")}-${data.dia.toString().padStart(2, "0")}`;
}

/** Procura uma data operacional usando o mesmo calendário para as modalidades. */
export function buscarProximaDataAtendida({
  dataInicial,
  diferencaInicial,
  diasAtendidos,
  datasBloqueadas = [],
  bloquearHoje = false,
}: {
  dataInicial: { ano: number; mes: number; dia: number };
  diferencaInicial: number;
  diasAtendidos: number[];
  datasBloqueadas?: string[];
  bloquearHoje?: boolean;
}) {
  const bloqueios = new Set(datasBloqueadas);

  for (
    let diferenca = diferencaInicial;
    diferenca <= diferencaInicial + 14;
    diferenca += 1
  ) {
    const candidata = adicionarDiasCalendario(dataInicial, diferenca);
    const iso = formatarDataIsoEntregaPropria(candidata);
    const hojeBloqueado = diferenca === 0 && bloquearHoje;

    if (
      diasAtendidos.includes(candidata.diaDaSemana) &&
      !hojeBloqueado &&
      !bloqueios.has(iso)
    ) {
      return { data: candidata, dataIso: iso, diferencaEmDias: diferenca };
    }
  }

  return null;
}
