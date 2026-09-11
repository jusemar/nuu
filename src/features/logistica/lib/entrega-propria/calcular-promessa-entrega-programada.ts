import {
  type AgendaEntregaPropria,
  type PromessaEntregaPropria,
  TIMEZONE_ENTREGA_PROPRIA,
} from "./calcular-promessa-entrega-propria";
import {
  avancarJanelasAtendidas,
  normalizarDiasAtendidos,
  obterPartesDataEntregaPropria,
} from "./calendario-entrega-propria";

export type PromessaEntregaProgramada = {
  dataPrometida: string;
  texto: string;
  quantidadeJanelasAposRapida: number;
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
 * Avança janelas válidas a partir da promessa rápida já calculada. O horário
 * de corte participa somente da rápida e não é reaplicado na programada.
 */
export function calcularPromessaEntregaProgramada({
  agenda,
  promessaRapida,
  quantidadeJanelasAposRapida,
  dataReferencia = new Date(),
  datasBloqueadas = [],
}: {
  agenda: AgendaEntregaPropria | null | undefined;
  promessaRapida: PromessaEntregaPropria | null | undefined;
  quantidadeJanelasAposRapida: number;
  dataReferencia?: Date;
  datasBloqueadas?: string[];
}): PromessaEntregaProgramada | null {
  const dias = normalizarDiasAtendidos(agenda?.diasDaSemana ?? []);
  const quantidadeJanelas = Math.max(
    0,
    Math.trunc(quantidadeJanelasAposRapida),
  );

  if (!agenda?.ativa || dias.length === 0 || !promessaRapida) return null;

  const hoje = obterPartesDataEntregaPropria(dataReferencia);
  const candidata = avancarJanelasAtendidas({
    dataBaseIso: promessaRapida.dataPrometida,
    quantidadeJanelas,
    diasAtendidos: dias,
    datasBloqueadas,
  });
  if (candidata) {
    const dataUtc = new Date(
      Date.UTC(candidata.data.ano, candidata.data.mes - 1, candidata.data.dia),
    );
    const hojeUtc = Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia);
    const diferencaEmDias = Math.round(
      (dataUtc.getTime() - hojeUtc) / 86_400_000,
    );
    return {
      dataPrometida: candidata.dataIso,
      texto: formatarTexto(diferencaEmDias, dataUtc),
      quantidadeJanelasAposRapida: quantidadeJanelas,
      diasConfigurados: dias,
      timezone: TIMEZONE_ENTREGA_PROPRIA,
      calculadoEm: dataReferencia.toISOString(),
    };
  }

  return null;
}
