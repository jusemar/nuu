import {
  buscarProximaDataAtendida,
  normalizarDiasAtendidos,
  obterPartesDataEntregaPropria,
  TIMEZONE_ENTREGA_PROPRIA,
} from "./calendario-entrega-propria";

export { TIMEZONE_ENTREGA_PROPRIA } from "./calendario-entrega-propria";

export type AgendaEntregaPropria = {
  ativa: boolean;
  diasDaSemana: number[];
  horarioCorte: string | null;
  periodoInicio?: string | null;
  periodoFim?: string | null;
};

export type PromessaEntregaPropria = {
  dataPrometida: string;
  texto: string;
  observacaoPagamento: string | null;
  diasConfigurados: number[];
  horarioCorteAplicado: string;
  periodoEntrega: { inicio: string; fim: string } | null;
  timezone: typeof TIMEZONE_ENTREGA_PROPRIA;
  calculadoEm: string;
  feriadosConsiderados: boolean;
};

function horarioValido(valor: string | null | undefined) {
  return Boolean(valor && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor));
}

function minutosDoHorario(valor: string) {
  const [hora, minuto] = valor.split(":").map(Number);
  return hora * 60 + minuto;
}

function formatarTextoPromessa(
  diferencaEmDias: number,
  data: { diaDaSemana: number },
) {
  if (diferencaEmDias === 0) return "Entrega hoje";
  if (diferencaEmDias === 1) return "Entrega amanhã";

  const nomes = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];
  return `Entrega ${nomes[data.diaDaSemana]}`;
}

export function calcularPromessaEntregaPropria({
  agenda,
  dataReferencia = new Date(),
  feriados = [],
}: {
  agenda: AgendaEntregaPropria | null | undefined;
  dataReferencia?: Date;
  feriados?: string[];
}): PromessaEntregaPropria | null {
  const dias = normalizarDiasAtendidos(agenda?.diasDaSemana ?? []);

  if (
    !agenda?.ativa ||
    dias.length === 0 ||
    !horarioValido(agenda.horarioCorte)
  ) {
    return null;
  }

  const local = obterPartesDataEntregaPropria(dataReferencia);
  const minutosAtuais = local.hora * 60 + local.minuto;
  const minutosCorte = minutosDoHorario(agenda.horarioCorte!);
  const candidata = buscarProximaDataAtendida({
    dataInicial: local,
    diferencaInicial: 0,
    diasAtendidos: dias,
    datasBloqueadas: feriados,
    bloquearHoje: minutosAtuais >= minutosCorte,
  });

  if (candidata) {
    return {
      dataPrometida: candidata.dataIso,
      texto: formatarTextoPromessa(candidata.diferencaEmDias, candidata.data),
      observacaoPagamento:
        candidata.diferencaEmDias === 0
          ? `Para pedidos com pagamento aprovado até ${agenda.horarioCorte}.`
          : null,
      diasConfigurados: dias,
      horarioCorteAplicado: agenda.horarioCorte!,
      periodoEntrega:
        horarioValido(agenda.periodoInicio) && horarioValido(agenda.periodoFim)
          ? {
              inicio: agenda.periodoInicio!,
              fim: agenda.periodoFim!,
            }
          : null,
      timezone: TIMEZONE_ENTREGA_PROPRIA,
      calculadoEm: dataReferencia.toISOString(),
      feriadosConsiderados: feriados.length > 0,
    };
  }

  return null;
}
