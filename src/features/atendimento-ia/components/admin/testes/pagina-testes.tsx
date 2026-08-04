"use client";

import {
  Archive,
  FolderPlus,
  Plus,
  Send,
} from "lucide-react";
import { type ReactNode, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { atualizarRascunhoCasoTeste } from "@/features/atendimento-ia/actions/testes/atualizar-rascunho-caso-teste";
import { criarCasoTeste } from "@/features/atendimento-ia/actions/testes/criar-caso-teste";
import { criarConjuntoTeste } from "@/features/atendimento-ia/actions/testes/criar-conjunto-teste";
import { criarVersaoCasoTeste } from "@/features/atendimento-ia/actions/testes/criar-versao-caso-teste";
import { desativarCasoTeste } from "@/features/atendimento-ia/actions/testes/desativar-caso-teste";
import { enviarCasoTesteRevisao } from "@/features/atendimento-ia/actions/testes/enviar-caso-teste-revisao";
import { removerCasoConjunto } from "@/features/atendimento-ia/actions/testes/remover-caso-conjunto";
import { reordenarCasosConjunto } from "@/features/atendimento-ia/actions/testes/reordenar-casos-conjunto";
import { revisarCasoTeste } from "@/features/atendimento-ia/actions/testes/revisar-caso-teste";
import { vincularCasoConjunto } from "@/features/atendimento-ia/actions/testes/vincular-caso-conjunto";

import { EstruturaPaginaTreinamento } from "../compartilhados/estrutura-pagina-treinamento";

type Caso = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  criticidade: string;
  ativo: boolean;
  historico: Array<{
    id: string;
    numeroVersao: number;
    estado: string;
    hash: string;
  }>;
  versao: null | {
    id: string;
    numeroVersao: number;
    estado: string;
    dadosOrigem: string;
    entradaControlada: Record<string, unknown>;
    contextoSimulado: Record<string, unknown>;
    expectativas: Record<string, unknown>;
    ferramentasPermitidas: string[];
    ferramentasProibidas: string[];
    efeitosEsperados: string;
    criterios: string[];
    justificativaSnapshot: string | null;
    atualizadoEm: string;
    hash: string;
  };
};
type Conjunto = {
  id: string;
  nome: string;
  descricao: string;
  finalidade: string;
  criticidadeMinima: string;
  casos: Array<{
    id: string;
    ordem: number;
    obrigatorio: boolean;
    bloqueiaPublicacao: boolean;
  }>;
};

function conteudoPadrao(pergunta: string, criterio: string) {
  return {
    entradaControlada: { perguntaCliente: pergunta, historicoFicticio: [] },
    contextoSimulado: {},
    expectativas: {
      assuntoEsperado: "Atendimento controlado",
      comportamentoEsperado: criterio,
      necessitaFonte: false,
      necessitaFerramenta: false,
      ferramentaEsperada: null,
      necessitaTransferencia: false,
      respostaExataObrigatoria: false as const,
    },
    ferramentasPermitidas: [],
    ferramentasProibidas: [],
    efeitosEsperados: "nenhum" as const,
    criterios: [criterio],
    dadosOrigem: "ficticio" as const,
    justificativaSnapshot: null,
    autorizacaoSnapshotConfirmada: false,
  };
}

export function PaginaTestes({
  casos,
  conjuntos,
  podeEditar,
  laboratorio,
}: {
  casos: Caso[];
  conjuntos: Conjunto[];
  podeEditar: boolean;
  laboratorio: ReactNode;
}) {
  const [pendente, iniciar] = useTransition();
  const executar = (acao: () => Promise<unknown>) =>
    iniciar(() => {
      void acao().catch((erro) =>
        window.alert(
          erro instanceof Error ? erro.message : "Operação não concluída",
        ),
      );
    });
  const criar = () => {
    const nome = window.prompt("Nome do caso");
    const pergunta = window.prompt("Pergunta fictícia do cliente");
    const criterio = window.prompt("Critério objetivo esperado");
    if (nome && pergunta && criterio)
      executar(() =>
        criarCasoTeste({
          nome,
          descricao: `Caso controlado: ${nome}`,
          categoria: "conhecimento",
          criticidade: "media",
          conteudo: conteudoPadrao(pergunta, criterio),
        }),
      );
  };
  const criarConjunto = () => {
    const nome = window.prompt("Nome do conjunto de regressão");
    if (nome)
      executar(() =>
        criarConjuntoTeste({
          nome,
          descricao: `Conjunto controlado: ${nome}`,
          finalidade: "Regressão administrativa futura",
          criticidadeMinima: "media",
        }),
      );
  };
  const editar = (caso: Caso) => {
    const versao = caso.versao;
    if (!versao) return;
    const criterio = window.prompt(
      "Novo critério objetivo",
      versao.criterios[0],
    );
    if (!criterio) return;
    executar(() =>
      atualizarRascunhoCasoTeste({
        versaoId: versao.id,
        atualizadoEmEsperado: versao.atualizadoEm,
        conteudo: {
          entradaControlada: versao.entradaControlada,
          contextoSimulado: versao.contextoSimulado,
          expectativas: versao.expectativas,
          ferramentasPermitidas: versao.ferramentasPermitidas,
          ferramentasProibidas: versao.ferramentasProibidas,
          efeitosEsperados: "nenhum",
          criterios: [criterio],
          dadosOrigem: versao.dadosOrigem,
          justificativaSnapshot: versao.justificativaSnapshot,
          autorizacaoSnapshotConfirmada:
            versao.dadosOrigem === "snapshot_anonimizado",
        },
      }),
    );
  };
  return (
    <EstruturaPaginaTreinamento
      titulo="Casos e conjuntos de teste"
      descricao="Base versionada com dados controlados para o laboratório futuro."
    >
      {laboratorio}
      {podeEditar && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={criar} disabled={pendente}>
            <Plus />
            Criar caso
          </Button>
          <Button variant="outline" onClick={criarConjunto} disabled={pendente}>
            <FolderPlus />
            Criar conjunto
          </Button>
        </div>
      )}
      <section className="space-y-3" aria-labelledby="casos">
        <h2 id="casos" className="text-lg font-semibold">
          Casos reais cadastrados
        </h2>
        {casos.length === 0 && (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center">
              Nenhum caso cadastrado.
            </CardContent>
          </Card>
        )}
        {casos.map((caso) => (
          <Card key={caso.id}>
            <CardHeader>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <CardTitle>{caso.nome}</CardTitle>
                  <CardDescription>{caso.descricao}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{caso.categoria}</Badge>
                  <Badge
                    variant={
                      caso.criticidade === "critica"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {caso.criticidade}
                  </Badge>
                  <Badge variant="outline">
                    {caso.versao?.dadosOrigem === "snapshot_anonimizado"
                      ? "Snapshot anonimizado"
                      : "Dados fictícios"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                Versão {caso.versao?.numeroVersao ?? "—"} ·{" "}
                {caso.versao?.estado ?? "sem versão"}
              </p>
              {caso.versao && (
                <>
                  <p className="rounded-lg border p-3 text-sm">
                    <strong>Entrada:</strong>{" "}
                    {String(
                      caso.versao.entradaControlada.perguntaCliente ?? "",
                    )}
                  </p>
                  <div>
                    <strong className="text-sm">Critérios objetivos</strong>
                    <ul className="text-muted-foreground text-sm">
                      {caso.versao.criterios.map((c) => (
                        <li key={c}>• {c}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              <details className="rounded-lg border p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  Histórico e comparação de versões
                </summary>
                <ul className="text-muted-foreground mt-2 text-sm">
                  {caso.historico.map((versao, indice) => (
                    <li key={versao.id}>
                      v{versao.numeroVersao} · {versao.estado} · hash{" "}
                      {versao.hash.slice(0, 12)}
                      {indice === 0 ? " · candidata atual" : ""}
                    </li>
                  ))}
                </ul>
                {caso.historico.length > 1 && (
                  <p className="text-muted-foreground mt-2 text-xs">
                    Compare os hashes e estados; a consulta detalhada preserva
                    os dois conteúdos sem sobrescrever o histórico.
                  </p>
                )}
              </details>
              {podeEditar && caso.versao && (
                <div className="flex flex-wrap gap-2">
                  {caso.versao.estado === "rascunho" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editar(caso)}
                      >
                        Editar rascunho
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          executar(() =>
                            enviarCasoTesteRevisao({
                              versaoId: caso.versao!.id,
                              atualizadoEmEsperado: caso.versao!.atualizadoEm,
                            }),
                          )
                        }
                      >
                        <Send />
                        Enviar à revisão
                      </Button>
                    </>
                  )}
                  {caso.versao.estado === "em_revisao" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          executar(() =>
                            revisarCasoTeste({
                              versaoId: caso.versao!.id,
                              atualizadoEmEsperado: caso.versao!.atualizadoEm,
                              decisao: "aprovada",
                              motivo: null,
                            }),
                          )
                        }
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          executar(() =>
                            revisarCasoTeste({
                              versaoId: caso.versao!.id,
                              atualizadoEmEsperado: caso.versao!.atualizadoEm,
                              decisao: "reprovada",
                              motivo: "Requer ajustes antes da aprovação.",
                            }),
                          )
                        }
                      >
                        Reprovar
                      </Button>
                    </>
                  )}{" "}
                  {caso.versao.estado !== "rascunho" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        executar(() =>
                          criarVersaoCasoTeste({
                            casoTesteId: caso.id,
                            conteudo: {
                              entradaControlada: caso.versao!.entradaControlada,
                              contextoSimulado: caso.versao!.contextoSimulado,
                              expectativas: caso.versao!.expectativas,
                              ferramentasPermitidas:
                                caso.versao!.ferramentasPermitidas,
                              ferramentasProibidas:
                                caso.versao!.ferramentasProibidas,
                              efeitosEsperados: "nenhum",
                              criterios: caso.versao!.criterios,
                              dadosOrigem: caso.versao!.dadosOrigem,
                              justificativaSnapshot:
                                caso.versao!.justificativaSnapshot,
                              autorizacaoSnapshotConfirmada:
                                caso.versao!.dadosOrigem ===
                                "snapshot_anonimizado",
                            },
                          }),
                        )
                      }
                    >
                      Nova versão
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      executar(() =>
                        desativarCasoTeste({ casoTesteId: caso.id }),
                      )
                    }
                  >
                    <Archive />
                    Desativar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="space-y-3" aria-labelledby="conjuntos">
        <h2 id="conjuntos" className="text-lg font-semibold">
          Conjuntos de regressão
        </h2>
        {conjuntos.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum conjunto cadastrado.
          </p>
        ) : (
          conjuntos.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.nome}</CardTitle>
                <CardDescription>{c.finalidade}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  {c.casos.length} caso(s), em ordem determinística ·
                  criticidade mínima {c.criticidadeMinima}
                </p>
                {podeEditar && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const disponiveis = casos.filter((item) => item.versao);
                        const escolhido = window.prompt(
                          `Informe o nome do caso:\n${disponiveis.map((item) => item.nome).join("\n")}`,
                        );
                        const caso = disponiveis.find(
                          (item) => item.nome === escolhido,
                        );
                        if (caso?.versao)
                          executar(() =>
                            vincularCasoConjunto({
                              conjuntoTesteId: c.id,
                              casoTesteVersaoId: caso.versao!.id,
                              obrigatorio: window.confirm("Caso obrigatório?"),
                              bloqueiaPublicacao: window.confirm(
                                "Marcar bloqueio futuro de publicação?",
                              ),
                            }),
                          );
                      }}
                    >
                      Adicionar caso
                    </Button>
                    {c.casos.length > 0 && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            executar(() =>
                              reordenarCasosConjunto({
                                conjuntoTesteId: c.id,
                                vinculosOrdenados: c.casos
                                  .map((v) => v.id)
                                  .reverse(),
                              }),
                            )
                          }
                        >
                          Inverter ordem
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            executar(() =>
                              removerCasoConjunto({
                                vinculoId: c.casos.at(-1)!.id,
                              }),
                            )
                          }
                        >
                          Remover último
                        </Button>
                      </>
                    )}
                  </div>
                )}
                {c.casos.length > 0 && (
                  <ol className="text-muted-foreground text-sm">
                    {c.casos.map((vinculo) => (
                      <li key={vinculo.id}>
                        {vinculo.ordem}.{" "}
                        {vinculo.obrigatorio ? "obrigatório" : "opcional"}
                        {vinculo.bloqueiaPublicacao ? " · bloqueio futuro" : ""}
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </EstruturaPaginaTreinamento>
  );
}
