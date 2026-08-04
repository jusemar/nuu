"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { atualizarPropostaMelhoria } from "@/features/atendimento-ia/actions/revisao/atualizar-proposta-melhoria";
import { avaliarResposta } from "@/features/atendimento-ia/actions/revisao/avaliar-resposta";
import { criarPropostaMelhoria } from "@/features/atendimento-ia/actions/revisao/criar-proposta-melhoria";
import { decidirRevisao } from "@/features/atendimento-ia/actions/revisao/decidir-revisao";
import { iniciarRevisao } from "@/features/atendimento-ia/actions/revisao/iniciar-revisao";
import { vincularEvidenciaProposta } from "@/features/atendimento-ia/actions/revisao/vincular-evidencia-proposta";
import {
  CLASSIFICACOES_PROBLEMA_ADMIN,
  CRITERIOS_AVALIACAO_ADMIN,
  VERSAO_RUBRICA_AVALIACAO_ADMIN,
} from "@/features/atendimento-ia/constants/admin/rubricas";
import { registrarAvaliacaoRespostaAdminSchema } from "@/features/atendimento-ia/schemas/admin/avaliacao.schema";
import { criarPropostaMelhoriaPersistidaSchema } from "@/features/atendimento-ia/schemas/admin/revisao-operacoes.schema";
import type {
  ConversaRevisaoDto,
  ConversaSanitizadaDto,
} from "@/features/atendimento-ia/types/admin/consultas";

import { EstadoVazio } from "../compartilhados/estado-vazio";
import { EstruturaPaginaTreinamento } from "../compartilhados/estrutura-pagina-treinamento";

type Proposta = {
  atualizadoEm: string;
  categoria: string;
  id: string;
  impacto: string;
  prioridade: string;
  risco: string;
  status: string;
  titulo: string;
};
type Revisao = {
  atualizadoEm: string;
  avaliacaoId: string | null;
  id: string;
  propostaId: string | null;
  status: string;
};

export function PaginaRevisoes({
  conversas,
  detalhe,
  podeDecidir,
  podeEscrever,
  propostas,
  revisoes,
}: {
  conversas: ConversaRevisaoDto[];
  detalhe: ConversaSanitizadaDto | null;
  podeDecidir: boolean;
  podeEscrever: boolean;
  propostas: Proposta[];
  revisoes: Revisao[];
}) {
  return (
    <EstruturaPaginaTreinamento
      titulo="Revisões"
      descricao="Revise evidências sanitizadas sem produzir aprendizado ou publicação automática."
    >
      <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
        <ShieldCheck className="text-success size-4" /> IDs de sessão, contatos,
        endereços, payloads e prompts não são exibidos.
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <ListaConversas conversas={conversas} />
        {detalhe ? (
          <DetalheConversa detalhe={detalhe} podeEscrever={podeEscrever} />
        ) : (
          <EstadoVazio
            titulo="Selecione uma conversa"
            descricao="Abra uma projeção sanitizada para avaliar uma resposta da IA."
          />
        )}
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Propostas de melhoria</h2>
        {podeEscrever ? <FormularioProposta /> : null}
        <div className="grid gap-3 md:grid-cols-2">
          {propostas.map((proposta) => (
            <Card key={proposta.id} className="py-4">
              <CardHeader className="px-5">
                <CardTitle className="text-base">{proposta.titulo}</CardTitle>
                <CardDescription>
                  {proposta.categoria} · {proposta.prioridade}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-5">
                <Badge variant="outline">{proposta.status}</Badge>
                {podeEscrever ? <AcaoProposta proposta={proposta} /> : null}
                {podeEscrever && detalhe ? (
                  <VinculoEvidencia
                    propostaId={proposta.id}
                    conversa={detalhe}
                  />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Revisões formais</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {revisoes.map((revisao) => (
            <Card key={revisao.id} className="py-4">
              <CardContent className="space-y-3 px-5">
                <p className="font-medium">
                  {revisao.avaliacaoId ? "Avaliação" : "Proposta"}
                </p>
                <Badge variant="outline">{revisao.status}</Badge>
                {podeDecidir &&
                ["pendente", "em_analise"].includes(revisao.status) ? (
                  <DecisaoRevisao revisao={revisao} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </EstruturaPaginaTreinamento>
  );
}

function ListaConversas({ conversas }: { conversas: ConversaRevisaoDto[] }) {
  if (!conversas.length)
    return (
      <EstadoVazio
        titulo="Nenhuma conversa para revisão"
        descricao="A consulta real não encontrou conversas nesta página."
      />
    );
  return (
    <div className="grid gap-3">
      {conversas.map((item) => (
        <Card key={item.referencia} className="py-4">
          <CardHeader className="px-5">
            <CardTitle className="text-base">{item.identificador}</CardTitle>
            <CardDescription>
              {new Date(item.criadoEm).toLocaleString("pt-BR")} ·{" "}
              {item.quantidadeMensagens} mensagens
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 px-5">
            <Badge variant={item.avaliada ? "success" : "secondary"}>
              Avaliada: {item.avaliada ? "sim" : "não"}
            </Badge>
            <Button asChild size="sm" variant="outline">
              <Link href={`?conversa=${item.referencia}`}>
                Abrir conversa sanitizada
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DetalheConversa({
  detalhe,
  podeEscrever,
}: {
  detalhe: ConversaSanitizadaDto;
  podeEscrever: boolean;
}) {
  return (
    <Card className="py-4">
      <CardHeader className="px-5">
        <CardTitle>Conversa {detalhe.identificador}</CardTitle>
        <CardDescription>
          Conteúdo mascarado e limitado para revisão humana.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-5">
        {detalhe.mensagens.map((mensagem) => (
          <div key={mensagem.referencia} className="rounded-lg border p-3">
            <Badge variant="outline">{mensagem.autor}</Badge>
            <p className="mt-2 text-sm whitespace-pre-wrap">
              {mensagem.conteudo}
            </p>
            {podeEscrever && mensagem.autor === "assistente_ia" ? (
              <FormularioAvaliacao
                conversaId={detalhe.referencia}
                mensagemId={mensagem.referencia}
              />
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

type AvaliacaoEntrada = z.input<typeof registrarAvaliacaoRespostaAdminSchema>;
type AvaliacaoSaida = z.output<typeof registrarAvaliacaoRespostaAdminSchema>;
function FormularioAvaliacao({
  conversaId,
  mensagemId,
}: {
  conversaId: string;
  mensagemId: string;
}) {
  const [pendente, iniciar] = useTransition();
  const form = useForm<AvaliacaoEntrada, unknown, AvaliacaoSaida>({
    resolver: zodResolver(registrarAvaliacaoRespostaAdminSchema),
    defaultValues: {
      classificacaoProblema: "outro",
      comentario: "",
      conversaId,
      criterios: CRITERIOS_AVALIACAO_ADMIN.map((criterio) => ({
        criterio,
        nota: 3,
      })),
      decisao: "precisa_melhorar",
      mensagemId,
      nota: 3,
      respostaCorrigida: "",
      versaoRubrica: VERSAO_RUBRICA_AVALIACAO_ADMIN,
    },
  });
  return (
    <form
      className="mt-4 grid gap-3 border-t pt-3"
      onSubmit={form.handleSubmit((dados) =>
        iniciar(async () => {
          try {
            await avaliarResposta(dados);
            toast.success(
              "Avaliação registrada sem alterar a resposta original.",
            );
          } catch (erro) {
            toast.error(
              erro instanceof Error ? erro.message : "Falha ao avaliar.",
            );
          }
        }),
      )}
    >
      <div className="grid grid-cols-3 gap-2">
        <Label>
          Nota
          <select
            className="border-input h-9 rounded-md border px-2"
            {...form.register("nota", { valueAsNumber: true })}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Label>
        <Label>
          Resultado
          <select
            className="border-input h-9 rounded-md border px-2"
            {...form.register("decisao")}
          >
            <option value="aprovado">Aprovado</option>
            <option value="precisa_melhorar">Precisa melhorar</option>
            <option value="reprovado">Reprovado</option>
          </select>
        </Label>
        <Label>
          Problema
          <select
            className="border-input h-9 rounded-md border px-2"
            {...form.register("classificacaoProblema")}
          >
            {CLASSIFICACOES_PROBLEMA_ADMIN.map((classificacao) => (
              <option key={classificacao} value={classificacao}>
                {classificacao.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Label>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {CRITERIOS_AVALIACAO_ADMIN.map((criterio, indice) => (
          <Label key={criterio}>
            {criterio.replaceAll("_", " ")}
            <select
              className="border-input h-9 rounded-md border px-2"
              {...form.register(`criterios.${indice}.nota`, {
                valueAsNumber: true,
              })}
            >
              {[1, 2, 3, 4, 5].map((nota) => (
                <option key={nota}>{nota}</option>
              ))}
            </select>
          </Label>
        ))}
      </div>
      <Textarea
        placeholder="Comentário opcional"
        {...form.register("comentario")}
      />
      <Textarea
        placeholder="Resposta corrigida opcional"
        {...form.register("respostaCorrigida")}
      />
      <Button size="sm" disabled={pendente}>
        Registrar avaliação
      </Button>
    </form>
  );
}

type PropostaEntrada = z.input<typeof criarPropostaMelhoriaPersistidaSchema>;
type PropostaSaida = z.output<typeof criarPropostaMelhoriaPersistidaSchema>;
function FormularioProposta() {
  const [pendente, iniciar] = useTransition();
  const form = useForm<PropostaEntrada, unknown, PropostaSaida>({
    resolver: zodResolver(criarPropostaMelhoriaPersistidaSchema),
    defaultValues: {
      categoria: "conhecimento",
      criterioAceite:
        "A melhoria deve atender às evidências sanitizadas vinculadas.",
      descricao:
        "Descreva a melhoria necessária e o problema que ela deve resolver.",
      impacto: "medio",
      prioridade: "media",
      risco: "baixo",
      titulo: "",
    },
  });
  return (
    <form
      className="grid gap-3 rounded-lg border p-4"
      onSubmit={form.handleSubmit((dados) =>
        iniciar(async () => {
          try {
            await criarPropostaMelhoria(dados);
            toast.success("Proposta criada sem alterar conhecimentos.");
            form.reset();
          } catch (erro) {
            toast.error(
              erro instanceof Error ? erro.message : "Falha ao criar proposta.",
            );
          }
        }),
      )}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Input placeholder="Título da proposta" {...form.register("titulo")} />
        <Input placeholder="Categoria" {...form.register("categoria")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Label>
          Impacto
          <select
            className="border-input h-9 rounded-md border px-2"
            {...form.register("impacto")}
          >
            <option value="baixo">Baixo</option>
            <option value="medio">Médio</option>
            <option value="alto">Alto</option>
          </select>
        </Label>
        <Label>
          Prioridade
          <select
            className="border-input h-9 rounded-md border px-2"
            {...form.register("prioridade")}
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </Label>
        <Label>
          Risco
          <select
            className="border-input h-9 rounded-md border px-2"
            {...form.register("risco")}
          >
            <option value="baixo">Baixo</option>
            <option value="medio">Médio</option>
            <option value="alto">Alto</option>
            <option value="critico">Crítico</option>
          </select>
        </Label>
      </div>
      <Textarea {...form.register("descricao")} />
      <Textarea {...form.register("criterioAceite")} />
      <Button disabled={pendente}>Criar proposta</Button>
    </form>
  );
}

function VinculoEvidencia({
  conversa,
  propostaId,
}: {
  conversa: ConversaSanitizadaDto;
  propostaId: string;
}) {
  const [pendente, iniciar] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pendente}
      onClick={() =>
        iniciar(async () => {
          try {
            await vincularEvidenciaProposta({
              data: conversa.criadoEm,
              descricao: `Conversa sanitizada ${conversa.identificador} selecionada para análise.`,
              propostaId,
              referenciaId: conversa.referencia,
              tipo: "conversa",
            });
            toast.success("Evidência sanitizada vinculada.");
          } catch (erro) {
            toast.error(
              erro instanceof Error
                ? erro.message
                : "Falha ao vincular evidência.",
            );
          }
        })
      }
    >
      Vincular conversa como evidência
    </Button>
  );
}
function AcaoProposta({ proposta }: { proposta: Proposta }) {
  const [pendente, iniciar] = useTransition();
  const proximo = (
    {
      aberta: "em_triagem",
      em_triagem: "aceita",
      aceita: "em_implementacao",
      em_implementacao: "aguardando_testes",
      aguardando_testes: "concluida",
    } as const
  )[
    proposta.status as
      | "aberta"
      | "em_triagem"
      | "aceita"
      | "em_implementacao"
      | "aguardando_testes"
  ];
  if (!proximo) return null;
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pendente}
      onClick={() =>
        iniciar(async () => {
          try {
            await atualizarPropostaMelhoria({
              atualizadoEmEsperado: proposta.atualizadoEm,
              justificativa: `Avanço editorial para ${proximo}.`,
              propostaId: proposta.id,
              status: proximo,
            });
            toast.success("Status da proposta atualizado.");
          } catch (erro) {
            toast.error(
              erro instanceof Error
                ? erro.message
                : "Falha ao atualizar proposta.",
            );
          }
        })
      }
    >
      Avançar para {proximo.replaceAll("_", " ")}
    </Button>
  );
}
function DecisaoRevisao({ revisao }: { revisao: Revisao }) {
  const [pendente, iniciar] = useTransition();
  const executar = (status: "aprovada" | "reprovada") =>
    iniciar(async () => {
      try {
        await decidirRevisao({
          atualizadoEmEsperado: revisao.atualizadoEm,
          justificativa: `Decisão administrativa: ${status}.`,
          revisaoId: revisao.id,
          status,
        });
        toast.success("Revisão decidida.");
      } catch (erro) {
        toast.error(erro instanceof Error ? erro.message : "Falha ao decidir.");
      }
    });
  const iniciarAnalise = () =>
    iniciar(async () => {
      try {
        await iniciarRevisao({
          atualizadoEmEsperado: revisao.atualizadoEm,
          revisaoId: revisao.id,
          status: "em_analise",
        });
        toast.success("Revisão assumida para análise.");
      } catch (erro) {
        toast.error(
          erro instanceof Error ? erro.message : "Falha ao iniciar revisão.",
        );
      }
    });
  if (revisao.status === "pendente")
    return (
      <Button
        disabled={pendente}
        size="sm"
        variant="outline"
        onClick={iniciarAnalise}
      >
        Iniciar análise
      </Button>
    );
  return (
    <div className="flex gap-2">
      <Button
        disabled={pendente}
        size="sm"
        onClick={() => executar("aprovada")}
      >
        Aprovar
      </Button>
      <Button
        disabled={pendente}
        size="sm"
        variant="destructive"
        onClick={() => executar("reprovada")}
      >
        Reprovar
      </Button>
    </div>
  );
}
