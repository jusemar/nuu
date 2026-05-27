import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  PackageSearch,
  Plug,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RegraDisponibilidadeOperacional } from "@/features/admin/logistica/lib/mapear-regras-disponibilidade-operacional";

import { NavegacaoLogisticaOperacional } from "./navegacao-logistica-operacional";

type RegistroStatus = {
  id: string;
  nome: string;
  ativo: boolean;
};

type OrigemServico = "externo" | "entrega-propria" | "retirada";

type ServicoVendaOperacional = RegistroStatus & {
  transportadoraNome: string;
  origemNome: string;
  origem: OrigemServico;
  limitePeso: string;
  limiteDimensoes: string;
  tiposLogisticosCompativeis: string[];
  quantidadeRegrasAplicadas: number;
};

type EstadoIntegracao = "conectado" | "erro" | "nao-configurado";

type TransportadoraIntegracao = {
  id: string;
  nome: string;
  servicos: string[];
};

type IntegracaoOperacional = {
  id: string;
  nome: string;
  estado: EstadoIntegracao;
  cepOrigem: string | null;
  quantidadeServicosImportados: number;
  ultimaSincronizacao: string | null;
  ultimoTeste: string | null;
  transportadoras: TransportadoraIntegracao[];
  configuravel: boolean;
  permiteAtivacao: boolean;
};

function Status({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? "default" : "secondary"}>
      {ativo ? "Ativo" : "Inativo"}
    </Badge>
  );
}

function StatusIntegracao({ estado }: { estado: EstadoIntegracao }) {
  if (estado === "conectado") return <Badge>Conectado</Badge>;
  if (estado === "erro") return <Badge variant="destructive">Erro</Badge>;
  return <Badge variant="secondary">Não configurado</Badge>;
}

function CabecalhoModulo({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <p className="text-muted-foreground text-sm">{descricao}</p>
    </header>
  );
}

export function PaginaVisaoGeralLogistica({
  integracoesAtivas,
  servicosAtivos,
  regrasAtivas,
  produtosClassificados,
  alertasOperacionais,
  frenetConectada,
  servicosSemConfiguracao,
  produtosSemDimensoes,
  regrasBloqueandoServicos,
}: {
  integracoesAtivas: number;
  servicosAtivos: number;
  regrasAtivas: number;
  produtosClassificados: number;
  alertasOperacionais: number;
  frenetConectada: boolean;
  servicosSemConfiguracao: number;
  produtosSemDimensoes: number | null;
  regrasBloqueandoServicos: number;
}) {
  const indicadores = [
    ["Integrações ativas", integracoesAtivas],
    ["Serviços ativos", servicosAtivos],
    ["Regras ativas", regrasAtivas],
    ["Produtos classificados", produtosClassificados],
    ["Alertas operacionais", alertasOperacionais],
  ];

  return (
    <div className="space-y-6">
      <NavegacaoLogisticaOperacional />
      <CabecalhoModulo
        titulo="Visão Geral da Logística"
        descricao="Acompanhe conexões, serviços disponíveis e pendências que afetam a operação."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {indicadores.map(([nome, quantidade]) => (
          <Card key={String(nome)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{nome}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {quantidade}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Operacional</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm">
            <div className="flex items-start gap-2">
              {frenetConectada ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              )}
              <div>
                <p className="font-medium">Integração Frenet</p>
                <p className="text-muted-foreground">
                  {frenetConectada
                    ? "Conectada para operação."
                    : "Não configurada ou inativa."}
                </p>
              </div>
            </div>
            <Badge variant={frenetConectada ? "default" : "secondary"}>
              {frenetConectada ? "Conectada" : "Pendente"}
            </Badge>
          </div>
          <div className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium">Serviços sem configuração</p>
                <p className="text-muted-foreground">
                  Revise opções inativas antes da venda.
                </p>
              </div>
            </div>
            <Badge variant="secondary">{servicosSemConfiguracao}</Badge>
          </div>
          <div className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm">
            <div className="flex items-start gap-2">
              <PackageSearch className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Produtos sem peso/dimensões</p>
                <p className="text-muted-foreground">
                  {produtosSemDimensoes === null
                    ? "Conferência disponível no cadastro de produtos."
                    : "Podem impedir uma cotação correta."}
                </p>
              </div>
            </div>
            <Badge variant="secondary">
              {produtosSemDimensoes ?? "Verificar"}
            </Badge>
          </div>
          <div className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Regras bloqueando serviços</p>
                <p className="text-muted-foreground">
                  Bloqueios ativos na disponibilidade.
                </p>
              </div>
            </div>
            <Badge variant="secondary">{regrasBloqueandoServicos}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            ["/admin/logistica/integracoes", "Abrir Integrações"],
            ["/admin/logistica/servicos-entrega", "Abrir Serviços de Entrega"],
            [
              "/admin/logistica/regras-disponibilidade",
              "Abrir Regras de Disponibilidade",
            ],
            ["/admin/products", "Abrir Produtos"],
          ].map(([href, texto]) => (
            <Button key={href} asChild variant="outline">
              <Link href={href}>
                {texto} <ArrowRight />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      {alertasOperacionais === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            Nenhum alerta operacional encontrado.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function PaginaIntegracoesLogistica({
  integracoes,
}: {
  integracoes: IntegracaoOperacional[];
}) {
  return (
    <div className="space-y-6">
      <NavegacaoLogisticaOperacional />
      <CabecalhoModulo
        titulo="Integrações"
        descricao="Conecte plataformas de frete, acompanhe os serviços importados e prepare novas conexões."
      />

      <Card className="border-primary/30">
        <CardContent className="flex gap-3 pt-6 text-sm">
          <Plug className="text-primary mt-0.5 size-4 shrink-0" />
          <p>
            <strong>Integração</strong> conecta a plataforma.{" "}
            <strong>Transportadora</strong> executa a entrega.{" "}
            <strong>Serviço</strong> é a opção oferecida ao cliente.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {integracoes.map((integracao) => (
          <Card key={integracao.id} className="overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plug className="size-4" /> {integracao.nome}
                </CardTitle>
                <StatusIntegracao estado={integracao.estado} />
              </div>
              <p className="text-muted-foreground text-sm">API externa</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-5 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">CEP de origem</dt>
                  <dd className="font-medium">
                    {integracao.cepOrigem ?? "Não configurado"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Serviços importados</dt>
                  <dd className="font-medium">
                    {integracao.quantidadeServicosImportados}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    Última sincronização
                  </dt>
                  <dd className="font-medium">
                    {integracao.ultimaSincronizacao ?? "Não disponível"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Último teste</dt>
                  <dd className="font-medium">
                    {integracao.ultimoTeste ?? "Não disponível"}
                  </dd>
                </div>
              </dl>

              <section
                className="space-y-2"
                aria-label={`Transportadoras encontradas em ${integracao.nome}`}
              >
                <h2 className="text-sm font-medium">
                  Transportadoras encontradas
                </h2>
                {integracao.transportadoras.length === 0 ? (
                  <p className="text-muted-foreground rounded-md border border-dashed p-3">
                    Nenhuma transportadora importada.
                  </p>
                ) : (
                  integracao.transportadoras.map((transportadora) => (
                    <div
                      key={transportadora.id}
                      className="rounded-md border p-3"
                    >
                      <div className="mb-2 flex items-center gap-2 font-medium">
                        <span>{integracao.nome}</span>
                        <ChevronRight className="text-muted-foreground size-4" />
                        <span>{transportadora.nome}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {transportadora.servicos.length === 0 ? (
                          <span className="text-muted-foreground">
                            Nenhum serviço importado.
                          </span>
                        ) : (
                          transportadora.servicos.map((servico) => (
                            <Badge key={servico} variant="outline">
                              {servico}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </section>

              <div className="space-y-2 border-t pt-4">
                <div className="flex flex-wrap gap-2">
                  {integracao.configuravel ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href="/admin/logistica/transportadoras-integracoes#configuracao-frenet">
                        Abrir configuração da Frenet
                      </Link>
                    </Button>
                  ) : (
                    <Badge variant="secondary">Configuração em breve</Badge>
                  )}
                  {integracao.permiteAtivacao ? (
                    <Button type="button" size="sm" variant="outline">
                      Ativar/Desativar
                    </Button>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs">
                  {integracao.configuravel
                    ? "Na próxima tela, use o botão Ativar Frenet no card principal."
                    : "Conexão ainda não disponível para configuração nesta etapa."}
                </p>
                <p className="text-muted-foreground text-xs">
                  Teste de conexão e sincronização de serviços serão liberados
                  nesta tela.
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="size-4" /> Alertas e Diagnósticos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Sincronizações e testes serão exibidos aqui quando o registro
          operacional estiver disponível.
        </CardContent>
      </Card>
    </div>
  );
}

export function PaginaServicosEntregaLogistica({
  servicos,
  filtros,
}: {
  servicos: ServicoVendaOperacional[];
  filtros: {
    busca: string;
    origem: OrigemServico | "todas";
    status: "todos" | "ativos" | "inativos";
  };
}) {
  const busca = filtros.busca.trim().toLocaleLowerCase();
  const servicosFiltrados = servicos.filter((servico) => {
    const encontrado =
      busca.length === 0 ||
      `${servico.transportadoraNome} ${servico.nome} ${servico.origemNome}`
        .toLocaleLowerCase()
        .includes(busca);
    const origemVisivel =
      filtros.origem === "todas" || filtros.origem === servico.origem;
    const statusVisivel =
      filtros.status === "todos" ||
      (filtros.status === "ativos" ? servico.ativo : !servico.ativo);
    return encontrado && origemVisivel && statusVisivel;
  });
  const secoes: Array<{
    titulo: string;
    origem: OrigemServico;
    descricao: string;
  }> = [
    {
      titulo: "Serviços Externos",
      origem: "externo",
      descricao: "Opções recebidas de integrações como a Frenet.",
    },
    {
      titulo: "Entrega Própria",
      origem: "entrega-propria",
      descricao: "Modalidades operadas diretamente pela loja.",
    },
    {
      titulo: "Retirada",
      origem: "retirada",
      descricao: "Opções em que o cliente retira o pedido.",
    },
  ];
  const ativos = servicos.filter((servico) => servico.ativo).length;
  const comRegras = servicos.filter(
    (servico) => servico.quantidadeRegrasAplicadas > 0,
  ).length;

  return (
    <div className="space-y-6">
      <NavegacaoLogisticaOperacional />
      <CabecalhoModulo
        titulo="Serviços de Entrega"
        descricao="Veja o que pode ser oferecido ao cliente, a origem de cada opção e seus limites operacionais."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Serviços disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {servicos.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ativos para operação</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{ativos}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Com regras aplicadas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {comRegras}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="size-4" /> Localizar Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_190px_160px_auto]">
            <label className="relative">
              <span className="sr-only">Buscar serviço</span>
              <Search className="text-muted-foreground absolute top-3 left-3 size-4" />
              <input
                name="busca"
                defaultValue={filtros.busca}
                placeholder="Buscar transportadora ou serviço"
                className="border-input bg-background h-10 w-full rounded-md border pr-3 pl-9 text-sm"
              />
            </label>
            <select
              name="origem"
              defaultValue={filtros.origem}
              aria-label="Origem do serviço"
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            >
              <option value="todas">Todas as origens</option>
              <option value="externo">Integrações externas</option>
              <option value="entrega-propria">Entrega Própria</option>
              <option value="retirada">Retirada</option>
            </select>
            <select
              name="status"
              defaultValue={filtros.status}
              aria-label="Status operacional"
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            >
              <option value="todos">Todos os status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {secoes.map((secao) => {
        const itens = servicosFiltrados.filter(
          (servico) => servico.origem === secao.origem,
        );
        return (
          <section key={secao.origem} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{secao.titulo}</h2>
              <p className="text-muted-foreground text-sm">{secao.descricao}</p>
            </div>
            {itens.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-muted-foreground py-6 text-sm">
                  Nenhum serviço nesta seção para os filtros selecionados.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {itens.map((servico) => (
                  <Card key={servico.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">
                            {servico.transportadoraNome} | {servico.nome}
                          </CardTitle>
                          <p className="text-muted-foreground mt-1 text-sm">
                            via {servico.origemNome}
                          </p>
                        </div>
                        <Status ativo={servico.ativo} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <dl className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">Peso máximo</dt>
                          <dd className="font-medium">{servico.limitePeso}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            Dimensões máximas
                          </dt>
                          <dd className="font-medium">
                            {servico.limiteDimensoes}
                          </dd>
                        </div>
                      </dl>
                      <div>
                        <div className="text-muted-foreground mb-2">
                          Classificações compatíveis
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {servico.tiposLogisticosCompativeis.length === 0 ? (
                            <span>Sem permissão específica configurada</span>
                          ) : (
                            servico.tiposLogisticosCompativeis.map((tipo) => (
                              <Badge key={tipo} variant="outline">
                                {tipo}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="bg-muted/35 flex items-center justify-between rounded-md p-3">
                        <span>Regras aplicadas</span>
                        <Badge
                          variant={
                            servico.quantidadeRegrasAplicadas > 0
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {servico.quantidadeRegrasAplicadas}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 border-t pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          Ativar/Desativar
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/admin/logistica/regras-disponibilidade">
                            Visualizar regras
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/admin/logistica/transportadoras-integracoes">
                            Editar limites
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          Abrir detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monitoramento Operacional</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Prioridade, SLA e diagnóstico estarão disponíveis quando os dados de
          monitoramento forem integrados.
        </CardContent>
      </Card>
    </div>
  );
}

export function PaginaRegrasDisponibilidadeLogistica({
  regrasCategorias,
  regrasProdutos,
  regrasClassificacoes,
}: {
  regrasCategorias: RegraDisponibilidadeOperacional[];
  regrasProdutos: RegraDisponibilidadeOperacional[];
  regrasClassificacoes: RegraDisponibilidadeOperacional[];
}) {
  const regras = [
    ...regrasCategorias,
    ...regrasProdutos,
    ...regrasClassificacoes,
  ];
  const regrasAtivas = regras.filter((regra) => regra.ativo);
  const indicadores = [
    ["Regras ativas", regrasAtivas.length],
    [
      "Bloqueando serviços",
      regrasAtivas.filter((regra) => regra.efeito === "bloquear").length,
    ],
    [
      "Permitindo serviços",
      regrasAtivas.filter((regra) => regra.efeito === "permitir").length,
    ],
    [
      "Produtos com regra",
      new Set(regrasProdutos.map((regra) => regra.alvo)).size,
    ],
    [
      "Categorias com regra",
      new Set(regrasCategorias.map((regra) => regra.alvo)).size,
    ],
  ];

  function ListaRegras({
    regrasAba,
    vazio,
  }: {
    regrasAba: RegraDisponibilidadeOperacional[];
    vazio: string;
  }) {
    if (regrasAba.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            {vazio}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {regrasAba.map((regra) => (
          <Card key={regra.id}>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge
                    variant={
                      regra.efeito === "bloquear" ? "destructive" : "default"
                    }
                  >
                    {regra.efeito === "bloquear" ? "Bloquear" : "Permitir"}
                  </Badge>
                  <p className="font-medium">{regra.frase}</p>
                </div>
                <Status ativo={regra.ativo} />
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Alvo da regra</dt>
                  <dd className="font-medium">{regra.alvo}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Serviço afetado</dt>
                  <dd className="font-medium">{regra.servicoAfetado}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Precedência</dt>
                  <dd className="font-medium">{regra.precedencia}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/logistica/transportadoras-integracoes">
                    Editar
                  </Link>
                </Button>
                <Button type="button" variant="outline" size="sm" disabled>
                  Desativar
                </Button>
                <Button type="button" variant="outline" size="sm" disabled>
                  Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NavegacaoLogisticaOperacional />
      <CabecalhoModulo
        titulo="Regras de Disponibilidade"
        descricao="Defina quando uma opção de entrega pode ou não ser usada por categorias, produtos ou classificações logísticas."
      />
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4" /> Como as regras funcionam
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <p>
            Regra de <strong>produto</strong> sobrescreve regra de categoria.
          </p>
          <p>
            <strong>Bloqueio</strong> vence permissão no mesmo nível.
          </p>
          <p>
            <strong>Classificação logística</strong> agrupa produtos com a mesma
            necessidade.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {indicadores.map(([nome, quantidade]) => (
          <Card key={String(nome)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{nome}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {quantidade}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="categorias" className="gap-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto p-1 sm:w-fit">
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="classificacoes">
            Classificações Logísticas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="categorias">
          <ListaRegras
            regrasAba={regrasCategorias}
            vazio="Nenhuma regra para categorias foi configurada."
          />
        </TabsContent>
        <TabsContent value="produtos">
          <ListaRegras
            regrasAba={regrasProdutos}
            vazio="Nenhuma regra específica para produtos foi configurada."
          />
        </TabsContent>
        <TabsContent value="classificacoes">
          <ListaRegras
            regrasAba={regrasClassificacoes}
            vazio="Nenhuma regra para classificações logísticas foi configurada."
          />
        </TabsContent>
      </Tabs>

      <Button asChild>
        <Link href="/admin/logistica/transportadoras-integracoes">
          Criar ou ajustar regra <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}
