import {
  type AgendaEntregaPropria,
  TIMEZONE_ENTREGA_PROPRIA,
} from "./calcular-promessa-entrega-propria";
import {
  buscarProximaDataAtendida,
  normalizarDiasAtendidos,
  obterPartesDataEntregaPropria,
} from "./calendario-entrega-propria";

export type PromessaEntregaProgramada = {
  dataPrometida: string;
  texto: string;
  prazoMinimoEmDiasCorridos: number;
  diasConfigurados: number[];
  timezone: typeof TIMEZONE_ENTREGA_PROPRIA;
  calculadoEm: string;
};

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
  datasBloqueadas = [],
}: {
  agenda: AgendaEntregaPropria | null | undefined;
  prazoMinimoEmDiasCorridos: number;
  dataReferencia?: Date;
  datasBloqueadas?: string[];
}): PromessaEntregaProgramada | null {
  const dias = normalizarDiasAtendidos(agenda?.diasDaSemana ?? []);
  const prazo = Math.max(0, Math.trunc(prazoMinimoEmDiasCorridos));

  if (!agenda?.ativa || dias.length === 0) return null;

  const hoje = obterPartesDataEntregaPropria(dataReferencia);
  const candidata = buscarProximaDataAtendida({
    dataInicial: hoje,
    diferencaInicial: prazo,
    diasAtendidos: dias,
    datasBloqueadas,
  });
  if (candidata) {
    const dataUtc = new Date(
      Date.UTC(candidata.data.ano, candidata.data.mes - 1, candidata.data.dia),
    );
    return {
      dataPrometida: candidata.dataIso,
      texto: formatarTexto(candidata.diferencaEmDias, dataUtc),
      prazoMinimoEmDiasCorridos: prazo,
      diasConfigurados: dias,
      timezone: TIMEZONE_ENTREGA_PROPRIA,
      calculadoEm: dataReferencia.toISOString(),
    };
  }

  return null;
}
