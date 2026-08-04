import { PaginaMetricas } from "@/features/atendimento-ia/components/admin/metricas/pagina-metricas";
import { buscarResumoMetricas } from "@/features/atendimento-ia/queries/admin/metricas/buscar-resumo-metricas";
import { exigirCapacidadeAtendimentoIa } from "@/features/atendimento-ia/queries/admin/permissoes/buscar-acesso-atendimento-ia";
import {
  filtroPeriodoMetricasSchema,
  resolverPeriodoMetricas,
} from "@/features/atendimento-ia/schemas/admin/metricas.schema";

export default async function MetricasAtendenteIaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigirCapacidadeAtendimentoIa("metricas_leitura");
  const parametros = await searchParams;
  const valor = (chave: string) =>
    typeof parametros[chave] === "string" ? parametros[chave] : undefined;
  const periodoSolicitado = valor("periodo") ?? "30d";
  const desde = valor("desde");
  const ate = valor("ate");
  const fimInclusivo = ate ? new Date(`${ate}T00:00:00-03:00`) : undefined;
  if (fimInclusivo) fimInclusivo.setUTCDate(fimInclusivo.getUTCDate() + 1);
  const entradaPeriodo = {
    periodo: periodoSolicitado,
    desde: desde ? new Date(`${desde}T00:00:00-03:00`) : undefined,
    ate: fimInclusivo,
  };
  const periodoValido = filtroPeriodoMetricasSchema.safeParse(entradaPeriodo);
  const periodoSelecionado = periodoValido.success
    ? periodoValido.data.periodo
    : "30d";
  const periodo = resolverPeriodoMetricas(
    periodoValido.success ? entradaPeriodo : { periodo: "30d" },
  );
  const metricas = await buscarResumoMetricas(periodo);
  return (
    <PaginaMetricas
      metricas={metricas}
      periodoSelecionado={periodoSelecionado}
    />
  );
}
