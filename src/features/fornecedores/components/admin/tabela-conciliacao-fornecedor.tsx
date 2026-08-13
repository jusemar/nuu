"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Eye,
  FileWarning,
  FilterX,
  Loader2,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  RotateCcw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IndicadorAberturaImportacao } from "@/features/fornecedores/components/admin/compartilhados/indicador-abertura-importacao";
import {
  calcularAjustePrecoRascunhoFornecedor,
  type OperacaoAjustePrecoRascunhoFornecedor,
} from "@/features/fornecedores/lib/conciliacao/calcular-ajuste-preco-rascunho-fornecedor";
import { montarComparativoConciliacaoFornecedor } from "@/features/fornecedores/lib/conciliacao/comparativo-conciliacao-fornecedor";
import type { ModalidadeComercialRascunho } from "@/features/fornecedores/lib/conciliacao/configuracao-rascunho-fornecedor";
import { avaliarPortaoPublicacaoFornecedor } from "@/features/fornecedores/lib/conciliacao/portao-publicacao-fornecedor";
import type {
  FiltroConciliacaoFornecedor,
  ResumoConciliacaoFornecedor,
} from "@/features/fornecedores/queries/listar-rascunhos-importacao-fornecedor";

import { CheckboxFornecedor } from "./compartilhados/checkbox-fornecedor";
import { PainelFiltrosResponsivo } from "./compartilhados/painel-filtros-responsivo";
import { SelecaoPaginaFornecedor } from "./compartilhados/selecao-pagina-fornecedor";

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
    | "Sob encomenda"
    | null;
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
    precoFornecedor?: string | null;
    precoLoja?: string | null;
    estoque?: number | null;
    complemento?: string | null;
    imagemUrl?: string | null;
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
  camposRascunho?: {
    categoriaId?: string | null;
    categoriaNome?: string | null;
    marcaId?: string | null;
    marcaNome?: string | null;
    secoesLoja?: string[];
    ncm?: string | null;
    ean?: string | null;
    peso?: string | null;
    altura?: string | null;
    largura?: string | null;
    comprimento?: string | null;
    statusRascunho?: string;
    modalidadeComercial?: ModalidadeComercialRascunho | null;
    prazoEntrega?: string | null;
  };
  /** Presente só quando `statusVinculacao === "vinculado"`: dados atuais do produto real da loja, para comparar com o recebido. */
  produtoAtualizado?: {
    produtoId: string;
    nome: string | null;
    sku: string | null;
    precoAtual: string | null;
    estoqueAtual: number | null;
    modalidadeAtual?: string | null;
    prazoAtual?: string | null;
  } | null;
};

export type EntradaAtualizarCamposRascunhosFornecedor =
  | { rascunhoIds: string[]; campo: "categoria"; categoriaId: string }
  | { rascunhoIds: string[]; campo: "marca"; marcaId: string }
  | { rascunhoIds: string[]; campo: "preco_loja"; precoLoja: number }
  | { rascunhoIds: string[]; campo: "estoque"; estoque: number }
  | {
      rascunhoIds: string[];
      campo: "secoes_loja";
      secoesLoja: string[];
    }
  | {
      rascunhoIds: string[];
      campo: "modalidade_comercial";
      modalidade: ModalidadeComercialRascunho;
    }
  | {
      rascunhoIds: string[];
      campo: "prazo_entrega";
      prazoEntrega: string;
    };

export type EntradaAlterarDecisaoRascunhosFornecedor = {
  rascunhoIds: string[];
  acao: "ignorar" | "desfazer" | "aprovar";
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
  textoAcaoIndisponivel?: string;
  mensagemAcaoIndisponivel?: string;
  itens: ItemConciliacaoFornecedor[];
  resumoGlobal: ResumoConciliacaoFornecedor;
  filtroAtivo: FiltroConciliacaoFornecedor;
  buscaInicial: string;
  navegacaoFiltros: {
    hrefAtual: string;
    parametroPagina: string;
    parametroBusca: string;
    parametroFiltro: string;
  };
  aoAjustarPrecosSelecionados?: (
    entrada: EntradaAjustarPrecosConciliacaoFornecedor,
  ) => Promise<ResultadoAcaoConciliacaoFornecedor>;
  aoAtualizarCamposRascunhos?: (
    entrada: EntradaAtualizarCamposRascunhosFornecedor,
  ) => Promise<ResultadoAcaoConciliacaoFornecedor>;
  aoAlterarDecisaoRascunhos?: (
    entrada: EntradaAlterarDecisaoRascunhosFornecedor,
  ) => Promise<ResultadoAcaoConciliacaoFornecedor>;
  categoriasLoja?: Array<{ id: string; nome: string }>;
  marcasLoja?: Array<{ id: string; nome: string }>;
};

export type EntradaAjustarPrecosConciliacaoFornecedor = {
  rascunhoIds: string[];
  operacao: OperacaoAjustePrecoRascunhoFornecedor;
  valor: number;
};

export type ResultadoAcaoConciliacaoFornecedor = {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  precosAtualizados?: Array<{ rascunhoId: string; precoLoja: string }>;
};

function formatarMoeda(valor?: string | null) {
  if (!valor) return null;

  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

const NOMES_SECOES_LOJA: Record<string, string> = {
  general: "Catálogo",
  new: "Novidades",
  sale: "Ofertas",
  featured: "Destaques",
  bestseller: "+ Vendidos",
};

function formatarSecoesLoja(secoes?: string[]) {
  if (!secoes?.length) return "Não definidas";

  return secoes.map((secao) => NOMES_SECOES_LOJA[secao] ?? secao).join(", ");
}

/**
 * Preços que o resumo da linha mostra, com o significado certo para cada caminho.
 *
 * Item VINCULADO tem três valores distintos, e eles não podem compartilhar rótulo:
 *
 *   Fornecedor    `produto.precoFornecedor` — o que veio no arquivo
 *   Loja (atual)  `produtoAtualizado.precoAtual` — o que o produto real pratica
 *                 hoje na loja (linha ativa e principal de `product_pricing`)
 *   A publicar    `produto.precoLoja` — o preço do rascunho, já com o ajuste
 *                 manual do gestor quando houver
 *
 * Antes, a linha rotulava `produto.precoLoja` como "Loja". Como o rascunho nasce
 * com o preço do fornecedor, os dois lados apareciam com o mesmo número
 * (R$ 516,16 × R$ 516,16) e a comparação — que é a razão de existir da
 * Conciliação — simplesmente sumia da tela.
 *
 * Item NOVO não tem produto na loja para comparar, então mantém o par original.
 */
const ROTULOS_MODALIDADE_LOJA: Record<string, string> = {
  stock: "Estoque próprio",
  pre_sale: "Pré-venda",
  dropshipping: "Dropshipping",
  order_basis: "Sob encomenda",
};

function resumirPrecosLinha(item: ItemConciliacaoFornecedor) {
  const precoAPublicar = formatarMoeda(
    item.produto.precoLoja ?? item.produto.preco,
  );
  const precoFornecedor = formatarMoeda(item.produto.precoFornecedor);

  if (item.produtoAtualizado) {
    return [
      {
        rotulo: "Fornecedor",
        valor: precoFornecedor ?? "Não recebido",
        destaque: false,
      },
      {
        rotulo: "Loja (atual)",
        valor:
          formatarMoeda(item.produtoAtualizado.precoAtual) ?? "Não cadastrado",
        destaque: false,
      },
      {
        rotulo: "A publicar",
        valor: precoAPublicar ?? "Pendente",
        destaque: true,
      },
    ];
  }

  return [
    {
      rotulo: "Fornecedor",
      valor: precoFornecedor ?? "Não recebido",
      destaque: false,
    },
    { rotulo: "Loja", valor: precoAPublicar ?? "Pendente", destaque: true },
  ];
}

/**
 * Bloco de comparação do celular.
 *
 * Um card por campo, com os três valores empilhados e rotulados. Sem rolagem
 * horizontal e sem depender de o gestor lembrar a ordem das colunas — no
 * celular, três colunas de tabela empurram a comparação para fora da tela, e
 * a comparação é a razão de existir desta etapa.
 *
 * A regra de o que comparar vive em `lib/conciliacao`; aqui só a apresentação.
 */
function ComparativoConciliacaoMobile({
  item,
}: {
  item: ItemConciliacaoFornecedor;
}) {
  const atual = item.produtoAtualizado;
  const campos = item.camposRascunho;
  const linhas = montarComparativoConciliacaoFornecedor({
    fornecedor: {
      preco: item.produto.precoFornecedor ?? null,
      estoque: item.produto.estoque ?? null,
    },
    lojaAtual: atual
      ? {
          preco: atual.precoAtual ?? null,
          estoque: atual.estoqueAtual ?? null,
          modalidade: atual.modalidadeAtual ?? null,
          prazo: atual.prazoAtual ?? null,
        }
      : null,
    aPublicar: {
      preco: item.produto.precoLoja ?? item.produto.preco ?? null,
      estoque: item.produto.estoque ?? null,
      categoriaNome: campos?.categoriaNome ?? null,
      marcaNome: campos?.marcaNome ?? null,
      secoesLoja: campos?.secoesLoja ?? null,
      modalidade: campos?.modalidadeComercial ?? null,
      prazo: campos?.prazoEntrega ?? item.configuracaoPreco?.prazo ?? null,
    },
  });

  return (
    <div className="grid gap-2">
      <p className="text-xs font-semibold text-slate-700">
        Fornecedor × Loja atual × A publicar
      </p>
      <dl className="grid gap-2">
        {linhas.map((linha) => (
          <div
            key={linha.campo}
            className={`rounded-md border p-2.5 ${
              linha.muda
                ? "border-blue-200 bg-blue-50/60"
                : "border-slate-200 bg-white"
            }`}
          >
            <dt className="text-xs font-semibold text-slate-900">
              {linha.campo}
            </dt>
            <dd className="mt-1.5 grid grid-cols-3 gap-2 text-xs">
              <span className="min-w-0">
                <span className="block text-[10px] tracking-wide text-slate-500 uppercase">
                  Fornecedor
                </span>
                <span className="block break-words text-slate-700">
                  {linha.fornecedor}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] tracking-wide text-slate-500 uppercase">
                  Loja atual
                </span>
                <span className="block break-words text-slate-700">
                  {linha.lojaAtual}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] tracking-wide text-blue-700 uppercase">
                  A publicar
                </span>
                <span className="block font-semibold break-words text-slate-950">
                  {linha.aPublicar}
                </span>
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function calcularPrecoAjustadoPreview({
  item,
  operacao,
  valor,
}: {
  item: ItemConciliacaoFornecedor;
  operacao: OperacaoAjustePrecoRascunhoFornecedor;
  valor: number;
}) {
  return calcularAjustePrecoRascunhoFornecedor({
    precoAtual: item.produto.precoLoja ?? item.produto.precoFornecedor,
    operacao,
    valor,
  });
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
        {configuracao.modalidade ? (
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700"
          >
            {configuracao.modalidade}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            Modalidade pendente
          </Badge>
        )}
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

              {/* Comparação "o que está na loja" × "o que chegou do fornecedor".
                  Só existe no caminho "atualizar": é ela que dá ao gestor a base
                  para aprovar ou não a mudança. */}
              {item.produtoAtualizado ? (
                <section className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Produto real da loja × dados recebidos
                  </h3>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-slate-500">
                        Produto da loja
                      </dt>
                      <dd className="font-medium text-slate-900">
                        {item.produtoAtualizado.nome ?? "-"}
                        {item.produtoAtualizado.sku
                          ? ` · SKU ${item.produtoAtualizado.sku}`
                          : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Preço atual</dt>
                      <dd className="font-medium text-slate-900">
                        {formatarMoeda(item.produtoAtualizado.precoAtual) ??
                          "Não cadastrado"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Preço recebido</dt>
                      <dd className="font-medium text-slate-900">
                        {formatarMoeda(
                          item.produto.precoLoja ?? item.produto.preco,
                        ) ?? "Não recebido"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Estoque atual</dt>
                      <dd className="font-medium text-slate-900">
                        {typeof item.produtoAtualizado.estoqueAtual === "number"
                          ? item.produtoAtualizado.estoqueAtual
                          : "Não cadastrado"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">
                        Estoque recebido
                      </dt>
                      <dd className="font-medium text-slate-900">
                        {typeof item.produto.estoque === "number"
                          ? item.produto.estoque
                          : "Não recebido"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">
                        Modalidade atual
                      </dt>
                      <dd className="font-medium text-slate-900">
                        {item.produtoAtualizado.modalidadeAtual
                          ? (ROTULOS_MODALIDADE_LOJA[
                              item.produtoAtualizado.modalidadeAtual
                            ] ?? item.produtoAtualizado.modalidadeAtual)
                          : "Não cadastrada"}
                        {item.produtoAtualizado.prazoAtual
                          ? ` · ${item.produtoAtualizado.prazoAtual}`
                          : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">
                        Modalidade a publicar
                      </dt>
                      <dd className="font-medium text-emerald-700">
                        Estoque próprio · 1 dia útil
                      </dd>
                    </div>
                  </dl>

                  {/* O resultado proposto: o que fica gravado se o gestor
                      apenas aprovar, sem editar nada. */}
                  <dl className="mt-4 grid gap-3 border-t border-blue-200 pt-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-slate-500">
                        Preço a publicar
                      </dt>
                      <dd className="font-semibold text-emerald-700">
                        {formatarMoeda(
                          item.produto.precoLoja ?? item.produto.preco,
                        ) ?? "Pendente"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">
                        Estoque a publicar
                      </dt>
                      <dd className="font-semibold text-emerald-700">
                        {typeof item.produto.estoque === "number"
                          ? item.produto.estoque
                          : "Mantém o atual"}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-xs text-slate-500">
                    Aprovar sem editar aplica exatamente o que está em “a
                    publicar”. Campos ausentes no arquivo mantêm o valor atual
                    do produto.
                  </p>
                </section>
              ) : null}

              {/* "Campos finais do rascunho" descreve um produto a ser CRIADO.
                  Para item vinculado, o produto já existe e esses campos não se
                  aplicam — a seção acima ocupa o lugar dela. */}
              {item.statusVinculacao !== "vinculado" ? (
                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Campos finais do rascunho
                  </h3>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-slate-500">Marca</dt>
                      <dd className="font-medium text-slate-900">
                        {item.camposRascunho?.marcaNome ?? "Pendente"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Categoria</dt>
                      <dd className="font-medium text-slate-900">
                        {item.camposRascunho?.categoriaNome ?? "Pendente"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-slate-500">Seções da Loja</dt>
                      <dd className="font-medium text-slate-900">
                        {formatarSecoesLoja(item.camposRascunho?.secoesLoja)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">
                        Preço fornecedor
                      </dt>
                      <dd className="font-medium text-slate-900">
                        {formatarMoeda(item.produto.precoFornecedor) ??
                          "Não recebido"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Preço da loja</dt>
                      <dd className="font-medium text-slate-900">
                        {formatarMoeda(
                          item.produto.precoLoja ?? item.produto.preco,
                        ) ?? "Pendente"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">NCM</dt>
                      <dd className="font-medium text-slate-900">
                        {item.camposRascunho?.ncm ?? "Não recebido"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">EAN/GTIN</dt>
                      <dd className="font-medium text-slate-900">
                        {item.camposRascunho?.ean ?? "Não recebido"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-slate-500">
                        Peso e dimensões
                      </dt>
                      <dd className="font-medium text-slate-900">
                        {item.camposRascunho?.peso ?? "-"} kg ·{` `}
                        {item.camposRascunho?.altura ?? "-"} ×{` `}
                        {item.camposRascunho?.largura ?? "-"} ×{` `}
                        {item.camposRascunho?.comprimento ?? "-"} cm
                      </dd>
                    </div>
                  </dl>
                </section>
              ) : null}

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

const SECOES_LOJA_RASCUNHO = [
  { id: "general", nome: "Catálogo" },
  { id: "new", nome: "Novidades" },
  { id: "sale", nome: "Ofertas" },
  { id: "featured", nome: "Destaques" },
  { id: "bestseller", nome: "+ Vendidos" },
] as const;

/** Tudo o que uma sessão de edição pode alterar, despachado junto. */
export type LoteEdicaoConciliacaoFornecedor = {
  preco: EntradaAjustarPrecosConciliacaoFornecedor | null;
  campos: EntradaAtualizarCamposRascunhosFornecedor[];
};

/** Campos que a edição da Conciliação sabe alterar, individual ou em massa. */
type CampoEdicaoConciliacao =
  | "preco"
  | "estoque"
  | "categoria"
  | "marca"
  | "secoes_loja"
  | "modalidade_comercial"
  | "prazo_entrega";

function ModalEdicaoRascunhos({
  aberto,
  itens,
  rascunhoIds,
  itemIndividual,
  categorias,
  marcas,
  processando,
  aoAlterarAbertura,
  aoAplicarLote,
}: {
  aberto: boolean;
  itens: ItemConciliacaoFornecedor[];
  rascunhoIds: string[];
  itemIndividual: ItemConciliacaoFornecedor | null;
  categorias: Array<{ id: string; nome: string }>;
  marcas: Array<{ id: string; nome: string }>;
  processando: boolean;
  aoAlterarAbertura: (aberto: boolean) => void;
  /** Recebe, de uma vez, tudo o que o gestor alterou nesta sessão de edição. */
  aoAplicarLote: (lote: LoteEdicaoConciliacaoFornecedor) => void;
}) {
  const [aba, setAba] = useState<
    "preco" | "estoque" | "comercial" | "classificacao"
  >("preco");
  const [estoqueInput, setEstoqueInput] = useState("0");
  const [operacaoPreco, setOperacaoPreco] =
    useState<OperacaoAjustePrecoRascunhoFornecedor>("aumentar_percentual");
  const [valorPreco, setValorPreco] = useState("10");
  const [campoComercial, setCampoComercial] = useState<
    "modalidade_comercial" | "prazo_entrega" | "secoes_loja"
  >("modalidade_comercial");
  const [campoClassificacao, setCampoClassificacao] = useState<
    "categoria" | "marca"
  >("categoria");
  const [categoriaId, setCategoriaId] = useState("");
  const [marcaId, setMarcaId] = useState("");
  const [secoesLoja, setSecoesLoja] = useState<string[]>(["general"]);
  const [modalidade, setModalidade] =
    useState<ModalidadeComercialRascunho>("dropshipping");
  const [prazoEntrega, setPrazoEntrega] = useState("");
  /**
   * Campos que o gestor realmente mexeu nesta sessão de edição.
   *
   * É o coração da semântica "não alterar": um campo fora deste conjunto nunca
   * entra no despacho, então cada produto preserva o valor individual que já
   * tinha. Sem isso, abrir o modal com dois produtos de marcas diferentes e
   * salvar acabaria igualando os dois pela marca que aparecia no formulário.
   */
  const [tocados, setTocados] = useState<Set<CampoEdicaoConciliacao>>(
    () => new Set(),
  );

  const marcarTocado = (campo: CampoEdicaoConciliacao) =>
    setTocados((atuais) => new Set(atuais).add(campo));

  useEffect(() => {
    if (!aberto) return;

    const pendencias = itemIndividual?.pendenciasObrigatorias ?? [];
    const possuiPendencia = (termo: string) =>
      pendencias.some((pendencia) =>
        pendencia.toLocaleLowerCase("pt-BR").includes(termo),
      );

    if (!itemIndividual) {
      setAba("preco");
    } else if (possuiPendencia("categoria")) {
      setAba("classificacao");
      setCampoClassificacao("categoria");
    } else if (possuiPendencia("marca")) {
      setAba("classificacao");
      setCampoClassificacao("marca");
    } else if (possuiPendencia("preço")) {
      setAba("preco");
    } else if (possuiPendencia("seção")) {
      setAba("comercial");
      setCampoComercial("secoes_loja");
    } else if (possuiPendencia("modalidade")) {
      setAba("comercial");
      setCampoComercial("modalidade_comercial");
    } else if (possuiPendencia("prazo")) {
      setAba("comercial");
      setCampoComercial("prazo_entrega");
    }

    setCategoriaId(itemIndividual?.camposRascunho?.categoriaId ?? "");
    setMarcaId(itemIndividual?.camposRascunho?.marcaId ?? "");
    setSecoesLoja(
      itemIndividual?.camposRascunho?.secoesLoja?.length
        ? itemIndividual.camposRascunho.secoesLoja
        : ["general"],
    );
    setModalidade(
      itemIndividual?.camposRascunho?.modalidadeComercial ?? "dropshipping",
    );
    setPrazoEntrega(itemIndividual?.camposRascunho?.prazoEntrega ?? "");
    setTocados(new Set());
    setOperacaoPreco("aumentar_percentual");
    setValorPreco("10");
    setEstoqueInput(
      typeof itemIndividual?.produto.estoque === "number"
        ? String(itemIndividual.produto.estoque)
        : "0",
    );
  }, [aberto, itemIndividual]);

  const valorPrecoNumerico = Number(valorPreco.replace(",", "."));
  const previewPrecos = itens.slice(0, 5).map((item) => ({
    item,
    novoPreco: calcularPrecoAjustadoPreview({
      item,
      operacao: operacaoPreco,
      valor: valorPrecoNumerico,
    }),
  }));
  const podeAplicarPreco =
    Number.isFinite(valorPrecoNumerico) && valorPrecoNumerico >= 0;
  const estoqueNumerico = Number(estoqueInput);
  const podeAplicarEstoque =
    Number.isInteger(estoqueNumerico) && estoqueNumerico >= 0;
  // Um campo só bloqueia se o gestor mexeu nele e deixou valor inválido.
  const invalidos: string[] = [];
  if (tocados.has("preco") && !podeAplicarPreco) invalidos.push("preço");
  if (tocados.has("estoque") && !podeAplicarEstoque) invalidos.push("estoque");
  if (tocados.has("categoria") && !categoriaId) invalidos.push("categoria");
  if (tocados.has("marca") && !marcaId) invalidos.push("marca");
  if (tocados.has("secoes_loja") && secoesLoja.length === 0)
    invalidos.push("seções");
  if (tocados.has("prazo_entrega") && !prazoEntrega.trim())
    invalidos.push("prazo");

  const podeAplicar =
    rascunhoIds.length > 0 && tocados.size > 0 && invalidos.length === 0;

  /**
   * Uma única ação final: despacha de uma vez tudo o que foi tocado.
   *
   * Campos fora de `tocados` não entram no lote — é assim que cada produto
   * mantém o valor individual que já tinha.
   */
  const aplicar = () => {
    const campos: EntradaAtualizarCamposRascunhosFornecedor[] = [];

    if (tocados.has("estoque")) {
      campos.push({
        rascunhoIds,
        campo: "estoque",
        estoque: Math.trunc(estoqueNumerico),
      });
    }
    if (tocados.has("categoria")) {
      campos.push({ rascunhoIds, campo: "categoria", categoriaId });
    }
    if (tocados.has("marca")) {
      campos.push({ rascunhoIds, campo: "marca", marcaId });
    }
    if (tocados.has("secoes_loja")) {
      campos.push({ rascunhoIds, campo: "secoes_loja", secoesLoja });
    }
    if (tocados.has("modalidade_comercial")) {
      campos.push({
        rascunhoIds,
        campo: "modalidade_comercial",
        modalidade,
      });
    }
    if (tocados.has("prazo_entrega")) {
      campos.push({
        rascunhoIds,
        campo: "prazo_entrega",
        prazoEntrega: prazoEntrega.trim(),
      });
    }

    aoAplicarLote({
      preco: tocados.has("preco")
        ? {
            rascunhoIds,
            operacao: operacaoPreco,
            valor: valorPrecoNumerico,
          }
        : null,
      campos,
    });
  };

  return (
    <Dialog open={aberto} onOpenChange={aoAlterarAbertura}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {itemIndividual
              ? "Editar rascunho"
              : `Editar ${rascunhoIds.length} rascunhos em massa`}
          </DialogTitle>
          <DialogDescription>
            A alteração afeta apenas os itens selecionados. Nada será publicado
            agora.
          </DialogDescription>
        </DialogHeader>

        {itemIndividual?.pendenciasObrigatorias?.length ? (
          <div className="flex flex-wrap gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
            {itemIndividual.pendenciasObrigatorias.map((pendencia) => (
              <Badge
                key={pendencia}
                variant="outline"
                className="border-amber-300 bg-white text-amber-800"
              >
                {pendencia}
              </Badge>
            ))}
          </div>
        ) : null}

        <Tabs
          value={aba}
          onValueChange={(valor) => setAba(valor as typeof aba)}
        >
          {/* Quatro abas para os dois caminhos. O que muda entre "criar" e
              "atualizar" é o que a publicação faz com cada campo, não o que o
              gestor pode revisar aqui. Grade de 2 colunas no celular para os
              rótulos não espremerem. */}
          {itens.length > 1 ? (
            <p className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Os {itens.length} itens podem ter valores diferentes entre si.
              Campos que você não alterar aqui{" "}
              <strong className="font-semibold">
                permanecem como estão em cada produto
              </strong>
              .
            </p>
          ) : null}

          <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="preco">Preço</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="classificacao">Classificação</TabsTrigger>
            <TabsTrigger value="comercial">Comercial</TabsTrigger>
          </TabsList>

          <TabsContent value="preco" className="space-y-4 pt-2">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["aumentar_percentual", "Aumentar %"],
                  ["diminuir_percentual", "Diminuir %"],
                  ["somar_valor_fixo", "Somar valor fixo"],
                  ["definir_valor_fixo", "Definir valor fixo"],
                ] as const
              ).map(([valor, label]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => {
                    setOperacaoPreco(valor);
                    marcarTocado("preco");
                  }}
                  className={`rounded-md border p-3 text-left text-sm font-medium transition ${
                    operacaoPreco === valor
                      ? "border-slate-900 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">
                {operacaoPreco.includes("percentual") ? "Percentual" : "Valor"}
              </span>
              <Input
                value={valorPreco}
                onChange={(evento) => setValorPreco(evento.target.value)}
                inputMode="decimal"
                placeholder={
                  operacaoPreco.includes("percentual") ? "10" : "30,00"
                }
              />
            </label>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[minmax(0,1fr)_110px_110px] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                <span>Produto</span>
                <span>Preço atual</span>
                <span>Novo preço</span>
              </div>
              <div className="divide-y divide-slate-100">
                {previewPrecos.map(({ item, novoPreco }) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_110px_110px] gap-2 px-3 py-2 text-sm"
                  >
                    <span className="truncate font-medium text-slate-900">
                      {nomeProdutoLegivel(item.produto.nome)}
                    </span>
                    <span>
                      {formatarMoeda(
                        item.produto.precoLoja ?? item.produto.precoFornecedor,
                      ) ?? "Pendente"}
                    </span>
                    <span className="font-semibold text-slate-950">
                      {formatarMoeda(novoPreco) ?? "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="estoque" className="space-y-4 pt-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">
                Estoque a aplicar
              </span>
              <Input
                value={estoqueInput}
                onChange={(evento) => {
                  setEstoqueInput(evento.target.value);
                  marcarTocado("estoque");
                }}
                inputMode="numeric"
                placeholder="0"
              />
            </label>
            <p className="text-xs text-slate-500">
              Este valor substitui o estoque recebido do fornecedor para o item
              selecionado. Ele será aplicado ao produto real quando a
              atualização for aprovada e publicada.
            </p>
          </TabsContent>

          <TabsContent value="comercial" className="space-y-4 pt-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">Campo</span>
              <select
                value={campoComercial}
                onChange={(evento) =>
                  setCampoComercial(
                    evento.target.value as typeof campoComercial,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3"
              >
                <option value="modalidade_comercial">
                  Modalidade comercial
                </option>
                <option value="prazo_entrega">Prazo de entrega</option>
                <option value="secoes_loja">Seções da Loja</option>
              </select>
            </label>
            {campoComercial === "modalidade_comercial" ? (
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Modalidade</span>
                <select
                  value={modalidade}
                  onChange={(evento) => {
                    setModalidade(
                      evento.target.value as ModalidadeComercialRascunho,
                    );
                    marcarTocado("modalidade_comercial");
                  }}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3"
                >
                  <option value="stock">Estoque próprio</option>
                  <option value="pre_sale">Pré-venda</option>
                  <option value="dropshipping">Dropshipping</option>
                  <option value="order_basis">Sob encomenda</option>
                </select>
              </label>
            ) : null}
            {campoComercial === "prazo_entrega" ? (
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">
                  Prazo de entrega
                </span>
                <Input
                  value={prazoEntrega}
                  onChange={(evento) => {
                    setPrazoEntrega(evento.target.value);
                    marcarTocado("prazo_entrega");
                  }}
                  placeholder="Ex.: 3 a 5 dias úteis"
                  maxLength={160}
                />
              </label>
            ) : null}
            {campoComercial === "secoes_loja" ? (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-slate-700">
                  Seções da Loja
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SECOES_LOJA_RASCUNHO.map((secao) => (
                    <label
                      key={secao.id}
                      className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
                    >
                      <CheckboxFornecedor
                        checked={secoesLoja.includes(secao.id)}
                        onCheckedChange={(marcado) => {
                          setSecoesLoja((atuais) =>
                            marcado === true
                              ? Array.from(new Set([...atuais, secao.id]))
                              : atuais.filter((id) => id !== secao.id),
                          );
                          marcarTocado("secoes_loja");
                        }}
                      />
                      {secao.nome}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
          </TabsContent>

          <TabsContent value="classificacao" className="space-y-4 pt-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-slate-700">Campo</span>
              <select
                value={campoClassificacao}
                onChange={(evento) =>
                  setCampoClassificacao(
                    evento.target.value as typeof campoClassificacao,
                  )
                }
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3"
              >
                <option value="categoria">Categoria</option>
                <option value="marca">Marca</option>
              </select>
            </label>
            {campoClassificacao === "categoria" ? (
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Categoria</span>
                <select
                  value={categoriaId}
                  onChange={(evento) => {
                    setCategoriaId(evento.target.value);
                    marcarTocado("categoria");
                  }}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Marca</span>
                <select
                  value={marcaId}
                  onChange={(evento) => {
                    setMarcaId(evento.target.value);
                    marcarTocado("marca");
                  }}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3"
                >
                  <option value="">Selecione uma marca</option>
                  {marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => aoAlterarAbertura(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!podeAplicar || processando}
            onClick={aplicar}
          >
            {processando ? "Aplicando..." : "Aplicar aos selecionados"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  textoAcaoIndisponivel = "Publicação bloqueada",
  mensagemAcaoIndisponivel,
  itens,
  resumoGlobal,
  filtroAtivo,
  buscaInicial,
  navegacaoFiltros,
  aoAjustarPrecosSelecionados,
  aoAtualizarCamposRascunhos,
  aoAlterarDecisaoRascunhos,
  categoriasLoja = [],
  marcasLoja = [],
}: TabelaConciliacaoFornecedorProps) {
  const router = useRouter();
  const [busca, setBusca] = useState(buscaInicial);
  const [itemDetalhes, setItemDetalhes] =
    useState<ItemConciliacaoFornecedor | null>(null);
  const [idsSelecionados, setIdsSelecionados] = useState<string[]>([]);
  const [modalCamposAberto, setModalCamposAberto] = useState(false);
  const [itemEdicaoIndividual, setItemEdicaoIndividual] =
    useState<ItemConciliacaoFornecedor | null>(null);
  const [processandoCampos, setProcessandoCampos] = useState(false);
  const [processandoDecisao, setProcessandoDecisao] = useState(false);
  const [confirmacaoDecisao, setConfirmacaoDecisao] = useState<{
    acao: "ignorar" | "desfazer" | "aprovar";
    ids: string[];
  } | null>(null);
  const itensFiltrados = itens;
  const totalPendencias = resumoGlobal.pendencias;
  const possuiPendencias = totalPendencias > 0;
  /**
   * Estado REAL do portão para a Publicação.
   *
   * Antes esta barra olhava só `resumo.pendencias` — ou seja, "falta algum dado
   * obrigatório?". Com o dado completo ela anunciava "Todos os produtos estão
   * prontos para publicação" e liberava o botão, mesmo com todos os itens ainda
   * em `pendente_conciliacao`. A Publicação, que só lista
   * `pronto_para_publicar`, abria vazia: o gestor percorria o fluxo inteiro e o
   * produto real nunca era atualizado.
   *
   * Agora o portão conta o que a Publicação vai realmente encontrar, e a
   * aprovação pendente deixa de ser invisível.
   */
  const portaoPublicacao = useMemo(
    () =>
      avaliarPortaoPublicacaoFornecedor(
        itens.map((item) => ({
          id: item.id,
          pendenciasObrigatorias: item.pendenciasObrigatorias,
          statusRascunho: item.camposRascunho?.statusRascunho ?? null,
          ignorado: item.acaoPrevista === "ignorar",
        })),
      ),
    [itens],
  );
  const idsAguardandoAprovacao = portaoPublicacao.idsAguardandoAprovacao;
  const podeAprovarEmLote =
    Boolean(aoAlterarDecisaoRascunhos) && idsAguardandoAprovacao.length > 0;
  const [aprovandoParaPublicar, setAprovandoParaPublicar] = useState(false);
  const [navegandoParaPublicacao, setNavegandoParaPublicacao] = useState(false);
  const idsFiltrados = useMemo(
    () => itensFiltrados.map((item) => item.id),
    [itensFiltrados],
  );
  const totalSelecionados = idsSelecionados.length;
  const itensSelecionados = useMemo(
    () => itens.filter((item) => idsSelecionados.includes(item.id)),
    [idsSelecionados, itens],
  );
  // "Aprovar atualização" só se aplica a itens vinculados — o botão em massa
  // atua apenas sobre esse subconjunto da seleção.
  const idsSelecionadosVinculados = useMemo(
    () =>
      itensSelecionados
        .filter((item) => item.statusVinculacao === "vinculado")
        .map((item) => item.id),
    [itensSelecionados],
  );
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
    { valor: "todos", label: "Todos", total: resumoGlobal.todos },
    {
      valor: "novos",
      label: "Novos",
      total: resumoGlobal.novos,
    },
    {
      valor: "vinculados",
      label: "Vinculados com alteração",
      total: resumoGlobal.vinculados,
    },
    {
      valor: "pendencias",
      label: "Pendências obrigatórias",
      total: resumoGlobal.pendencias,
    },
    { valor: "alertas", label: "Alertas", total: resumoGlobal.alertas },
    { valor: "prontos", label: "Prontos", total: resumoGlobal.prontos },
  ];

  function montarHrefFiltros({
    filtro = filtroAtivo,
    busca = buscaInicial,
  }: {
    filtro?: FiltroConciliacaoFornecedor;
    busca?: string;
  }) {
    const [caminho, consulta = ""] = navegacaoFiltros.hrefAtual.split("?");
    const parametros = new URLSearchParams(consulta);
    parametros.set(navegacaoFiltros.parametroPagina, "1");

    if (filtro === "todos") parametros.delete(navegacaoFiltros.parametroFiltro);
    else parametros.set(navegacaoFiltros.parametroFiltro, filtro);

    if (busca.trim())
      parametros.set(navegacaoFiltros.parametroBusca, busca.trim());
    else parametros.delete(navegacaoFiltros.parametroBusca);

    return `${caminho}?${parametros.toString()}`;
  }

  useEffect(() => {
    setBusca(buscaInicial);
    setIdsSelecionados([]);
  }, [buscaInicial, filtroAtivo, itens]);
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
  const aplicarLoteEdicao = async (lote: LoteEdicaoConciliacaoFornecedor) => {
    setProcessandoCampos(true);

    try {
      if (lote.preco && aoAjustarPrecosSelecionados) {
        const resultado = await aoAjustarPrecosSelecionados(lote.preco);
        if (!resultado.sucesso) {
          toast.error(resultado.erro ?? "Não foi possível ajustar os preços.");
          return;
        }
      }

      for (const entrada of lote.campos) {
        if (!aoAtualizarCamposRascunhos) break;
        const resultado = await aoAtualizarCamposRascunhos(entrada);
        if (!resultado.sucesso) {
          toast.error(
            resultado.erro ?? "Não foi possível alterar os rascunhos.",
          );
          return;
        }
      }

      const total = (lote.preco ? 1 : 0) + lote.campos.length;
      if (total === 0) return;

      toast.success(
        total === 1
          ? "Alteração aplicada."
          : `${total} alterações aplicadas de uma vez.`,
      );
      setIdsSelecionados([]);
      setItemEdicaoIndividual(null);
      setModalCamposAberto(false);
      router.refresh();
    } finally {
      setProcessandoCampos(false);
    }
  };

  const alterarDecisaoRascunhos = async () => {
    if (!aoAlterarDecisaoRascunhos || !confirmacaoDecisao) return;

    setProcessandoDecisao(true);
    const resultado = await aoAlterarDecisaoRascunhos({
      rascunhoIds: confirmacaoDecisao.ids,
      acao: confirmacaoDecisao.acao,
    });
    setProcessandoDecisao(false);

    if (!resultado.sucesso) {
      toast.error(resultado.erro ?? "Não foi possível alterar os itens.");
      return;
    }

    toast.success(resultado.mensagem ?? "Itens atualizados.");
    setIdsSelecionados([]);
    setConfirmacaoDecisao(null);
    router.refresh();
  };

  /**
   * Ação principal da etapa quando ainda há itens conciliados sem aprovação.
   *
   * Aprovar continua sendo um ato explícito do gestor — o rótulo do botão diz
   * exatamente o que vai acontecer e com quantos itens. O que muda é que ele
   * deixa de ser um passo escondido: antes, quem não descobrisse a ação em
   * massa "Aprovar atualização" seguia para a Publicação com as mãos vazias.
   */
  const aprovarEContinuarParaPublicacao = async () => {
    if (!aoAlterarDecisaoRascunhos || idsAguardandoAprovacao.length === 0) {
      return;
    }

    setAprovandoParaPublicar(true);
    try {
      const resultado = await aoAlterarDecisaoRascunhos({
        rascunhoIds: idsAguardandoAprovacao,
        acao: "aprovar",
      });

      if (!resultado.sucesso) {
        toast.error(
          resultado.erro ??
            "Não foi possível aprovar os itens para publicação.",
        );
        return;
      }

      toast.success(
        resultado.mensagem ??
          `${idsAguardandoAprovacao.length} item(ns) aprovado(s) para publicação.`,
      );

      if (hrefProximaEtapa) {
        setNavegandoParaPublicacao(true);
        router.push(hrefProximaEtapa);
        return;
      }

      router.refresh();
    } finally {
      setAprovandoParaPublicar(false);
    }
  };

  return (
    <section className="max-w-full min-w-0 space-y-4 overflow-x-clip">
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
              <p className="font-medium text-slate-900">{resumoGlobal.todos}</p>
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
                {resumoGlobal.prontos}
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
                {resumoGlobal.pendencias}
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
                {resumoGlobal.alertas}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Novos produtos
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {resumoGlobal.novos}
              </p>
            </div>
            <PackageCheck className="h-5 w-5 text-slate-500" />
          </CardContent>
        </Card>
      </div>

      <PainelFiltrosResponsivo
        quantidadeAtivos={
          Number(filtroAtivo !== "todos") + Number(Boolean(buscaInicial.trim()))
        }
      >
        <div className="space-y-3 border-t border-slate-100 p-3 md:border-t-0">
          <div className="flex gap-2 overflow-x-auto rounded-lg bg-slate-50 p-2">
            {filtros.map((item) => (
              <Link
                key={item.valor}
                href={montarHrefFiltros({ filtro: item.valor })}
                aria-current={filtroAtivo === item.valor ? "page" : undefined}
                className={`inline-flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                  filtroAtivo === item.valor
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    filtroAtivo === item.valor
                      ? "bg-white/15 text-white"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {item.total}
                </span>
              </Link>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(evento) => {
              evento.preventDefault();
              router.push(montarHrefFiltros({ busca }));
            }}
          >
            <label className="relative block min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar por produto ou código"
                className="h-10 pl-9"
              />
            </label>
            <Button type="submit" variant="outline">
              Buscar
            </Button>
            {filtroAtivo !== "todos" || buscaInicial.trim() ? (
              <Button variant="outline" size="icon" asChild>
                <Link
                  href={montarHrefFiltros({ filtro: "todos", busca: "" })}
                  aria-label="Limpar filtros"
                >
                  <FilterX className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </form>
          <p className="text-xs text-slate-500">
            “Selecionar todos” seleciona somente os itens visíveis desta página.
          </p>
        </div>
      </PainelFiltrosResponsivo>

      {totalSelecionados > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">
            {totalSelecionados} linha{totalSelecionados === 1 ? "" : "s"}{" "}
            selecionada{totalSelecionados === 1 ? "" : "s"}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {aoAtualizarCamposRascunhos ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setItemEdicaoIndividual(null);
                  setModalCamposAberto(true);
                }}
              >
                Alterar campos
              </Button>
            ) : null}
            {aoAlterarDecisaoRascunhos ? (
              <>
                {idsSelecionadosVinculados.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setConfirmacaoDecisao({
                        acao: "aprovar",
                        ids: idsSelecionadosVinculados,
                      })
                    }
                  >
                    Aprovar atualização ({idsSelecionadosVinculados.length})
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setConfirmacaoDecisao({
                      acao: "ignorar",
                      ids: idsSelecionados,
                    })
                  }
                >
                  Marcar como ignorado
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setConfirmacaoDecisao({
                      acao: "desfazer",
                      ids: idsSelecionados,
                    })
                  }
                >
                  Desfazer decisão
                </Button>
              </>
            ) : (
              <Button type="button" size="sm" variant="secondary">
                Marcar como ignorado
              </Button>
            )}
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

      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white lg:block">
        <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="w-[48px]">
                <CheckboxFornecedor
                  checked={estadoSelecaoCabecalho}
                  onCheckedChange={(valor) =>
                    alternarSelecaoVisivel(valor === true)
                  }
                  aria-label="Selecionar linhas visíveis"
                />
              </TableHead>
              <TableHead className="w-[25%]">Produto</TableHead>
              <TableHead className="w-[12%]">Destino</TableHead>
              <TableHead className="w-[20%]">Dados da loja</TableHead>
              <TableHead className="w-[13%]">Preço</TableHead>
              <TableHead className="w-[22%]">Status</TableHead>
              <TableHead className="w-[8%] text-right">Ações</TableHead>
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
                  <CheckboxFornecedor
                    checked={idsSelecionados.includes(item.id)}
                    onCheckedChange={(valor) =>
                      alternarSelecaoItem(item.id, valor === true)
                    }
                    aria-label={`Selecionar ${item.produto.nome}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex min-w-0 gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                      {item.produto.imagemUrl ? (
                        <img
                          src={item.produto.imagemUrl}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <PackageCheck className="m-3 h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {nomeProdutoLegivel(item.produto.nome)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.produto.codigo
                          ? `Código ${item.produto.codigo}`
                          : "Sem código"}
                        {typeof item.produto.estoque === "number"
                          ? ` · Estoque ${item.produto.estoque}`
                          : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Origem: {tipoOrigem === "api" ? "API" : "Arquivo"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={classeSituacao(item)}>
                    {item.statusVinculacao === "novo"
                      ? "Novo produto"
                      : "Produto vinculado"}
                  </Badge>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.statusVinculacao === "novo"
                      ? "Será criado na publicação"
                      : "Revisão de atualização"}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-xs">
                    <p>
                      <span className="text-slate-500">Marca:</span>{" "}
                      <span className="font-medium text-slate-800">
                        {item.camposRascunho?.marcaNome ?? "Pendente"}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">Categoria:</span>{" "}
                      <span className="font-medium text-slate-800">
                        {item.camposRascunho?.categoriaNome ?? "Pendente"}
                      </span>
                    </p>
                    <p className="line-clamp-2">
                      <span className="text-slate-500">Seções:</span>{" "}
                      <span className="font-medium text-slate-800">
                        {formatarSecoesLoja(item.camposRascunho?.secoesLoja)}
                      </span>
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {resumirPrecosLinha(item).map((preco, indice) => (
                    <p
                      key={preco.rotulo}
                      className={`text-xs text-slate-500${indice > 0 ? "mt-1" : ""}`}
                    >
                      {preco.rotulo}
                      <span
                        className={`block ${
                          preco.destaque
                            ? "font-semibold text-slate-950"
                            : "font-medium text-slate-700"
                        }`}
                      >
                        {preco.valor}
                      </span>
                    </p>
                  ))}
                </TableCell>
                <TableCell>
                  {item.status === "pendencia" ? (
                    <>
                      <div className="flex max-w-[240px] flex-wrap gap-1">
                        {item.pendenciasObrigatorias?.map((pendencia) => (
                          <Badge
                            key={pendencia}
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-[10px] font-medium text-amber-800"
                          >
                            {pendencia}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        Bloqueia publicação
                      </p>
                    </>
                  ) : (
                    <Badge variant="outline" className={classeSituacao(item)}>
                      {rotuloStatus(item.status)}
                    </Badge>
                  )}
                  <div className="mt-2 flex max-w-[220px] flex-wrap gap-1">
                    {item.status === "alerta"
                      ? item.alertas?.slice(0, 2).map((alerta) => (
                          <Badge
                            key={alerta}
                            variant="outline"
                            className="border-orange-200 bg-orange-50 text-[10px] font-medium text-orange-700"
                          >
                            {alerta}
                          </Badge>
                        ))
                      : null}
                  </div>
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(evento) => evento.stopPropagation()}
                >
                  {aoAtualizarCamposRascunhos ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setItemEdicaoIndividual(item);
                            setModalCamposAberto(true);
                          }}
                          aria-label="Editar rascunho"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar rascunho</TooltipContent>
                    </Tooltip>
                  ) : null}
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
                  {aoAlterarDecisaoRascunhos ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label="Ações do rascunho"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {item.statusVinculacao === "vinculado" ? (
                          <DropdownMenuItem
                            onSelect={() =>
                              setConfirmacaoDecisao({
                                acao: "aprovar",
                                ids: [item.id],
                              })
                            }
                          >
                            <CheckCircle2 />
                            Aprovar atualização
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onSelect={() =>
                            setConfirmacaoDecisao({
                              acao: "ignorar",
                              ids: [item.id],
                            })
                          }
                        >
                          <Ban />
                          Ignorar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            setConfirmacaoDecisao({
                              acao: "desfazer",
                              ids: [item.id],
                            })
                          }
                        >
                          <RotateCcw />
                          Desfazer decisão
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {itensFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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

      <SelecaoPaginaFornecedor
        total={idsFiltrados.length}
        selecionados={totalSelecionadosVisiveis}
        aoAlterar={alternarSelecaoVisivel}
        className="lg:hidden"
      />

      <div className="grid max-w-full min-w-0 gap-3 lg:hidden">
        {itensFiltrados.map((item) => (
          <article
            key={item.id}
            className="max-w-full min-w-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-xs"
            onClick={() => setItemDetalhes(item)}
          >
            <div className="flex min-w-0 flex-wrap items-start gap-3">
              <div className="flex min-w-0 gap-3">
                <CheckboxFornecedor
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
              <Badge
                variant="outline"
                className={`ml-auto max-w-full shrink-0 ${classeSituacao(item)}`}
              >
                {rotuloSituacao(item)}
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 text-sm">
              <div className="grid gap-3 rounded-md bg-slate-50 p-3 text-xs">
                <p>
                  <span className="text-slate-500">Destino:</span>{" "}
                  <strong>
                    {item.statusVinculacao === "novo"
                      ? "Novo produto"
                      : "Produto vinculado"}
                  </strong>
                </p>

                <ComparativoConciliacaoMobile item={item} />

                {item.status === "pendencia" ? (
                  <div className="flex flex-wrap gap-1">
                    {item.pendenciasObrigatorias?.map((pendencia) => (
                      <Badge
                        key={pendencia}
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-800"
                      >
                        {pendencia}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end gap-1">
                {aoAtualizarCamposRascunhos ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={(evento) => {
                      evento.stopPropagation();
                      setItemEdicaoIndividual(item);
                      setModalCamposAberto(true);
                    }}
                    aria-label="Editar rascunho"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : null}
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
                {aoAlterarDecisaoRascunhos ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(evento) => evento.stopPropagation()}
                        aria-label="Ações do rascunho"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.statusVinculacao === "vinculado" ? (
                        <DropdownMenuItem
                          onSelect={() =>
                            setConfirmacaoDecisao({
                              acao: "aprovar",
                              ids: [item.id],
                            })
                          }
                        >
                          <CheckCircle2 />
                          Aprovar atualização
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        onSelect={() =>
                          setConfirmacaoDecisao({
                            acao: "ignorar",
                            ids: [item.id],
                          })
                        }
                      >
                        <Ban />
                        Ignorar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          setConfirmacaoDecisao({
                            acao: "desfazer",
                            ids: [item.id],
                          })
                        }
                      >
                        <RotateCcw />
                        Desfazer decisão
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
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

      <ModalEdicaoRascunhos
        aberto={modalCamposAberto}
        itens={
          itemEdicaoIndividual ? [itemEdicaoIndividual] : itensSelecionados
        }
        rascunhoIds={
          itemEdicaoIndividual ? [itemEdicaoIndividual.id] : idsSelecionados
        }
        itemIndividual={itemEdicaoIndividual}
        categorias={categoriasLoja}
        marcas={marcasLoja}
        processando={processandoCampos}
        aoAlterarAbertura={(aberto) => {
          setModalCamposAberto(aberto);
          if (!aberto) setItemEdicaoIndividual(null);
        }}
        aoAplicarLote={aplicarLoteEdicao}
      />

      <Dialog
        open={Boolean(confirmacaoDecisao)}
        onOpenChange={(aberto) => {
          if (!aberto && !processandoDecisao) setConfirmacaoDecisao(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmacaoDecisao?.acao === "ignorar"
                ? "Ignorar produtos"
                : confirmacaoDecisao?.acao === "aprovar"
                  ? "Aprovar atualização"
                  : "Desfazer decisão"}
            </DialogTitle>
            <DialogDescription>
              {confirmacaoDecisao?.acao === "aprovar"
                ? `Esta ação libera ${confirmacaoDecisao?.ids.length ?? 0} atualização${(confirmacaoDecisao?.ids.length ?? 0) === 1 ? "" : "ões"} para a Publicação. Deseja continuar?`
                : `Esta ação removerá ${confirmacaoDecisao?.ids.length ?? 0} rascunho${(confirmacaoDecisao?.ids.length ?? 0) === 1 ? "" : "s"} da Conciliação. Deseja continuar?`}
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            {confirmacaoDecisao?.acao === "ignorar"
              ? "Os itens ficarão como Ignorados na Vinculação."
              : confirmacaoDecisao?.acao === "aprovar"
                ? "O preço e o estoque revisados serão aplicados ao produto real quando a Publicação for confirmada."
                : "Os itens voltarão sem decisão para a Vinculação."}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={processandoDecisao}
              onClick={() => setConfirmacaoDecisao(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={processandoDecisao}
              onClick={alterarDecisaoRascunhos}
            >
              {processandoDecisao ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p
            className={`text-sm font-medium ${
              possuiPendencias
                ? "text-amber-700"
                : portaoPublicacao.totalAprovados > 0
                  ? "text-emerald-700"
                  : "text-slate-800"
            }`}
          >
            {possuiPendencias
              ? `Publicação bloqueada: ${totalPendencias} produto${totalPendencias === 1 ? "" : "s"} com pendências obrigatórias.`
              : idsAguardandoAprovacao.length > 0
                ? `${idsAguardandoAprovacao.length} ${idsAguardandoAprovacao.length === 1 ? "item" : "itens"} conciliado${idsAguardandoAprovacao.length === 1 ? "" : "s"} aguardando aprovação.`
                : portaoPublicacao.totalAprovados > 0
                  ? `${portaoPublicacao.totalAprovados} ${portaoPublicacao.totalAprovados === 1 ? "item" : "itens"} aprovado${portaoPublicacao.totalAprovados === 1 ? "" : "s"} e pronto${portaoPublicacao.totalAprovados === 1 ? "" : "s"} para publicar.`
                  : "Nada aprovado nesta etapa ainda."}
          </p>
          {/* O gestor precisa saber o que a próxima tela vai encontrar ANTES de
              sair daqui — era exatamente isso que faltava. */}
          {!possuiPendencias && idsAguardandoAprovacao.length > 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              Aprovar aplica o que está em “A publicar” ao produto real da loja.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href={hrefVoltar}>Voltar para vínculos</Link>
          </Button>

          {possuiPendencias || !hrefProximaEtapa ? (
            <div className="flex flex-col items-stretch gap-1 sm:items-end">
              <Button type="button" disabled>
                {!hrefProximaEtapa
                  ? textoAcaoIndisponivel
                  : "Publicação bloqueada"}
              </Button>
              {!hrefProximaEtapa && mensagemAcaoIndisponivel ? (
                <p className="max-w-sm text-xs text-slate-500 sm:text-right">
                  {mensagemAcaoIndisponivel}
                </p>
              ) : null}
            </div>
          ) : podeAprovarEmLote ? (
            <Button
              type="button"
              onClick={aprovarEContinuarParaPublicacao}
              disabled={aprovandoParaPublicar || navegandoParaPublicacao}
              aria-busy={aprovandoParaPublicar || navegandoParaPublicacao}
            >
              {aprovandoParaPublicar || navegandoParaPublicacao ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {navegandoParaPublicacao
                    ? "Abrindo publicação…"
                    : `Aprovando ${idsAguardandoAprovacao.length} ${idsAguardandoAprovacao.length === 1 ? "item" : "itens"}…`}
                </>
              ) : (
                `Aprovar e continuar (${idsAguardandoAprovacao.length})`
              )}
            </Button>
          ) : portaoPublicacao.totalAprovados > 0 ? (
            <Button asChild>
              {/* `IndicadorAberturaImportacao` usa `useLinkStatus`: o spinner
                  aparece no instante do clique, sem esperar o RSC responder. */}
              <Link href={hrefProximaEtapa} prefetch={false}>
                {textoAcaoPrincipal} ({portaoPublicacao.totalAprovados})
                <IndicadorAberturaImportacao />
              </Link>
            </Button>
          ) : (
            <div className="flex flex-col items-stretch gap-1 sm:items-end">
              <Button type="button" disabled>
                Nada para publicar
              </Button>
              <p className="max-w-sm text-xs text-slate-500 sm:text-right">
                Aprove ao menos um item para liberar a publicação.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
