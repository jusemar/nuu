import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { executarDryRunRetencao } from "../../../actions/retencao/executar-dry-run-retencao";
import type {
  DistribuicaoMetrica,
  MetricaAdministrativa,
  PainelMetricasAdmin,
} from "../../../types/admin/metricas";
import { EstruturaPaginaTreinamento } from "../compartilhados/estrutura-pagina-treinamento";

const ROTULOS: Record<string, string> = {
  avaliacoes_total: "Avaliações",
  buscas_rag: "Buscas RAG",
  custo_laboratorio: "Custo do laboratório",
  custo_persistido: "Custo persistido",
  duracao_media: "Duração média",
  duracao_media_laboratorio: "Duração média",
  duracao_p50: "Duração p50",
  duracao_p95: "Duração p95",
  duracao_p99: "Duração p99",
  execucoes_laboratorio_total: "Execuções",
  execucoes_total: "Execuções públicas",
  falhas_total: "Falhas",
  fallback: "Uso de fallback",
  limites_uso: "Limites de uso",
  mensagens_total: "Mensagens",
  nota_media: "Nota média",
  ocorrencias_total: "Ocorrências",
  publicacoes_concluidas: "Publicações concluídas",
  publicacoes_total: "Publicações",
  publicacoes_utilizadas: "Publicações consumidas",
  restauracoes: "Restaurações",
  taxa_erro: "Taxa de erro",
  tempo_medio_revisao: "Tempo médio de revisão",
  tokens_entrada: "Tokens de entrada",
  tokens_entrada_laboratorio: "Tokens de entrada",
  tokens_saida: "Tokens de saída",
  tokens_saida_laboratorio: "Tokens de saída",
  transferencias_humanas: "Transferências humanas",
  versoes_administrativas_consumidas: "Versões administrativas consumidas",
  conversas_total: "Conversas",
  alertas_nao_bloqueadores: "Alertas não bloqueadores",
  auditorias_relevantes: "Auditorias relevantes",
  fora_escopo: "Fora do escopo",
};

function formatarValor(metrica: MetricaAdministrativa) {
  if (metrica.status === "indisponivel") return "Indisponível";
  if (metrica.valor === null) return "Sem dados";
  if (metrica.unidade === "percentual")
    return `${metrica.valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
  if (metrica.unidade === "milissegundos")
    return `${Math.round(metrica.valor).toLocaleString("pt-BR")} ms`;
  if (metrica.unidade === "micros")
    return `${metrica.valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} micros`;
  return metrica.valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function CartaoMetrica({ metrica }: { metrica: MetricaAdministrativa }) {
  return (
    <Card className="py-4">
      <CardContent className="px-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {ROTULOS[metrica.chave] ?? metrica.chave.replaceAll("_", " ")}
          </p>
          <Badge variant="outline">{metrica.status}</Badge>
        </div>
        <p className="mt-2 text-2xl font-bold">{formatarValor(metrica)}</p>
        <p className="text-muted-foreground mt-2 text-xs">
          Fonte: {metrica.fonte} ·{" "}
          {metrica.quantidadeRegistros.toLocaleString("pt-BR")} registros
        </p>
      </CardContent>
    </Card>
  );
}

function Distribuicao({ dados }: { dados: DistribuicaoMetrica }) {
  const maior = Math.max(1, ...dados.itens.map((item) => item.total));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {dados.chave.replaceAll("_", " ")}
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          Fonte: {dados.fonte} ·{" "}
          {dados.quantidadeRegistros.toLocaleString("pt-BR")} registros ·{" "}
          {dados.status}
        </p>
      </CardHeader>
      <CardContent>
        {dados.itens.length ? (
          <ul className="space-y-3">
            {dados.itens.map((item) => (
              <li key={item.nome}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span>{item.nome.replaceAll("_", " ")}</span>
                  <strong>{item.total.toLocaleString("pt-BR")}</strong>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{
                      width: `${Math.max(2, (item.total / maior) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nenhum registro no período.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Secao({
  titulo,
  descricao,
  indicadores,
  distribuicoes,
}: {
  titulo: string;
  descricao: string;
  indicadores: MetricaAdministrativa[];
  distribuicoes: DistribuicaoMetrica[];
}) {
  return (
    <section className="scroll-mt-24 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{titulo}</h2>
        <p className="text-muted-foreground text-sm">{descricao}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((item) => (
          <CartaoMetrica key={item.chave} metrica={item} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {distribuicoes.map((item) => (
          <Distribuicao key={item.chave} dados={item} />
        ))}
      </div>
    </section>
  );
}

export function PaginaMetricas({
  metricas,
  periodoSelecionado,
}: {
  metricas: PainelMetricasAdmin;
  periodoSelecionado: string;
}) {
  const vencidos = metricas.retencao.itens.reduce(
    (soma, item) => soma + item.elegiveis,
    0,
  );
  return (
    <EstruturaPaginaTreinamento
      titulo="Métricas, observabilidade e retenção"
      descricao="Agregados reais persistidos, com fonte, período e disponibilidade explícitos."
    >
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm">
              Período
              <select
                name="periodo"
                defaultValue={periodoSelecionado}
                className="border-input bg-background h-9 rounded-md border px-3"
              >
                <option value="hoje">Hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Início
              <input
                name="desde"
                type="date"
                className="border-input bg-background h-9 rounded-md border px-3"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Fim
              <input
                name="ate"
                type="date"
                className="border-input bg-background h-9 rounded-md border px-3"
              />
            </label>
            <button className="bg-primary text-primary-foreground h-9 rounded-md px-4 text-sm font-medium">
              Aplicar
            </button>
          </form>
          <div className="text-muted-foreground text-xs lg:text-right">
            <p>
              {metricas.periodo.rotulo} · {metricas.periodo.timezone}
            </p>
            <p>
              {metricas.periodo.desde.toLocaleString("pt-BR", {
                timeZone: metricas.periodo.timezone,
              })}{" "}
              —{" "}
              {metricas.periodo.ate.toLocaleString("pt-BR", {
                timeZone: metricas.periodo.timezone,
              })}
            </p>
            <p>
              Atualizado em{" "}
              {metricas.atualizadoEm.toLocaleString("pt-BR", {
                timeZone: metricas.periodo.timezone,
              })}
            </p>
          </div>
        </CardContent>
      </Card>
      <nav className="flex flex-wrap gap-2">
        {[
          "Visão geral",
          "Atendimento",
          "Treinamento",
          "Laboratório",
          "Publicações",
          "Qualidade",
          "Saúde dos dados",
          "Retenção",
        ].map((item) => (
          <Badge key={item} variant="secondary">
            {item}
          </Badge>
        ))}
      </nav>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Visão geral</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardContent className="flex gap-3 p-5">
              <Database className="text-primary size-5" />
              <div>
                <p className="font-medium">Período aplicado</p>
                <p className="text-muted-foreground text-sm">
                  {metricas.periodo.rotulo}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex gap-3 p-5">
              {metricas.saude.status === "saudavel" ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="size-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium">Saúde dos dados</p>
                <p className="text-muted-foreground text-sm">
                  {metricas.saude.status} · {metricas.saude.alertas.length}{" "}
                  alertas
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex gap-3 p-5">
              <ShieldCheck className="size-5 text-emerald-600" />
              <div>
                <p className="font-medium">Privacidade</p>
                <p className="text-muted-foreground text-sm">
                  Somente agregados; sem conteúdo ou PII.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Secao
        titulo="Atendimento"
        descricao="Volume, custo, latência, ferramentas, transferências, RAG e falhas públicas."
        {...metricas.atendimento}
      />
      <Secao
        titulo="Treinamento"
        descricao="Conhecimentos, FAQ, comportamento, propostas e revisões."
        {...metricas.treinamento}
      />
      <Secao
        titulo="Laboratório"
        descricao="Execuções isoladas, resultados, candidatos e violações."
        {...metricas.laboratorio}
      />
      <Secao
        titulo="Publicações"
        descricao="Publicações, bloqueios, alertas e restaurações auditadas."
        {...metricas.publicacoes}
      />
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Qualidade e séries temporais</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {metricas.series.map((serie) => (
            <Card key={serie.chave}>
              <CardHeader>
                <CardTitle className="text-base">
                  {serie.chave.replaceAll("_", " ")}
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  Fonte: {serie.fonte} · {serie.quantidadeRegistros} registros ·{" "}
                  {serie.status}
                </p>
              </CardHeader>
              <CardContent>
                {serie.pontos.length ? (
                  <div
                    className="flex h-32 items-end gap-1"
                    aria-label={serie.chave}
                  >
                    {serie.pontos.map((ponto) => (
                      <div
                        key={ponto.periodo}
                        title={`${ponto.periodo}: ${ponto.total}`}
                        className="bg-primary min-h-1 flex-1 rounded-t"
                        style={{
                          height: `${Math.max(3, (ponto.total / Math.max(1, ...serie.pontos.map((p) => p.total))) * 100)}%`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nenhum registro no período.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Saúde dos dados</h2>
        {metricas.saude.alertas.length ? (
          <div className="space-y-2">
            {metricas.saude.alertas.map((alerta) => (
              <div key={alerta.codigo} className="rounded-lg border p-4">
                <div className="flex gap-2">
                  <Badge
                    variant={
                      alerta.severidade === "critico"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {alerta.severidade}
                  </Badge>
                  <strong>{alerta.codigo.replaceAll("_", " ")}</strong>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  {alerta.descricao} Fonte: {alerta.fonte}.
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm">
            Nenhum alerta operacional detectado nas fontes disponíveis.
          </p>
        )}
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Retenção</h2>
          <p className="text-muted-foreground text-sm">
            Relatório dry-run: nenhuma exclusão física é executada.
          </p>
          {metricas.retencao.itens.length ? (
            <form action={executarDryRunRetencao} className="mt-3">
              <button className="border-input bg-background h-9 rounded-md border px-4 text-sm font-medium">
                Executar dry-run auditado
              </button>
            </form>
          ) : null}
        </div>
        {metricas.retencao.itens.length ? (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-2xl text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Fonte</th>
                    <th className="p-3">Classe</th>
                    <th className="p-3">Elegíveis</th>
                    <th className="p-3">Próximos 30 dias</th>
                    <th className="p-3">Protegidos</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.retencao.itens.map((item) => (
                    <tr key={item.fonte} className="border-b last:border-0">
                      <td className="p-3">{item.fonte}</td>
                      <td className="p-3">
                        {item.classe.replaceAll("_", " ")}
                      </td>
                      <td className="p-3">{item.elegiveis}</td>
                      <td className="p-3">{item.vencemEm30Dias}</td>
                      <td className="p-3">{item.protegidos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm">
            Relatório de retenção restrito ao Gestor principal.
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          Dry-run em{" "}
          {metricas.retencao.executadoEm.toLocaleString("pt-BR", {
            timeZone: metricas.periodo.timezone,
          })}
          : {vencidos} elegíveis; {metricas.retencao.registrosExcluidos}{" "}
          excluídos.
        </p>
      </section>
    </EstruturaPaginaTreinamento>
  );
}
