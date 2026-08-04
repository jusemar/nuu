"use client";
import { FlaskConical, RotateCcw, ShieldCheck, Square } from "lucide-react";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { publicarLoteConhecimentos } from "../../../actions/conhecimento/publicar-lote-conhecimentos";
import { avaliarResultadoLaboratorio } from "../../../actions/testes/avaliar-resultado-laboratorio";
import { cancelarRegressao } from "../../../actions/testes/cancelar-regressao";
import { executarTesteIndividual } from "../../../actions/testes/executar-teste-individual";
import { iniciarRegressao } from "../../../actions/testes/iniciar-regressao";
import { retomarRegressao } from "../../../actions/testes/retomar-regressao";
type Opcao = { id: string; nome: string };
type Execucao = {
  id: string;
  status: string;
  modoExecucao: string;
  tipoComparacao: string;
  criadoEm: string;
  erroSanitizado: string | null;
};
type Resultado = {
  id: string;
  execucaoLaboratorioId: string;
  respostaPublicada: string;
  respostaCandidata: string;
  conhecimentosUsadosPublicada: string[];
  conhecimentosUsadosCandidata: string[];
  conflitos: string[];
  fontesAusentes: string[];
  ferramentasSimuladas: string[];
  necessidadeConsultaReal: boolean;
  violacoes: string[];
  resultadoAutomatico: string;
  decisaoHumana: string | null;
  tokens: number;
  duracao: number;
  atualizadoEm: string;
};
export function PainelLaboratorio({
  casos,
  conjuntos,
  conhecimentos,
  comportamentos,
  execucoes,
  resultados,
  podeExecutar,
  podeAvaliar,
  podePublicar,
  elegibilidades,
}: {
  casos: Opcao[];
  conjuntos: Opcao[];
  conhecimentos: Opcao[];
  comportamentos: Opcao[];
  execucoes: Execucao[];
  resultados: Resultado[];
  podeExecutar: boolean;
  podeAvaliar: boolean;
  podePublicar: boolean;
  elegibilidades: Record<
    string,
    {
      status: string;
      bloqueios: string[];
      alertas: string[];
      hash: string;
    } | null
  >;
}) {
  const [caso, setCaso] = useState(casos[0]?.id ?? "");
  const [conjunto, setConjunto] = useState("");
  const [tipo, setTipo] = useState("conhecimento");
  const [conhecimento, setConhecimento] = useState(conhecimentos[0]?.id ?? "");
  const [comportamento, setComportamento] = useState(
    comportamentos[0]?.id ?? "",
  );
  const [pendente, iniciar] = useTransition();
  const executar = (acao: () => Promise<unknown>) =>
    iniciar(
      () =>
        void acao().catch((e) =>
          window.alert(e instanceof Error ? e.message : "Falha sanitizada"),
        ),
    );
  const entrada = () => ({
    chaveIdempotencia: crypto.randomUUID(),
    tipoComparacao: tipo,
    ...(conjunto ? { conjuntoTesteId: conjunto } : { casoTesteVersaoId: caso }),
    ...(["conhecimento", "combinado", "lote"].includes(tipo)
      ? { versaoCandidataConhecimentoId: conhecimento }
      : {}),
    ...(["comportamento", "combinado", "lote"].includes(tipo)
      ? { versaoCandidataComportamentoId: comportamento }
      : {}),
  });
  return (
    <section className="space-y-4" aria-labelledby="laboratorio">
      <div>
        <h2 id="laboratorio" className="text-lg font-semibold">
          Laboratório isolado
        </h2>
        <p className="text-muted-foreground text-sm">
          Duas gerações estruturadas, sem ferramentas reais e sem acesso ao chat
          público.
        </p>
      </div>
      <div className="border-success/30 bg-success/5 flex gap-3 rounded-xl border p-4">
        <ShieldCheck className="size-5" />
        <p className="text-sm">
          <strong>Efeitos reais estruturalmente indisponíveis.</strong> Dados
          dinâmicos são fictícios ou anonimizados e simulados.
        </p>
      </div>
      {podeExecutar && (
        <Card>
          <CardContent className="grid gap-3 py-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm">
              Caso
              <select
                className="mt-1 w-full rounded-md border p-2"
                value={caso}
                onChange={(e) => {
                  setCaso(e.target.value);
                  setConjunto("");
                }}
              >
                {casos.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Conjunto
              <select
                className="mt-1 w-full rounded-md border p-2"
                value={conjunto}
                onChange={(e) => {
                  setConjunto(e.target.value);
                  if (e.target.value) setCaso("");
                }}
              >
                <option value="">Teste individual</option>
                {conjuntos.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Comparação
              <select
                className="mt-1 w-full rounded-md border p-2"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="conhecimento">Conhecimento</option>
                <option value="comportamento">Comportamento</option>
                <option value="combinado">Combinado</option>
                <option value="lote">Lote</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <Button
                disabled={pendente || (!caso && !conjunto)}
                onClick={() =>
                  executar(() =>
                    conjunto
                      ? iniciarRegressao(entrada())
                      : executarTesteIndividual(entrada()),
                  )
                }
              >
                <FlaskConical />
                Iniciar
              </Button>
            </div>
            {["conhecimento", "combinado", "lote"].includes(tipo) && (
              <label className="text-sm">
                Conhecimento candidato
                <select
                  className="mt-1 w-full rounded-md border p-2"
                  value={conhecimento}
                  onChange={(e) => setConhecimento(e.target.value)}
                >
                  {conhecimentos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {["comportamento", "combinado", "lote"].includes(tipo) && (
              <label className="text-sm">
                Comportamento candidato
                <select
                  className="mt-1 w-full rounded-md border p-2"
                  value={comportamento}
                  onChange={(e) => setComportamento(e.target.value)}
                >
                  {comportamentos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        {execucoes.map((x) => (
          <Card key={x.id}>
            <CardHeader>
              <div className="flex flex-wrap justify-between gap-2">
                <CardTitle className="text-base">
                  {x.tipoComparacao} · {x.modoExecucao}
                </CardTitle>
                <Badge variant="outline">{x.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {x.erroSanitizado && (
                <p className="text-destructive text-sm">{x.erroSanitizado}</p>
              )}
              {elegibilidades[x.id] && (
                <details className="rounded-lg border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Elegibilidade: {elegibilidades[x.id]!.status}
                  </summary>
                  <div className="text-muted-foreground mt-2 text-xs">
                    <p>Hash: {elegibilidades[x.id]!.hash.slice(0, 16)}</p>
                    <p>
                      Bloqueios:{" "}
                      {elegibilidades[x.id]!.bloqueios.join(", ") || "nenhum"}
                    </p>
                    <p>
                      Alertas:{" "}
                      {elegibilidades[x.id]!.alertas.join(", ") || "nenhum"}
                    </p>
                  </div>
                </details>
              )}
              {podePublicar &&
              ["lote", "combinado"].includes(x.tipoComparacao) &&
              elegibilidades[x.id]?.status === "elegivel" ? (
                <Button
                  size="sm"
                  disabled={pendente}
                  onClick={() => {
                    const elegibilidade = elegibilidades[x.id]!;
                    if (
                      !window.confirm(
                        `Publicar o lote completo de forma atômica?\nHash: ${elegibilidade.hash}\nIntegrantes e ordem serão congelados; falha em um item publicará zero itens.`,
                      )
                    )
                      return;
                    const justificativaAlertas =
                      window
                        .prompt(
                          "Justificativa para alertas (vazio se não houver):",
                        )
                        ?.trim() || undefined;
                    executar(() =>
                      publicarLoteConhecimentos({
                        execucaoLaboratorioId: x.id,
                        chaveIdempotencia: `admin:lote:${x.id}:${crypto.randomUUID()}`,
                        justificativaAlertas,
                      }),
                    );
                  }}
                >
                  Publicar lote atômico
                </Button>
              ) : null}
              {podeExecutar &&
                ["pendente", "processando", "falhou"].includes(x.status) && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        executar(() => cancelarRegressao({ execucaoId: x.id }))
                      }
                    >
                      <Square />
                      Cancelar
                    </Button>
                    {["pendente", "falhou"].includes(x.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          executar(() =>
                            retomarRegressao({
                              execucaoId: x.id,
                              chaveIdempotencia: crypto.randomUUID(),
                            }),
                          )
                        }
                      >
                        <RotateCcw />
                        Retomar
                      </Button>
                    )}
                  </div>
                )}
              {resultados
                .filter((r) => r.execucaoLaboratorioId === x.id)
                .map((r) => (
                  <div key={r.id} className="space-y-3 rounded-xl border p-4">
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div>
                        <h3 className="font-semibold">Resposta publicada</h3>
                        <p className="text-muted-foreground mt-2 text-sm">
                          {r.respostaPublicada}
                        </p>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-3">
                        <h3 className="font-semibold">Resposta candidata</h3>
                        <p className="text-muted-foreground mt-2 text-sm">
                          {r.respostaCandidata}
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground grid gap-2 text-xs md:grid-cols-3">
                      <p>
                        Fontes ausentes:{" "}
                        {r.fontesAusentes.join(", ") || "nenhuma"}
                      </p>
                      <p>Conflitos: {r.conflitos.join(", ") || "nenhum"}</p>
                      <p>Violações: {r.violacoes.join(", ") || "nenhuma"}</p>
                      <p>
                        Ferramentas simuladas:{" "}
                        {r.ferramentasSimuladas.join(", ") || "nenhuma"}
                      </p>
                      <p>
                        Consulta real:{" "}
                        {r.necessidadeConsultaReal ? "necessária" : "não"}
                      </p>
                      <p>
                        {r.tokens} tokens · {r.duracao} ms
                      </p>
                    </div>
                    <Badge>{r.decisaoHumana ?? r.resultadoAutomatico}</Badge>
                    {podeAvaliar && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            executar(() =>
                              avaliarResultadoLaboratorio({
                                resultadoId: r.id,
                                decisao: "aprovado",
                                comentario: null,
                                atualizadoEmEsperado: r.atualizadoEm,
                              }),
                            )
                          }
                        >
                          Aprovar avaliação
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            executar(() =>
                              avaliarResultadoLaboratorio({
                                resultadoId: r.id,
                                decisao: "reprovado",
                                comentario: "Resultado requer correção.",
                                atualizadoEmEsperado: r.atualizadoEm,
                              }),
                            )
                          }
                        >
                          Reprovar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
