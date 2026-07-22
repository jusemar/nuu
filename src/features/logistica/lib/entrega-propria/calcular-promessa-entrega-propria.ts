export const TIMEZONE_ENTREGA_PROPRIA = "America/Sao_Paulo";

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

type PartesDataLocal = {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
};

function obterPartesNoTimezone(data: Date): PartesDataLocal {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_ENTREGA_PROPRIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value ?? 0);

  return {
    ano: valor("year"),
    mes: valor("month"),
    dia: valor("day"),
    hora: valor("hour"),
    minuto: valor("minute"),
  };
}

function dataIso(ano: number, mes: number, dia: number) {
  return `${ano.toString().padStart(4, "0")}-${mes
    .toString()
    .padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;
}

function adicionarDias(
  data: Pick<PartesDataLocal, "ano" | "mes" | "dia">,
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
  const dias = [...new Set(agenda?.diasDaSemana ?? [])]
    .filter((dia) => Number.isInteger(dia) && dia >= 0 && dia <= 6)
    .sort((a, b) => a - b);

  if (
    !agenda?.ativa ||
    dias.length === 0 ||
    !horarioValido(agenda.horarioCorte)
  ) {
    return null;
  }

  const local = obterPartesNoTimezone(dataReferencia);
  const minutosAtuais = local.hora * 60 + local.minuto;
  const minutosCorte = minutosDoHorario(agenda.horarioCorte!);
  const feriadosConfigurados = new Set(feriados);

  for (let diferenca = 0; diferenca <= 14; diferenca += 1) {
    const candidata = adicionarDias(local, diferenca);
    const iso = dataIso(candidata.ano, candidata.mes, candidata.dia);
    const atendida = dias.includes(candidata.diaDaSemana);
    const passouDoCorteHoje = diferenca === 0 && minutosAtuais >= minutosCorte;

    if (atendida && !passouDoCorteHoje && !feriadosConfigurados.has(iso)) {
      return {
        dataPrometida: iso,
        texto: formatarTextoPromessa(diferenca, candidata),
        observacaoPagamento:
          diferenca === 0
            ? `Para pedidos com pagamento aprovado até ${agenda.horarioCorte}.`
            : null,
        diasConfigurados: dias,
        horarioCorteAplicado: agenda.horarioCorte!,
        periodoEntrega:
          horarioValido(agenda.periodoInicio) &&
          horarioValido(agenda.periodoFim)
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
  }

  return null;
}
