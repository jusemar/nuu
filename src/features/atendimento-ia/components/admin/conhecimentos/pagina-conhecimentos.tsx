"use client";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ConhecimentoInstitucionalDto } from "@/features/atendimento-ia/types/admin/consultas";

import { EstadoVazio } from "../compartilhados/estado-vazio";
import { EstruturaPaginaTreinamento } from "../compartilhados/estrutura-pagina-treinamento";
import {
  ResumoElegibilidade,
  type ResumoElegibilidadeDto,
} from "../compartilhados/resumo-elegibilidade";
import { AcoesConhecimento } from "./acoes-conhecimento";
import { FormularioCriarConhecimento } from "./formulario-criar-conhecimento";
import { FormularioVersaoConhecimento } from "./formulario-versao-conhecimento";
import { PainelComportamentos } from "./painel-comportamentos";
import { RestaurarVersaoHistorica } from "./restaurar-versao-historica";

type VersaoHistorico = {
  atualizadoEm: string;
  conteudo: string;
  conteudoEstruturado: Record<string, unknown> | null;
  criadoEm: string;
  criadoPor: string | null;
  estado: string;
  hash: string;
  id: string;
  indexacao: string;
  motivoAlteracao: string | null;
  motivoBloqueio: string | null;
  publicacaoBloqueada: boolean;
  restauradaDeVersaoId: string | null;
  versao: number;
};

function Lista({
  itens,
  historicos,
  podeEscrever,
  podePublicar,
  podeRestaurar,
  elegibilidades,
}: {
  itens: ConhecimentoInstitucionalDto[];
  historicos: Record<string, VersaoHistorico[]>;
  podeEscrever: boolean;
  podePublicar: boolean;
  podeRestaurar: boolean;
  elegibilidades: Record<string, ResumoElegibilidadeDto | null>;
}) {
  if (!itens.length)
    return (
      <EstadoVazio
        titulo="Nenhum conhecimento institucional"
        descricao="O banco ainda não possui documentos para esta listagem."
      />
    );
  return (
    <div className="grid gap-3">
      {itens.map((item) => (
        <Card key={item.id} className="gap-4 py-5">
          <CardHeader className="px-5">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <CardTitle className="text-base">{item.titulo}</CardTitle>
                <CardDescription>
                  {item.categoria} · Origem: {item.origem}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant={item.publicado ? "success" : "secondary"}>
                  {item.estado ?? "Sem versão"}
                </Badge>
                <Badge variant="outline">
                  Versão {item.versaoAtual ?? "—"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 text-sm">
            <p className="text-muted-foreground">
              Indexação: {item.indexacao ?? "não iniciada"} · {item.fragmentos}{" "}
              fragmentos
            </p>
            <p className="text-muted-foreground mt-1">
              Autor: {item.autor ?? "registro anterior sem autoria"} · Situação:{" "}
              {item.situacao}
            </p>
            {item.versaoAtualId && (
              <ResumoElegibilidade
                valor={elegibilidades[item.versaoAtualId] ?? null}
              />
            )}
            <p className="text-muted-foreground mt-1">
              Atualizado em{" "}
              {new Date(item.atualizadoEm).toLocaleDateString("pt-BR")}
            </p>
            {podeEscrever ? (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  <AcoesConhecimento
                    conhecimentoId={item.id}
                    estado={item.estado}
                    situacao={item.situacao}
                    atualizadoEm={item.versaoAtualAtualizadaEm}
                    versaoId={item.versaoAtualId}
                    podePublicar={podePublicar}
                    elegivel={
                      elegibilidades[item.versaoAtualId ?? ""]?.status ===
                      "elegivel"
                    }
                    hash={
                      elegibilidades[item.versaoAtualId ?? ""]?.hashAvaliado ??
                      null
                    }
                  />
                  {historicos[item.id]?.[0]?.conteudoEstruturado &&
                  item.versaoAtualId &&
                  item.versaoAtualAtualizadaEm ? (
                    <FormularioVersaoConhecimento
                      atualizadoEm={item.versaoAtualAtualizadaEm}
                      conhecimentoId={item.id}
                      conteudo={historicos[item.id][0].conteudoEstruturado}
                      estado={item.estado ?? "rascunho"}
                      tipo={item.tipoConhecimento}
                      versaoId={item.versaoAtualId}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
            <details className="mt-4 rounded-md border p-3">
              <summary className="cursor-pointer font-medium">
                Histórico e comparação ({historicos[item.id]?.length ?? 0})
              </summary>
              <div className="mt-3 grid gap-2">
                {(historicos[item.id] ?? []).map((versao, indice, todas) => (
                  <div key={versao.id} className="bg-muted/40 rounded p-3">
                    <p>
                      Versão {versao.versao} · {versao.estado} ·{" "}
                      {versao.criadoPor ?? "autor não registrado"}
                    </p>
                    <p className="text-muted-foreground">
                      Motivo: {versao.motivoAlteracao ?? "não informado"} ·
                      Indexação existente: {versao.indexacao}
                    </p>
                    {versao.publicacaoBloqueada ? (
                      <p className="text-destructive">
                        Bloqueio: {versao.motivoBloqueio ?? "sem detalhe"}
                      </p>
                    ) : null}
                    {versao.restauradaDeVersaoId ? (
                      <p className="text-muted-foreground">
                        Restaurada da versão histórica identificada por{" "}
                        <code>{versao.restauradaDeVersaoId.slice(0, 8)}</code>.
                      </p>
                    ) : null}
                    {todas[indice + 1] ? (
                      <p className="text-muted-foreground">
                        Comparação com versão {todas[indice + 1].versao}:{" "}
                        {versao.conteudo === todas[indice + 1].conteudo
                          ? "sem alteração canônica"
                          : `${versao.conteudo.length - todas[indice + 1].conteudo.length} caracteres de diferença líquida`}
                        .
                      </p>
                    ) : null}
                    {podeRestaurar &&
                    versao.id !== historicos[item.id]?.[0]?.id ? (
                      <RestaurarVersaoHistorica
                        hashHistorico={versao.hash}
                        hashPublicado={
                          todas.find((itemHistorico) =>
                            itemHistorico.estado === "publicado"
                          )?.hash ?? null
                        }
                        numeroHistorico={versao.versao}
                        numeroPublicado={
                          todas.find((itemHistorico) =>
                            itemHistorico.estado === "publicado"
                          )?.versao ?? null
                        }
                        recursoId={item.id}
                        tipo="conhecimento"
                        versaoAtual={historicos[item.id]?.[0]?.versao ?? 0}
                        versaoOrigemId={versao.id}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </details>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PaginaConhecimentos({
  conhecimentos,
  historicos,
  podeEscrever,
  podePublicar,
  podeRestaurar,
  elegibilidades,
  comportamentos,
}: {
  conhecimentos: ConhecimentoInstitucionalDto[];
  historicos: Record<string, VersaoHistorico[]>;
  podeEscrever: boolean;
  podePublicar: boolean;
  podeRestaurar: boolean;
  elegibilidades: Record<string, ResumoElegibilidadeDto | null>;
  comportamentos: Parameters<typeof PainelComportamentos>[0]["itens"];
}) {
  return (
    <EstruturaPaginaTreinamento
      titulo="Conhecimentos"
      descricao="Leitura dos documentos institucionais e versões já existentes."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="relative block w-full max-w-md" action="">
          <label>
            <span className="sr-only">Buscar conhecimentos</span>
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              name="busca"
              placeholder="Buscar por chave, categoria ou origem"
              className="pl-9"
            />
          </label>
        </form>
        {podeEscrever ? <FormularioCriarConhecimento /> : null}
      </div>
      <Tabs defaultValue="empresa">
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="faq">Perguntas e respostas</TabsTrigger>
          <TabsTrigger value="comportamento">Comportamento da IA</TabsTrigger>
          <TabsTrigger value="arquivados">Arquivados</TabsTrigger>
        </TabsList>
        <TabsContent value="empresa">
          <Lista
            itens={conhecimentos.filter(
              (item) =>
                item.tipoConhecimento === "institucional" &&
                item.situacao === "ativa",
            )}
            historicos={historicos}
            podeEscrever={podeEscrever}
            podePublicar={podePublicar}
            podeRestaurar={podeRestaurar}
            elegibilidades={elegibilidades}
          />
        </TabsContent>
        <TabsContent value="faq">
          <Lista
            itens={conhecimentos.filter(
              (item) =>
                item.tipoConhecimento === "pergunta_resposta" &&
                item.situacao === "ativa",
            )}
            historicos={historicos}
            podeEscrever={podeEscrever}
            podePublicar={podePublicar}
            podeRestaurar={podeRestaurar}
            elegibilidades={elegibilidades}
          />
        </TabsContent>
        <TabsContent value="comportamento">
          <PainelComportamentos
            itens={comportamentos}
            podeEscrever={podeEscrever}
            podePublicar={podePublicar}
            podeRestaurar={podeRestaurar}
            elegibilidades={elegibilidades}
          />
        </TabsContent>
        <TabsContent value="arquivados">
          <Lista
            itens={conhecimentos.filter(
              (item) => item.situacao === "arquivada",
            )}
            historicos={historicos}
            podeEscrever={podeEscrever}
            podePublicar={podePublicar}
            podeRestaurar={podeRestaurar}
            elegibilidades={elegibilidades}
          />
        </TabsContent>
      </Tabs>
    </EstruturaPaginaTreinamento>
  );
}
