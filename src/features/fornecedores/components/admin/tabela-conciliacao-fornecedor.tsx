"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileWarning,
  PackageCheck,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type TipoOrigemConciliacaoFornecedor = "arquivo" | "api";

export type StatusConciliacaoFornecedor =
  | "pronto"
  | "pendencia"
  | "alerta"
  | "ignorado";

export type StatusVinculacaoConciliacaoFornecedor =
  | "novo"
  | "vinculado"
  | "ignorado";

export type AcaoPrevistaConciliacaoFornecedor =
  | "criar"
  | "atualizar"
  | "ignorar";

export type EstrategiaCampoConciliacaoFornecedor =
  | "valor_padrao"
  | "conciliacao"
  | "rascunho"
  | "sem_solucao"
  | "ignorar";

export type RegraCampoConciliacaoFornecedor = {
  campo: string;
  label: string;
  estrategia: EstrategiaCampoConciliacaoFornecedor;
  valorAplicado?: string | null;
  observacao?: string | null;
  bloqueiaPublicacao?: boolean;
};

export type ConfiguracaoPrecoConciliacaoFornecedor = {
  modalidade:
    | "Dropshipping"
    | "Estoque próprio"
    | "Pré-venda"
    | "Sob encomenda";
  valorAplicado?: string | null;
  prazo?: string | null;
  cardPrincipal?: boolean;
  origem?: string | null;
};

export type ItemConciliacaoFornecedor = {
  id: string;
  produto: {
    nome: string;
    codigo?: string | null;
    preco?: string | null;
    estoque?: number | null;
    complemento?: string | null;
  };
  acaoPrevista: AcaoPrevistaConciliacaoFornecedor;
  status: StatusConciliacaoFornecedor;
  statusVinculacao: StatusVinculacaoConciliacaoFornecedor;
  pendenciasObrigatorias?: string[];
  alertas?: string[];
  regrasObrigatorias?: RegraCampoConciliacaoFornecedor[];
  regrasImportantes?: RegraCampoConciliacaoFornecedor[];
  configuracaoPreco?: ConfiguracaoPrecoConciliacaoFornecedor | null;
  motivoIgnorado?: string | null;
};

type TabelaConciliacaoFornecedorProps = {
  tipoOrigem: TipoOrigemConciliacaoFornecedor;
  fornecedor: string;
  titulo: string;
  subtitulo: string;
  hrefVoltar: string;
  textoVoltar?: string;
  hrefProximaEtapa?: string;
  textoAcaoPrincipal?: string;
  itens: ItemConciliacaoFornecedor[];
};

type FiltroConciliacaoFornecedor =
  | "todos"
  | "novos"
  | "vinculados"
  | "pendencias"
  | "alertas"
  | "ignorados";

function formatarMoeda(valor?: string | null) {
  if (!valor) return null;

  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

function rotuloAcaoPrevista(acao: AcaoPrevistaConciliacaoFornecedor) {
  const rotulos: Record<AcaoPrevistaConciliacaoFornecedor, string> = {
    criar: "Criar novo",
    atualizar: "Atualizar",
    ignorar: "Ignorar",
  };

  return rotulos[acao];
}

function rotuloStatusVinculacao(status: StatusVinculacaoConciliacaoFornecedor) {
  const rotulos: Record<StatusVinculacaoConciliacaoFornecedor, string> = {
    novo: "Novo produto",
    vinculado: "Vinculado",
    ignorado: "Ignorado",
  };

  return rotulos[status];
}

function classeStatusVinculacao(status: StatusVinculacaoConciliacaoFornecedor) {
  const classes: Record<StatusVinculacaoConciliacaoFornecedor, string> = {
    novo: "border-blue-200 bg-blue-50 text-blue-700",
    vinculado: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ignorado: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return classes[status];
}

function classeStatus(status: StatusConciliacaoFornecedor) {
  const classes: Record<StatusConciliacaoFornecedor, string> = {
    pronto: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pendencia: "border-amber-200 bg-amber-50 text-amber-700",
    alerta: "border-orange-200 bg-orange-50 text-orange-700",
    ignorado: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return classes[status];
}

function classeSituacao(item: ItemConciliacaoFornecedor) {
  if (item.status === "pendencia") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (item.status === "alerta") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (item.status === "ignorado" || item.statusVinculacao === "ignorado") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return classeStatusVinculacao(item.statusVinculacao);
}

function rotuloSituacao(item: ItemConciliacaoFornecedor) {
  if (item.status === "pendencia") return "Pendência";
  if (item.status === "alerta") return "Alerta";
  if (item.status === "ignorado" || item.statusVinculacao === "ignorado") {
    return "Ignorado";
  }

  if (item.status === "pronto") return "Pronto";

  return item.statusVinculacao === "vinculado" ? "Vinculado" : "Novo";
}

function rotuloStatus(status: StatusConciliacaoFornecedor) {
  const rotulos: Record<StatusConciliacaoFornecedor, string> = {
    pronto: "Pronto",
    pendencia: "Pendência",
    alerta: "Alerta",
    ignorado: "Ignorado",
  };

  return rotulos[status];
}

function resumoProduto(item: ItemConciliacaoFornecedor) {
  const partes = [
    item.produto.codigo ? `Código ${item.produto.codigo}` : null,
    formatarMoeda(item.produto.preco),
    typeof item.produto.estoque === "number"
      ? `Estoque ${item.produto.estoque}`
      : null,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" · ") : "Sem dados auxiliares";
}

function nomeProdutoLegivel(nome: string) {
  if (nome !== nome.toUpperCase()) return nome;

  return nome
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)\S/g, (letra) => letra.toLocaleUpperCase("pt-BR"));
}

function resumoPendenciaPrincipal(item: ItemConciliacaoFornecedor) {
  if (item.status === "ignorado") {
    return item.motivoIgnorado ?? "Ignorado na vinculação";
  }

  if (item.status === "pronto") {
    return "Mapeamento aplicado";
  }

  if (item.status === "alerta") {
    return (item.alertas ?? ["Alerta leve"])[0] ?? "Alerta leve";
  }

  const pendencias = item.pendenciasObrigatorias ?? [];

  if (pendencias.length > 1) {
    const categoriaPendente = pendencias.some((pendencia) =>
      pendencia.toLowerCase().includes("categoria"),
    );
    const marcaPendente = pendencias.some((pendencia) =>
      pendencia.toLowerCase().includes("marca"),
    );

    if (categoriaPendente && marcaPendente && pendencias.length === 2) {
      return "Categoria e marca pendentes";
    }

    return `${pendencias.length} pendências obrigatórias`;
  }

  if (pendencias.length === 1) return pendencias[0];

  const regrasPendentes = obterRegrasQueExigemAcao(item);

  if (regrasPendentes.length > 1) {
    return `${regrasPendentes.length} pendências obrigatórias`;
  }

  if (regrasPendentes.length === 1)
    return `${regrasPendentes[0].label} pendente`;

  return "Revisar pendência";
}

function calcularResumo(itens: ItemConciliacaoFornecedor[]) {
  return {
    prontos: itens.filter((item) => item.status === "pronto").length,
    pendencias: itens.filter((item) => item.status === "pendencia").length,
    alertas: itens.filter((item) => item.status === "alerta").length,
    ignorados: itens.filter((item) => item.status === "ignorado").length,
  };
}

function deveExibirItem(
  item: ItemConciliacaoFornecedor,
  filtro: FiltroConciliacaoFornecedor,
) {
  if (filtro === "todos") return true;
  if (filtro === "novos") return item.statusVinculacao === "novo";
  if (filtro === "vinculados") return item.statusVinculacao === "vinculado";
  if (filtro === "pendencias") return item.status === "pendencia";
  if (filtro === "alertas") return item.status === "alerta";
  return item.status === "ignorado";
}

function deveExibirPorBusca(item: ItemConciliacaoFornecedor, busca: string) {
  const termo = busca.trim().toLowerCase();

  if (!termo) return true;

  return [
    item.produto.nome,
    item.produto.codigo,
    item.produto.complemento,
    rotuloAcaoPrevista(item.acaoPrevista),
    rotuloStatus(item.status),
    rotuloStatusVinculacao(item.statusVinculacao),
  ]
    .filter(Boolean)
    .some((valor) => valor?.toLowerCase().includes(termo));
}

function obterRegrasQueExigemAcao(item: ItemConciliacaoFornecedor) {
  return (item.regrasObrigatorias ?? []).filter(
    (regra) =>
      regra.estrategia === "conciliacao" ||
      regra.estrategia === "sem_solucao" ||
      regra.bloqueiaPublicacao,
  );
}

function obterRegrasBloqueio(item: ItemConciliacaoFornecedor) {
  return (item.regrasObrigatorias ?? []).filter(
    (regra) =>
      regra.bloqueiaPublicacao ||
      regra.estrategia === "conciliacao" ||
      regra.estrategia === "sem_solucao",
  );
}

function obterRegrasMapeamentoAplicado(item: ItemConciliacaoFornecedor) {
  return [
    ...(item.regrasObrigatorias ?? []),
    ...(item.regrasImportantes ?? []),
  ].filter(
    (regra) => regra.estrategia === "valor_padrao" || regra.valorAplicado,
  );
}

function formatarRegraResolvida(regra: RegraCampoConciliacaoFornecedor) {
  if (regra.estrategia === "valor_padrao") {
    return regra.valorAplicado
      ? `Valor padrão: ${regra.valorAplicado}`
      : "Valor padrão não definido";
  }

  if (regra.estrategia === "conciliacao") {
    return "Preencher item a item";
  }

  if (regra.estrategia === "rascunho") {
    return "Rascunho até preencher";
  }

  if (regra.estrategia === "ignorar") {
    return "Ignorado por enquanto";
  }

  return "Sem solução definida";
}

function CampoEdicaoConciliacao({
  regra,
}: {
  regra: RegraCampoConciliacaoFornecedor;
}) {
  const campo = regra.campo.toLowerCase();

  if (campo.includes("categoria") || campo.includes("marca")) {
    return (
      <select
        defaultValue=""
        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-xs"
      >
        <option value="">Selecionar {regra.label.toLowerCase()}</option>
        <option value="padrao-1">Opção da loja</option>
        <option value="padrao-2">Definir depois</option>
      </select>
    );
  }

  if (
    campo.includes("preco") ||
    campo.includes("estoque") ||
    campo.includes("peso") ||
    campo.includes("altura") ||
    campo.includes("largura") ||
    campo.includes("comprimento")
  ) {
    return (
      <input
        type="number"
        min="0"
        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-xs"
        placeholder={`Informar ${regra.label.toLowerCase()}`}
      />
    );
  }

  return (
    <input
      className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-xs"
      placeholder={`Informar ${regra.label.toLowerCase()}`}
    />
  );
}

function ListaRegrasConciliacao({
  regras,
  tipo,
}: {
  regras: RegraCampoConciliacaoFornecedor[];
  tipo: "obrigatoria" | "importante";
}) {
  if (regras.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        {tipo === "obrigatoria"
          ? "Nenhuma pendência obrigatória."
          : "Sem alertas importantes."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {regras.map((regra) => {
        const exigeEdicao = regra.estrategia === "conciliacao";
        const bloqueia =
          regra.bloqueiaPublicacao || regra.estrategia === "sem_solucao";

        return (
          <div
            key={`${regra.campo}-${regra.label}`}
            className={`rounded-md border p-2 ${
              bloqueia
                ? "border-amber-200 bg-amber-50/70"
                : tipo === "importante"
                  ? "border-blue-100 bg-blue-50/45"
                  : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">
                  {regra.label}
                </p>
                <p className="text-xs text-slate-500">
                  {formatarRegraResolvida(regra)}
                </p>
              </div>
              {bloqueia ? (
                <Badge
                  variant="outline"
                  className="w-fit border-amber-200 bg-white text-amber-700"
                >
                  Bloqueia publicação
                </Badge>
              ) : null}
            </div>
            {exigeEdicao ? (
              <div className="mt-2">
                <CampoEdicaoConciliacao regra={regra} />
              </div>
            ) : null}
            {regra.observacao ? (
              <p className="mt-1 text-xs text-slate-500">{regra.observacao}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function BlocoPrecoAplicado({
  configuracao,
}: {
  configuracao?: ConfiguracaoPrecoConciliacaoFornecedor | null;
}) {
  if (!configuracao) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-800">
        Preço principal ausente
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-blue-200 bg-blue-50 text-blue-700"
        >
          {configuracao.modalidade}
        </Badge>
        {configuracao.cardPrincipal ? (
          <Badge variant="outline">Card principal</Badge>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-slate-600">
        Preço aplicado:{" "}
        <span className="font-medium text-slate-900">
          {formatarMoeda(configuracao.valorAplicado) ?? "Não definido"}
        </span>
      </p>
      <p className="text-xs text-slate-500">
        Prazo: {configuracao.prazo ?? "Não definido"}
      </p>
    </div>
  );
}

function CelulaPendenciasCorrecoes({
  item,
}: {
  item: ItemConciliacaoFornecedor;
}) {
  return (
    <div className="min-w-0">
      <p
        className={`truncate text-sm font-medium ${
          item.status === "pendencia"
            ? "text-amber-800"
            : item.status === "alerta"
              ? "text-orange-700"
              : item.status === "ignorado"
                ? "text-slate-500"
                : "text-slate-800"
        }`}
      >
        {resumoPendenciaPrincipal(item)}
      </p>
      {item.status === "pendencia" ? (
        <p className="mt-0.5 text-xs text-amber-700">Bloqueia publicação</p>
      ) : null}
    </div>
  );
}

function PainelDetalhesConciliacao({
  item,
  tipoOrigem,
  aberto,
  aoAlterarAbertura,
}: {
  item: ItemConciliacaoFornecedor | null;
  tipoOrigem: TipoOrigemConciliacaoFornecedor;
  aberto: boolean;
  aoAlterarAbertura: (aberto: boolean) => void;
}) {
  const regrasBloqueio = item ? obterRegrasBloqueio(item) : [];
  const regrasMapeamentoAplicado = item
    ? obterRegrasMapeamentoAplicado(item)
    : [];
  const origem = tipoOrigem === "api" ? "API" : "Arquivo";

  return (
    <Sheet open={aberto} onOpenChange={aoAlterarAbertura}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        {item ? (
          <>
            <SheetHeader className="border-b px-5 py-4 text-left">
              <SheetTitle>Detalhes da conciliação</SheetTitle>
              <SheetDescription className="line-clamp-2">
                {nomeProdutoLegivel(item.produto.nome)}
                {item.produto.codigo ? ` · Código ${item.produto.codigo}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-5 py-5">
              <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  Produto recebido
                </h3>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">Nome</dt>
                    <dd className="font-medium text-slate-900">
                      {nomeProdutoLegivel(item.produto.nome)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      Código fornecedor
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {item.produto.codigo ?? "Não recebido"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Preço recebido</dt>
                    <dd className="font-medium text-slate-900">
                      {formatarMoeda(item.produto.preco) ?? "Não recebido"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Estoque</dt>
                    <dd className="font-medium text-slate-900">
                      {typeof item.produto.estoque === "number"
                        ? item.produto.estoque
                        : "Não recebido"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      Grupo/subgrupo origem
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {item.produto.complemento ?? "Sem complemento"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Origem</dt>
                    <dd className="font-medium text-slate-900">{origem}</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  Situação
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className={classeSituacao(item)}>
                    {rotuloSituacao(item)}
                  </Badge>
                  <Badge variant="outline">
                    Ação: {rotuloAcaoPrevista(item.acaoPrevista)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={classeStatusVinculacao(item.statusVinculacao)}
                  >
                    {rotuloStatusVinculacao(item.statusVinculacao)}
                  </Badge>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">
                      Produto da loja vinculado
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {item.statusVinculacao === "vinculado"
                        ? "Produto vinculado nesta etapa"
                        : "Não vinculado"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      Pendência principal
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {resumoPendenciaPrincipal(item)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/45 p-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  Campos que bloqueiam publicação
                </h3>
                <ListaRegrasConciliacao
                  regras={regrasBloqueio}
                  tipo="obrigatoria"
                />
              </section>

              <section className="space-y-2 rounded-lg border border-blue-100 bg-blue-50/30 p-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  Alertas e campos importantes
                </h3>
                <ListaRegrasConciliacao
                  regras={item.regrasImportantes ?? []}
                  tipo="importante"
                />
              </section>

              <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  Aplicação do mapeamento
                </h3>
                {regrasMapeamentoAplicado.length > 0 ? (
                  <div className="grid gap-2">
                    {regrasMapeamentoAplicado.map((regra) => (
                      <div
                        key={`${item.id}-aplicado-${regra.campo}`}
                        className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-700">
                          {regra.label}
                        </span>
                        <span className="text-right text-slate-600">
                          {formatarRegraResolvida(regra)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Nenhum valor padrão aplicado.
                  </p>
                )}
                <BlocoPrecoAplicado configuracao={item.configuracaoPreco} />
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function TabelaConciliacaoFornecedor({
  tipoOrigem,
  fornecedor,
  titulo,
  subtitulo,
  hrefVoltar,
  textoVoltar = "Voltar para Vínculos",
  hrefProximaEtapa,
  textoAcaoPrincipal = "Continuar para publicação",
  itens,
}: TabelaConciliacaoFornecedorProps) {
  const [filtro, setFiltro] = useState<FiltroConciliacaoFornecedor>("todos");
  const [busca, setBusca] = useState("");
  const [itemDetalhes, setItemDetalhes] =
    useState<ItemConciliacaoFornecedor | null>(null);
  const [idsSelecionados, setIdsSelecionados] = useState<string[]>([]);
  const resumo = useMemo(() => calcularResumo(itens), [itens]);
  const itensFiltrados = useMemo(
    () =>
      itens.filter(
        (item) =>
          deveExibirItem(item, filtro) && deveExibirPorBusca(item, busca),
      ),
    [busca, filtro, itens],
  );
  const totalPendencias = resumo.pendencias;
  const possuiPendencias = totalPendencias > 0;
  const idsFiltrados = useMemo(
    () => itensFiltrados.map((item) => item.id),
    [itensFiltrados],
  );
  const totalSelecionados = idsSelecionados.length;
  const totalSelecionadosVisiveis = idsFiltrados.filter((id) =>
    idsSelecionados.includes(id),
  ).length;
  const todosVisiveisSelecionados =
    idsFiltrados.length > 0 &&
    totalSelecionadosVisiveis === idsFiltrados.length;
  const estadoSelecaoCabecalho = todosVisiveisSelecionados
    ? true
    : totalSelecionadosVisiveis > 0
      ? "indeterminate"
      : false;
  const origem = tipoOrigem === "api" ? "API" : "Arquivo";
  const filtros: Array<{
    valor: FiltroConciliacaoFornecedor;
    label: string;
    total: number;
  }> = [
    { valor: "todos", label: "Todos", total: itens.length },
    {
      valor: "novos",
      label: "Novos",
      total: itens.filter((item) => item.statusVinculacao === "novo").length,
    },
    {
      valor: "vinculados",
      label: "Vinculados",
      total: itens.filter((item) => item.statusVinculacao === "vinculado")
        .length,
    },
    {
      valor: "pendencias",
      label: "Pendências obrigatórias",
      total: resumo.pendencias,
    },
    { valor: "alertas", label: "Alertas", total: resumo.alertas },
    { valor: "ignorados", label: "Ignorados", total: resumo.ignorados },
  ];
  const alternarSelecaoItem = (id: string, selecionado: boolean) => {
    setIdsSelecionados((atuais) =>
      selecionado
        ? Array.from(new Set([...atuais, id]))
        : atuais.filter((itemId) => itemId !== id),
    );
  };
  const alternarSelecaoVisivel = (selecionado: boolean) => {
    setIdsSelecionados((atuais) => {
      if (selecionado) return Array.from(new Set([...atuais, ...idsFiltrados]));

      return atuais.filter((id) => !idsFiltrados.includes(id));
    });
  };

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
              <Link href={hrefVoltar}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {textoVoltar}
              </Link>
            </Button>
            <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
              {titulo}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitulo}</p>
          </div>

          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm sm:grid-cols-2 lg:min-w-[360px]">
            <div>
              <p className="text-xs text-slate-500">Fornecedor</p>
              <p className="font-medium text-slate-900">{fornecedor}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Origem</p>
              <p className="font-medium text-slate-900">{origem}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Itens recebidos</p>
              <p className="font-medium text-slate-900">{itens.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status da etapa</p>
              <p className="font-medium text-slate-900">
                {possuiPendencias ? "Bloqueada" : "Liberada"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Prontos para publicar
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {resumo.prontos}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </CardContent>
        </Card>
        <Card className="rounded-lg border-amber-200 bg-amber-50/60">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-amber-700">
                Pendências obrigatórias
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-950">
                {resumo.pendencias}
              </p>
            </div>
            <FileWarning className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Alertas</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {resumo.alertas}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Ignorados</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {resumo.ignorados}
              </p>
            </div>
            <PackageCheck className="h-5 w-5 text-slate-500" />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
        {filtros.map((item) => (
          <button
            key={item.valor}
            type="button"
            onClick={() => setFiltro(item.valor)}
            className={`inline-flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
              filtro === item.valor
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                filtro === item.valor
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {item.total}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por produto, código ou status"
            className="h-10 pl-9"
          />
        </label>
      </div>

      {totalSelecionados > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-950 p-3 text-white shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">
            {totalSelecionados} linha{totalSelecionados === 1 ? "" : "s"}{" "}
            selecionada{totalSelecionados === 1 ? "" : "s"}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" size="sm" variant="secondary">
              Aplicar categoria em lote
            </Button>
            <Button type="button" size="sm" variant="secondary">
              Marcar como ignorado
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setIdsSelecionados([])}
            >
              Limpar seleção
            </Button>
          </div>
        </div>
      ) : null}

      {possuiPendencias ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-amber-950">
                Pendências obrigatórias
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                Produtos com pendências obrigatórias ficam bloqueados para
                publicação até a etapa correta resolver os campos.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="w-[48px]">
                <Checkbox
                  checked={estadoSelecaoCabecalho}
                  onCheckedChange={(valor) =>
                    alternarSelecaoVisivel(valor === true)
                  }
                  aria-label="Selecionar linhas visíveis"
                />
              </TableHead>
              <TableHead className="w-[34%]">Produto recebido</TableHead>
              <TableHead className="w-[14%]">Situação</TableHead>
              <TableHead className="w-[40%]">Correções necessárias</TableHead>
              <TableHead className="w-[12%] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itensFiltrados.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer align-top"
                onClick={() => setItemDetalhes(item)}
              >
                <TableCell onClick={(evento) => evento.stopPropagation()}>
                  <Checkbox
                    checked={idsSelecionados.includes(item.id)}
                    onCheckedChange={(valor) =>
                      alternarSelecaoItem(item.id, valor === true)
                    }
                    aria-label={`Selecionar ${item.produto.nome}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {nomeProdutoLegivel(item.produto.nome)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {resumoProduto(item)}
                    </p>
                    {item.produto.complemento ? (
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {item.produto.complemento}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Badge variant="outline" className={classeSituacao(item)}>
                      {rotuloSituacao(item)}
                    </Badge>
                    {item.status === "pendencia" ? (
                      <p className="text-xs font-medium text-amber-700">
                        Bloqueia publicação
                      </p>
                    ) : null}
                    {item.status === "ignorado" ? (
                      <p className="text-xs text-slate-500">
                        {item.motivoIgnorado ?? "Marcado na vinculação"}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <CelulaPendenciasCorrecoes item={item} />
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(evento) => evento.stopPropagation()}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setItemDetalhes(item)}
                        aria-label="Detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Detalhes</TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {itensFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Nenhum item encontrado
                  </p>
                  <p className="text-xs text-slate-500">
                    Ajuste a busca ou troque o filtro.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {itensFiltrados.map((item) => (
          <article
            key={item.id}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-xs"
            onClick={() => setItemDetalhes(item)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <Checkbox
                  checked={idsSelecionados.includes(item.id)}
                  onCheckedChange={(valor) =>
                    alternarSelecaoItem(item.id, valor === true)
                  }
                  aria-label={`Selecionar ${item.produto.nome}`}
                  className="mt-0.5"
                  onClick={(evento) => evento.stopPropagation()}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">
                    {nomeProdutoLegivel(item.produto.nome)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {resumoProduto(item)}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={classeSituacao(item)}>
                {rotuloSituacao(item)}
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 text-sm">
              <div>
                <p className="mb-1 text-xs text-slate-500">
                  Correções necessárias
                </p>
                <CelulaPendenciasCorrecoes item={item} />
              </div>
              <div className="flex justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={(evento) => {
                        evento.stopPropagation();
                        setItemDetalhes(item);
                      }}
                      aria-label="Detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Detalhes</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </article>
        ))}
        {itensFiltrados.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm font-medium text-slate-700">
              Nenhum item encontrado
            </p>
            <p className="text-xs text-slate-500">
              Ajuste a busca ou troque o filtro.
            </p>
          </div>
        ) : null}
      </div>

      <PainelDetalhesConciliacao
        item={itemDetalhes}
        tipoOrigem={tipoOrigem}
        aberto={Boolean(itemDetalhes)}
        aoAlterarAbertura={(aberto) => {
          if (!aberto) setItemDetalhes(null);
        }}
      />

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`text-sm font-medium ${
            possuiPendencias ? "text-amber-700" : "text-emerald-700"
          }`}
        >
          {possuiPendencias
            ? `Publicação bloqueada: existem ${totalPendencias} produtos com pendências obrigatórias.`
            : "Todos os produtos estão prontos para publicação."}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href={hrefVoltar}>Voltar para vínculos</Link>
          </Button>
          {possuiPendencias || !hrefProximaEtapa ? (
            <Button type="button" disabled>
              Publicação bloqueada
            </Button>
          ) : (
            <Button asChild>
              <Link href={hrefProximaEtapa}>{textoAcaoPrincipal}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
