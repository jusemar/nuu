import { z } from "zod";

export const TIMEZONE_ADMINISTRATIVO_ATENDIMENTO_IA = "America/Sao_Paulo";

export const filtroPeriodoMetricasSchema = z
  .object({
    ate: z.coerce.date().optional(),
    desde: z.coerce.date().optional(),
    periodo: z
      .enum(["hoje", "7d", "30d", "90d", "personalizado"])
      .default("30d"),
  })
  .strict()
  .superRefine((dados, contexto) => {
    if (dados.periodo === "personalizado" && (!dados.desde || !dados.ate)) {
      contexto.addIssue({
        code: "custom",
        message: "Informe início e fim.",
        path: ["desde"],
      });
    }
    if (dados.desde && dados.ate && dados.ate <= dados.desde) {
      contexto.addIssue({
        code: "custom",
        message: "O fim deve ser posterior ao início.",
        path: ["ate"],
      });
    }
    if (
      dados.desde &&
      dados.ate &&
      dados.ate.getTime() - dados.desde.getTime() > 366 * 86_400_000
    ) {
      contexto.addIssue({
        code: "custom",
        message: "O período máximo é de 366 dias.",
        path: ["ate"],
      });
    }
  });

export function resolverPeriodoMetricas(entrada: unknown, agora = new Date()) {
  const dados = filtroPeriodoMetricasSchema.parse(entrada);
  if (dados.periodo === "personalizado") {
    return {
      ate: dados.ate!,
      desde: dados.desde!,
      rotulo: "Intervalo personalizado",
      timezone: TIMEZONE_ADMINISTRATIVO_ATENDIMENTO_IA,
    } as const;
  }
  // O deslocamento administrativo é explícito; os limites são persistidos em UTC.
  const partes = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIMEZONE_ADMINISTRATIVO_ATENDIMENTO_IA,
  }).formatToParts(agora);
  const valor = (tipo: string) =>
    Number(partes.find((p) => p.type === tipo)?.value);
  const inicioHoje = new Date(
    Date.UTC(valor("year"), valor("month") - 1, valor("day"), 3),
  );
  const dias =
    dados.periodo === "hoje" ? 0 : Number(dados.periodo.slice(0, -1)) - 1;
  const desde = new Date(inicioHoje.getTime() - dias * 86_400_000);
  const ate = new Date(inicioHoje.getTime() + 86_400_000);
  const rotulos = {
    hoje: "Hoje",
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    "90d": "Últimos 90 dias",
  } as const;
  return {
    ate,
    desde,
    rotulo: rotulos[dados.periodo],
    timezone: TIMEZONE_ADMINISTRATIVO_ATENDIMENTO_IA,
  } as const;
}
