"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { arquivarComportamento } from "@/features/atendimento-ia/actions/comportamento/arquivar-comportamento";
import { atualizarRascunhoComportamento } from "@/features/atendimento-ia/actions/comportamento/atualizar-rascunho-comportamento";
import { criarComportamento } from "@/features/atendimento-ia/actions/comportamento/criar-comportamento";
import { criarVersaoComportamento } from "@/features/atendimento-ia/actions/comportamento/criar-versao-comportamento";
import { enviarComportamentoRevisao } from "@/features/atendimento-ia/actions/comportamento/enviar-comportamento-revisao";
import { publicarComportamento } from "@/features/atendimento-ia/actions/comportamento/publicar-comportamento";
import { revisarComportamento } from "@/features/atendimento-ia/actions/comportamento/revisar-comportamento";
import { RESUMO_NUCLEO_PROTEGIDO } from "@/features/atendimento-ia/lib/admin/comportamento/validar-nucleo-protegido";

import {
  ResumoElegibilidade,
  type ResumoElegibilidadeDto,
} from "../compartilhados/resumo-elegibilidade";
import { RestaurarVersaoHistorica } from "./restaurar-versao-historica";
type Item = {
  id: string;
  nome: string;
  descricao: string;
  situacao: string;
  historico: Array<{
    atualizadoEm: string;
    estado: string;
    hash: string;
    id: string;
    numero: number;
    restauradaDeVersaoId: string | null;
  }>;
  versao: {
    id: string;
    numero: number;
    estado: string;
    atualizadoEm: string;
    configuracao: Record<string, unknown>;
    revisadoEm: string | null;
  } | null;
};
const configuracaoBase = {
  blocosEditaveis: [
    {
      identificador: "estilo_resposta",
      titulo: "Estilo da resposta",
      conteudo: "Responder com cordialidade, clareza e objetividade.",
    },
  ],
  exemplosEvitar: ["Pressionar o cliente ou inventar vantagens."],
  exemplosPositivos: [
    "Posso ajudar a comparar as opções conforme sua necessidade.",
  ],
  parametros: {
    concisao: "equilibrada" as const,
    formalidade: "neutra" as const,
    tratamentoIncerteza: "consultar_fonte" as const,
  },
  cordialidade: 4,
  acolhimento: 4,
  objetividade: 4,
  linguagemSimples: true,
  evitarLinguagemRobotica: true,
  saudacao: "Cumprimente de forma cordial quando adequado.",
  estruturaExplicacao:
    "Apresente primeiro a resposta principal e depois os detalhes.",
  perguntas: "Faça perguntas curtas para entender a necessidade.",
  recomendacoes: "Recomende com base na necessidade informada.",
  complementos: "Ofereça complementos úteis sem pressionar.",
  faltaInformacao: "Admita a limitação e consulte a fonte real.",
  encaminhamentoHumano:
    "Explique com clareza quando o atendimento humano for necessário.",
  palavrasPreferidas: ["posso ajudar"],
  palavrasEvitadas: ["última chance"],
  tratamentoCliente: "Respeitoso e não autoritário.",
  regrasHumanizacao: ["Reconhecer a dúvida do cliente."],
  naoPressionar: true as const,
  naoAutoritaria: true as const,
  naoInventarVantagem: true as const,
  naoManipularUrgencia: true as const,
  consultarDadosReais: true as const,
  restringirAoEscopoLoja: true as const,
  preservarSegurancaPrivacidade: true as const,
  whatsappEditavel: false as const,
  acoesAdministrativasPermitidas: false as const,
};
export function PainelComportamentos({
  itens,
  podeEscrever,
  podePublicar,
  podeRestaurar,
  elegibilidades,
}: {
  itens: Item[];
  podeEscrever: boolean;
  podePublicar: boolean;
  podeRestaurar: boolean;
  elegibilidades: Record<string, ResumoElegibilidadeDto | null>;
}) {
  const [nome, setNome] = useState("");
  const [pendente, iniciar] = useTransition();
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Núcleo protegido — somente leitura</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm">
            {RESUMO_NUCLEO_PROTEGIDO.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {podeEscrever ? (
        <div className="flex gap-2">
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da configuração"
          />
          <Button
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                try {
                  await criarComportamento({
                    nome,
                    descricao:
                      "Configuração administrativa autorizada de comportamento e tom.",
                    configuracao: configuracaoBase,
                    motivoAlteracao: "Criação administrativa inicial",
                    resumoAlteracao: "Configuração inicial de comportamento",
                  });
                  toast.success("Rascunho criado sem afetar o chat.");
                  setNome("");
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "Falha ao criar",
                  );
                }
              })
            }
          >
            Criar configuração
          </Button>
        </div>
      ) : null}
      <div className="grid gap-3">
        {itens.map((i) => (
          <Card key={i.id}>
            <CardHeader>
              <CardTitle>{i.nome}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-sm">
              <span>
                {i.descricao} · {i.situacao} · versão {i.versao?.numero ?? "—"}{" "}
                · {i.versao?.estado ?? "sem versão"}
              </span>
              {i.versao ? (
                <details className="w-full rounded-md border p-3">
                  <summary className="cursor-pointer font-medium">
                    Visualizar parâmetros e blocos administrativos
                  </summary>
                  <pre className="mt-2 max-h-64 overflow-auto text-xs whitespace-pre-wrap">
                    {JSON.stringify(i.versao.configuracao, null, 2)}
                  </pre>
                </details>
              ) : null}
              {i.historico.length ? (
                <details className="w-full rounded-md border p-3">
                  <summary className="cursor-pointer font-medium">
                    Histórico e restaurações ({i.historico.length})
                  </summary>
                  <div className="mt-3 grid gap-2">
                    {i.historico.map((versao) => (
                      <div key={versao.id} className="bg-muted/40 rounded p-3">
                        <p>
                          Versão {versao.numero} · {versao.estado} · hash{" "}
                          <code>{versao.hash.slice(0, 12)}</code>
                        </p>
                        {versao.restauradaDeVersaoId ? (
                          <p className="text-muted-foreground">
                            Origem histórica:{" "}
                            <code>
                              {versao.restauradaDeVersaoId.slice(0, 8)}
                            </code>
                          </p>
                        ) : null}
                        {podeRestaurar &&
                        versao.id !== i.historico[0]?.id ? (
                          <RestaurarVersaoHistorica
                            hashHistorico={versao.hash}
                            hashPublicado={
                              i.historico.find(
                                (itemHistorico) =>
                                  itemHistorico.estado === "publicado",
                              )?.hash ?? null
                            }
                            numeroHistorico={versao.numero}
                            numeroPublicado={
                              i.historico.find(
                                (itemHistorico) =>
                                  itemHistorico.estado === "publicado",
                              )?.numero ?? null
                            }
                            recursoId={i.id}
                            tipo="comportamento"
                            versaoAtual={i.historico[0]?.numero ?? 0}
                            versaoOrigemId={versao.id}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
              {i.versao && (
                <div className="w-full">
                  <ResumoElegibilidade
                    valor={elegibilidades[i.versao.id] ?? null}
                  />
                </div>
              )}
              {podeEscrever && i.versao?.estado === "rascunho" ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      iniciar(async () => {
                        try {
                          const cordialidadeInformada = window.prompt(
                            "Cordialidade de 1 a 5",
                            String(i.versao!.configuracao.cordialidade ?? 4),
                          );
                          if (cordialidadeInformada === null) return;
                          await atualizarRascunhoComportamento({
                            versaoId: i.versao!.id,
                            atualizadoEmEsperado: i.versao!.atualizadoEm,
                            configuracao: i.versao!.configuracao,
                            motivoAlteracao: "Edição administrativa autorizada",
                            resumoAlteracao:
                              "Parâmetros administrativos atualizados",
                          });
                          toast.success("Rascunho salvo.");
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Falha");
                        }
                      })
                    }
                  >
                    Editar/salvar rascunho
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      iniciar(async () => {
                        try {
                          await enviarComportamentoRevisao({
                            versaoId: i.versao!.id,
                            atualizadoEmEsperado: i.versao!.atualizadoEm,
                          });
                          toast.success("Enviado para revisão.");
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Falha");
                        }
                      })
                    }
                  >
                    Enviar para revisão
                  </Button>
                </>
              ) : null}
              {podeEscrever && i.versao && i.versao.estado !== "rascunho" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    iniciar(async () => {
                      try {
                        await criarVersaoComportamento({
                          comportamentoId: i.id,
                          configuracao: i.versao!.configuracao,
                          motivoAlteracao: "Nova versão administrativa",
                          resumoAlteracao: "Cópia editável da versão anterior",
                        });
                        toast.success("Nova versão em rascunho criada.");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Falha");
                      }
                    })
                  }
                >
                  Criar nova versão
                </Button>
              ) : null}
              {podeEscrever &&
              i.versao?.estado === "em_revisao" &&
              !i.versao.revisadoEm ? (
                <>
                  <Button
                    size="sm"
                    onClick={() =>
                      iniciar(async () => {
                        try {
                          await revisarComportamento({
                            versaoId: i.versao!.id,
                            atualizadoEmEsperado: i.versao!.atualizadoEm,
                            decisao: "aprovada",
                            motivo: "Configuração administrativa aprovada.",
                          });
                          toast.success("Aprovada sem publicar.");
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Falha");
                        }
                      })
                    }
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      iniciar(async () => {
                        try {
                          await revisarComportamento({
                            versaoId: i.versao!.id,
                            atualizadoEmEsperado: i.versao!.atualizadoEm,
                            decisao: "reprovada",
                            motivo: "Configuração requer ajustes.",
                          });
                          toast.success("Reprovada.");
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Falha");
                        }
                      })
                    }
                  >
                    Reprovar
                  </Button>
                </>
              ) : null}
              {podeEscrever && i.situacao === "ativa" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    iniciar(async () => {
                      try {
                        await arquivarComportamento({ comportamentoId: i.id });
                        toast.success("Arquivado sem apagar versões.");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Falha");
                      }
                    })
                  }
                >
                  Arquivar
                </Button>
              ) : null}
              {podePublicar &&
              i.versao &&
              elegibilidades[i.versao.id]?.status === "elegivel" ? (
                <Button
                  size="sm"
                  disabled={pendente}
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Publicar comportamento versão ${i.versao!.numero}?\nHash: ${elegibilidades[i.versao!.id]?.hashAvaliado}`,
                      )
                    )
                      return;
                    const justificativaAlertas =
                      window
                        .prompt(
                          "Justificativa para alertas (vazio se não houver):",
                        )
                        ?.trim() || undefined;
                    iniciar(async () => {
                      try {
                        await publicarComportamento({
                          versaoId: i.versao!.id,
                          chaveIdempotencia: `admin:${i.versao!.id}:${crypto.randomUUID()}`,
                          justificativaAlertas,
                        });
                        toast.success("Comportamento publicado.");
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Falha ao publicar",
                        );
                      }
                    });
                  }}
                >
                  Publicar comportamento
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
