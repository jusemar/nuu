"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  ChevronDown,
  ChevronLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  MoveRight,
  PackageCheck,
  PackagePlus,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ProdutoLaquilaMock } from "../../types/produto-laquila-mock.types";
import type {
  ProdutoApiStagingLaquilaCatalogo,
  ProgressoRecebidosApiLaquila,
} from "../../queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CHAVE_PRODUTOS_SELECIONADOS_MAPEAMENTO_LAQUILA } from "@/features/fornecedores/integracoes/laquila/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ITENS_POR_PAGINA = 10;
const OPCOES_ITENS_POR_PAGINA = [10, 20, 50, 100] as const;
const IMAGEM_PLACEHOLDER = "/produto-sem-foto.webp";

function formatarHorarioCurto(valor?: string) {
  if (!valor) return null;

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function formatarTempoConsulta(valor?: string) {
  if (!valor) return "Dados carregados há poucos minutos";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Dados carregados há poucos minutos";
  }

  const minutos = Math.max(
    0,
    Math.floor((Date.now() - data.getTime()) / 60000),
  );

  if (minutos < 1) return "Dados carregados agora";
  if (minutos === 1) return "Dados carregados há 1 min";
  if (minutos < 60) return `Dados carregados há ${minutos} min`;

  return `Dados carregados às ${formatarHorarioCurto(valor) ?? "--:--"}`;
}

type EstadoTriagemProdutoLaquila = "pendente" | "selecionado" | "ignorado";
type ProdutoComDadosBrutos = {
  dadosBrutosJson?: Record<string, unknown>;
  nome?: string;
  codigo?: string;
  grupo?: string;
  categoria?: string;
  ncm?: string | null;
  status?: string;
};

type ProdutoSelecionadoMapeamentoLaquila = {
  cd_item: string;
  descricao: string;
  cd_ean: string;
  NCM: string;
  ds_ggrupo: string;
  ds_grupo: string;
  ds_sgrupo: string;
  lista_fotos: unknown;
  vl_preco: string | number | null;
  qt_saldo: string | number | null;
  peso_bruto: string;
  altura_caixa: string;
  largura_caixa: string;
  comprimento_caixa: string;
  dadosBrutosJson: Record<string, unknown>;
};

const rotulosTriagem: Record<EstadoTriagemProdutoLaquila, string> = {
  pendente: "Pendente",
  selecionado: "Selecionado",
  ignorado: "Ignorado",
};

const estilosTriagem: Record<EstadoTriagemProdutoLaquila, string> = {
  pendente: "border-slate-200 bg-slate-50 text-slate-700",
  selecionado: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ignorado: "border-slate-200 bg-slate-100 text-slate-600",
};

const camposPayloadLaquila = [
  "cd_item",
  "descricao",
  "cd_ean",
  "NCM",
  "ds_ggrupo",
  "ds_grupo",
  "ds_sgrupo",
  "lista_fotos",
  "peso_bruto",
  "peso_liquido",
  "largura_caixa",
  "altura_caixa",
  "comprimento_caixa",
  "unidade",
  "situacao",
] as const;

function formatarRotuloCampo(valor: string) {
  const texto = valor.trim().replace(/[_-]+/g, " ");

  if (!texto) return "-";

  return texto
    .split(/\s+/)
    .map((parte) =>
      parte.length > 3 ? parte.charAt(0).toUpperCase() + parte.slice(1) : parte,
    )
    .join(" ");
}

function lerTextoBruto(
  dadosBrutosJson: Record<string, unknown>,
  chaves: readonly string[],
) {
  for (const chave of chaves) {
    const valor = dadosBrutosJson[chave];

    if (typeof valor === "string" && valor.trim().length > 0) {
      return valor.trim();
    }

    if (typeof valor === "number" && Number.isFinite(valor)) {
      return String(valor);
    }
  }

  return "";
}

function obterTextoProduto(
  produto: ProdutoComDadosBrutos,
  chaves: readonly string[],
  fallback = "",
) {
  return (
    lerTextoBruto(produto.dadosBrutosJson ?? {}, chaves) || fallback.trim()
  );
}

function correspondeFiltro(valor: string, filtro: string) {
  if (filtro === "todos") return true;

  return normalizarTexto(valor) === normalizarTexto(filtro);
}

function extrairOpcoesFiltro(
  produtos: ProdutoComDadosBrutos[],
  chaves: readonly string[],
  fallback: (produto: ProdutoComDadosBrutos) => string = () => "",
) {
  return Array.from(
    new Set(
      produtos
        .map((produto) => {
          const valor = lerTextoBruto(produto.dadosBrutosJson ?? {}, chaves);
          return valor || fallback(produto);
        })
        .map((valor) => valor.trim())
        .filter((valor) => valor.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function formatarSituacaoApi(valor: string) {
  return formatarRotuloCampo(valor);
}

function obterTriagemProduto(
  triagens: Record<string, EstadoTriagemProdutoLaquila>,
  produtoId: string,
) {
  return triagens[produtoId] ?? "pendente";
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarPrecoRecebido(valor: number | null) {
  if (valor === null) return "Não recebido";

  return formatarMoeda(valor);
}

function formatarEstoqueRecebido(valor: number | null) {
  if (valor === null) return "Não recebido";

  return String(valor);
}

function obterCodigoFornecedorProduto(produto: ProdutoComDadosBrutos) {
  return obterTextoProduto(produto, ["cd_item"], produto.codigo ?? "-");
}

function obterNcmProduto(produto: ProdutoComDadosBrutos) {
  return obterTextoProduto(produto, ["NCM", "ncm"], produto.ncm ?? "-");
}

function obterPartesClassificacaoProduto(produto: ProdutoComDadosBrutos) {
  const macroGrupo = obterTextoProduto(produto, ["ds_ggrupo"]);
  const grupo = obterTextoProduto(produto, ["ds_grupo"]);
  const subgrupo = obterTextoProduto(produto, ["ds_sgrupo"]);
  const partes = [macroGrupo, grupo, subgrupo].filter(
    (parte) => parte.trim().length > 0,
  );

  return {
    macroGrupo,
    grupo,
    subgrupo,
    textoCompleto: partes.length > 0 ? partes.join(" > ") : "Sem classificação",
  };
}

function ClassificacaoProdutoRecebido({
  produto,
}: {
  produto: ProdutoComDadosBrutos;
}) {
  const { macroGrupo, grupo, subgrupo, textoCompleto } =
    obterPartesClassificacaoProduto(produto);

  if (!macroGrupo && !grupo && !subgrupo) {
    return <span className="text-sm text-slate-400">Sem classificação</span>;
  }

  return (
    <div className="max-w-[320px] text-sm leading-snug" title={textoCompleto}>
      <p className="font-medium text-slate-800">
        {[macroGrupo, grupo]
          .filter((parte) => parte.trim().length > 0)
          .join(" > ")}
      </p>
      {subgrupo ? (
        <p className="mt-1 inline-flex max-w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
          {subgrupo}
        </p>
      ) : null}
    </div>
  );
}

function ImagemProdutoRecebido({
  imagemUrl,
  nome,
  tamanho,
  onClick,
}: {
  imagemUrl: string;
  nome: string;
  tamanho: "sm" | "md";
  onClick?: () => void;
}) {
  const dimensao = tamanho === "sm" ? "h-10 w-10" : "h-14 w-14";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`Ampliar imagem de ${nome}`}
      className={`${dimensao} overflow-hidden rounded-md border border-slate-100 bg-slate-50 disabled:cursor-default`}
    >
      <img
        src={imagemUrl || IMAGEM_PLACEHOLDER}
        alt={nome}
        loading="lazy"
        className="h-full w-full object-cover transition-transform hover:scale-105"
        onError={(evento) => {
          evento.currentTarget.src = IMAGEM_PLACEHOLDER;
        }}
      />
    </button>
  );
}

function formatarDataRecebimento(data: Date | string) {
  const dataRecebimento = data instanceof Date ? data : new Date(data);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(dataRecebimento);
}

function obterValorPayload(
  dadosBrutosJson: Record<string, unknown>,
  campo: string,
) {
  return dadosBrutosJson[campo];
}

function obterValorTextoPayload(
  produto: ProdutoLaquilaMock,
  campo: string,
  fallback = "",
) {
  const valor = obterValorPayload(produto.dadosBrutosJson ?? {}, campo);

  if (typeof valor === "string" && valor.trim().length > 0) {
    return valor.trim();
  }

  if (typeof valor === "number" && Number.isFinite(valor)) {
    return String(valor);
  }

  return fallback;
}

function obterValorNumeroOuTextoPayload(
  produto: ProdutoLaquilaMock,
  campo: string,
  fallback: string | number | null,
) {
  const valor = obterValorPayload(produto.dadosBrutosJson ?? {}, campo);

  if (typeof valor === "string" || typeof valor === "number") {
    return valor;
  }

  return fallback;
}

function extrairListaFotos(valor: unknown) {
  if (Array.isArray(valor)) {
    return valor
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }

  if (typeof valor !== "string") return [];

  return valor
    .split(/[\n,;|]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatarValorPayload(campo: string, valor: unknown) {
  if (campo === "lista_fotos") {
    const fotos = extrairListaFotos(valor);

    if (fotos.length === 0) return <span className="text-slate-400">-</span>;

    return (
      <div className="space-y-1">
        {fotos.map((foto) => (
          <p key={foto} className="font-mono text-xs break-all">
            {foto}
          </p>
        ))}
      </div>
    );
  }

  if (valor === null || valor === undefined || valor === "") {
    return <span className="text-slate-400">-</span>;
  }

  if (Array.isArray(valor)) {
    return (
      <div className="space-y-1">
        {valor.map((item, indice) => (
          <p key={`${String(item)}-${indice}`} className="break-words">
            {String(item)}
          </p>
        ))}
      </div>
    );
  }

  if (typeof valor === "object") {
    return (
      <code className="rounded bg-slate-50 px-1 py-0.5 text-xs break-words text-slate-700">
        {JSON.stringify(valor)}
      </code>
    );
  }

  return <span className="break-words">{String(valor)}</span>;
}

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function filtrarProdutos({
  produtos,
  busca,
  macroGrupo,
  grupo,
  subgrupo,
  ncm,
  triagem,
  triagens,
}: {
  produtos: ProdutoLaquilaMock[];
  busca: string;
  macroGrupo: string;
  grupo: string;
  subgrupo: string;
  ncm: string;
  triagem: string;
  triagens: Record<string, EstadoTriagemProdutoLaquila>;
}) {
  const buscaNormalizada = normalizarTexto(busca.trim());

  return produtos.filter((produto) => {
    const descricao = obterTextoProduto(produto, ["descricao"], produto.nome);
    const codigoFornecedor = obterTextoProduto(
      produto,
      ["cd_item"],
      produto.codigo,
    );
    const macroGrupoProduto =
      obterTextoProduto(produto, ["ds_ggrupo"]) || produto.grupo;
    const grupoProduto =
      obterTextoProduto(produto, ["ds_grupo"]) || produto.grupo;
    const subgrupoProduto =
      obterTextoProduto(produto, ["ds_sgrupo"]) || produto.categoria;
    const ncmProduto = obterTextoProduto(produto, ["NCM", "ncm"], produto.ncm);
    const estadoTriagem = obterTriagemProduto(triagens, produto.id);

    const correspondeBusca =
      !buscaNormalizada ||
      normalizarTexto(`${descricao} ${codigoFornecedor}`).includes(
        buscaNormalizada,
      );

    const correspondeMacroGrupo = correspondeFiltro(
      macroGrupoProduto,
      macroGrupo,
    );
    const correspondeGrupo = correspondeFiltro(grupoProduto, grupo);
    const correspondeSubgrupo = correspondeFiltro(subgrupoProduto, subgrupo);
    const correspondeNcm = correspondeFiltro(ncmProduto, ncm);
    const correspondeTriagem = triagem === "todos" || estadoTriagem === triagem;

    return (
      correspondeBusca &&
      correspondeMacroGrupo &&
      correspondeGrupo &&
      correspondeSubgrupo &&
      correspondeNcm &&
      correspondeTriagem
    );
  });
}

function ResumoCard({
  titulo,
  valor,
  icone: Icone,
  tom,
}: {
  titulo: string;
  valor: number;
  icone: typeof Boxes;
  tom: string;
}) {
  return (
    <Card className="rounded-lg py-4 shadow-none">
      <CardContent className="flex items-center justify-between gap-3 px-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{titulo}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{valor}</p>
        </div>
        <div className={`rounded-md p-2 ${tom}`}>
          <Icone className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProdutoMobileCard({
  produto,
  selecionado,
  triagem,
  alternarSelecao,
  adicionarAoFluxo,
  removerDoFluxo,
  ignorarProduto,
  desfazerTriagem,
  abrirDetalhes,
  abrirImagem,
}: {
  produto: ProdutoLaquilaMock;
  selecionado: boolean;
  triagem: EstadoTriagemProdutoLaquila;
  alternarSelecao: (id: string) => void;
  adicionarAoFluxo: (id: string) => void;
  removerDoFluxo: (id: string) => void;
  ignorarProduto: (id: string) => void;
  desfazerTriagem: (id: string) => void;
  abrirDetalhes: (produto: ProdutoLaquilaMock) => void;
  abrirImagem: (produto: ProdutoLaquilaMock) => void;
}) {
  const codigoFornecedor = obterCodigoFornecedorProduto(produto);
  const ncmProduto = obterNcmProduto(produto);

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-xs ${
        triagem === "ignorado" ? "bg-slate-50/80 opacity-75" : ""
      }`}
    >
      <div className="flex gap-3">
        <Checkbox
          checked={selecionado}
          onCheckedChange={() => alternarSelecao(produto.id)}
          aria-label={`Selecionar ${produto.nome}`}
          className="mt-1"
        />
        <ImagemProdutoRecebido
          imagemUrl={produto.imagemUrl}
          nome={produto.nome}
          tamanho="md"
          onClick={() => abrirImagem(produto)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">
                {produto.nome}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                Código{" "}
                <span className="font-mono text-slate-600">
                  {codigoFornecedor}
                </span>{" "}
                · NCM{" "}
                <span className="font-mono text-slate-600">{ncmProduto}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-start">
              <Badge variant="outline" className={estilosTriagem[triagem]}>
                {rotulosTriagem[triagem]}
              </Badge>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="col-span-2">
              <p className="text-slate-500">Classificação</p>
              <ClassificacaoProdutoRecebido produto={produto} />
            </div>
            <div>
              <p className="text-slate-500">Preço</p>
              <p className="font-medium text-slate-900">
                {formatarPrecoRecebido(produto.preco)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Estoque</p>
              <p className="font-medium text-slate-900">
                {formatarEstoqueRecebido(produto.estoque)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {triagem === "selecionado" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => removerDoFluxo(produto.id)}
              >
                Selecionado
              </Button>
            ) : triagem === "ignorado" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => desfazerTriagem(produto.id)}
              >
                Desfazer
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-8"
                onClick={() => adicionarAoFluxo(produto.id)}
              >
                Selecionar
              </Button>
            )}
            {triagem !== "ignorado" ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-slate-600"
                onClick={() => ignorarProduto(produto.id)}
              >
                Ignorar
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-8 px-2"
              onClick={() => abrirDetalhes(produto)}
              aria-label="Detalhes"
            >
              <Eye className="mr-1 h-4 w-4" />
              Detalhes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DrawerDadosRecebidosFornecedor({
  produto,
  aberto,
  aoAlterarAbertura,
}: {
  produto: ProdutoLaquilaMock | null;
  aberto: boolean;
  aoAlterarAbertura: (aberto: boolean) => void;
}) {
  const [jsonAberto, setJsonAberto] = useState(false);
  const dadosBrutosJson = produto?.dadosBrutosJson ?? {};

  return (
    <Sheet open={aberto} onOpenChange={aoAlterarAbertura}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
        {produto ? (
          <>
            <SheetHeader className="border-b border-slate-200 px-5 py-5 text-left">
              <SheetTitle className="text-lg">
                Dados recebidos do fornecedor
              </SheetTitle>
              <SheetDescription className="max-w-md">
                Resposta crua da API. Nenhum desses campos está na loja ainda —
                você decide o que vira produto.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-5 px-5 py-5">
              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">Recebido</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {produto.recebidoEm
                      ? formatarDataRecebimento(produto.recebidoEm)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Situação API
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {formatarSituacaoApi(
                      obterTextoProduto(
                        produto,
                        ["situacao"],
                        obterTextoProduto(produto, ["status"], "Sem status"),
                      ),
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Origem</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    Laquila API
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Código fornecedor
                  </p>
                  <p className="mt-1 font-mono text-sm font-medium text-slate-950">
                    {obterCodigoFornecedorProduto(produto)}
                  </p>
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[minmax(110px,0.42fr)_1fr] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  <span>Campo recebido</span>
                  <span>Valor</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {camposPayloadLaquila.map((campo) => (
                    <div
                      key={campo}
                      className="grid grid-cols-[minmax(110px,0.42fr)_1fr] gap-3 px-3 py-2.5 text-sm"
                    >
                      <span className="font-mono text-xs text-slate-500">
                        {campo}
                      </span>
                      <div className="min-w-0 text-slate-900">
                        {formatarValorPayload(
                          campo,
                          obterValorPayload(dadosBrutosJson, campo),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <Collapsible open={jsonAberto} onOpenChange={setJsonAberto}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                  >
                    Ver JSON cru
                    {jsonAberto ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-3 text-xs text-slate-50">
                    {JSON.stringify(dadosBrutosJson, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <SheetFooter className="border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Fechar
                </Button>
              </SheetClose>
              <Button type="button" disabled>
                Promover para conciliação
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function PreviewImagemProduto({
  produto,
  aberto,
  aoAlterarAbertura,
}: {
  produto: ProdutoLaquilaMock | null;
  aberto: boolean;
  aoAlterarAbertura: (aberto: boolean) => void;
}) {
  return (
    <Dialog open={aberto} onOpenChange={aoAlterarAbertura}>
      <DialogContent className="max-w-3xl p-0">
        {produto ? (
          <>
            <DialogHeader className="border-b border-slate-200 px-5 py-4">
              <DialogTitle className="text-base">
                Imagem recebida da API
              </DialogTitle>
              <DialogDescription className="line-clamp-1">
                {obterCodigoFornecedorProduto(produto)} · {produto.nome}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-slate-50 p-4">
              <img
                src={produto.imagemUrl || IMAGEM_PLACEHOLDER}
                alt={produto.nome}
                className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg border border-slate-200 bg-white object-contain"
                onError={(evento) => {
                  evento.currentTarget.src = IMAGEM_PLACEHOLDER;
                }}
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type PreviaProdutosLaquilaMockProps = {
  produtos: ProdutoApiStagingLaquilaCatalogo[];
  erroRecebidos?: string;
  tipoErroRecebidos?: "configuracao" | "api";
  totalRetornadoApi?: number;
  totalAposRecorte?: number;
  cacheUsado?: boolean;
  cacheExpiraEm?: string;
  consultadoEm?: string;
  origemDados?: "api" | "cache" | "stale";
  avisoRecebidos?: string;
  atualizacaoForcada?: boolean;
};

type DadosRecebidosLaquila = {
  produtos: ProdutoApiStagingLaquilaCatalogo[];
  erroRecebidos?: string;
  erro?: string;
  tipoErroRecebidos?: "configuracao" | "api";
  tipoErro?: "configuracao" | "api";
  totalRetornadoApi?: number;
  totalAposRecorte?: number;
  cacheUsado?: boolean;
  cacheExpiraEm?: string;
  consultadoEm?: string;
  origemDados?: "api" | "cache" | "stale";
  avisoRecebidos?: string;
};

type EstadoAtualizacaoManual = {
  carregando: boolean;
  mensagem?: string;
  tipo?: "info" | "sucesso" | "erro";
};

function obterTituloEtapaProgresso(
  etapa: ProgressoRecebidosApiLaquila["etapaAtual"],
) {
  const titulos: Record<ProgressoRecebidosApiLaquila["etapaAtual"], string> = {
    preparando: "Preparando consulta",
    catalogo: "Catálogo de produtos",
    preco_estoque: "Preço e estoque",
    recorte: "Processando recorte",
    concluido: "Concluído",
    erro: "Atenção",
  };

  return titulos[etapa];
}

function obterPercentualProgresso(
  progresso: ProgressoRecebidosApiLaquila | null,
) {
  if (!progresso || progresso.percentual === null) return null;

  return Math.min(100, Math.max(0, Math.round(progresso.percentual)));
}

function obterOrigemProgressoInicial(
  origem: DadosRecebidosLaquila["origemDados"],
): ProgressoRecebidosApiLaquila["origemDados"] {
  if (origem === "cache") return "cache_fresco";

  return origem;
}

function BarraProgressoLaquila({
  progresso,
  mensagem,
}: {
  progresso: ProgressoRecebidosApiLaquila | null;
  mensagem: string;
}) {
  const percentual = obterPercentualProgresso(progresso);
  const etapa = progresso
    ? obterTituloEtapaProgresso(progresso.etapaAtual)
    : "Preparando consulta";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-slate-950">{mensagem}</p>
          <p className="text-xs text-slate-500">Etapa atual: {etapa}</p>
        </div>
        <span className="text-sm font-semibold text-slate-900">
          {percentual === null ? "Processando" : `${percentual}%`}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full bg-blue-600 transition-all duration-500 ${
            percentual === null ? "w-1/3 animate-pulse" : ""
          }`}
          style={percentual === null ? undefined : { width: `${percentual}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {progresso?.paginaAtual !== undefined ? (
          <span>
            Página {progresso.paginaAtual}
            {progresso.totalPaginasEstimado
              ? ` de até ${progresso.totalPaginasEstimado}`
              : ""}
          </span>
        ) : null}
        <span>Produtos encontrados: {progresso?.totalBrutoCarregado ?? 0}</span>
        <span>No recorte: {progresso?.totalAposRecorte ?? 0}</span>
        <span>
          Com preço/estoque: {progresso?.totalEnriquecidoComPrecoEstoque ?? 0}
        </span>
      </div>
    </div>
  );
}

function normalizarDadosRecebidosLaquila(
  dados: DadosRecebidosLaquila,
): DadosRecebidosLaquila {
  return {
    ...dados,
    produtos: dados.produtos.map((produto) => ({
      ...produto,
      recebidoEm: produto.recebidoEm
        ? new Date(produto.recebidoEm)
        : new Date(),
    })),
    erroRecebidos: dados.erroRecebidos ?? dados.erro,
    tipoErroRecebidos: dados.tipoErroRecebidos ?? dados.tipoErro,
  };
}

function obterClassesAvisoAtualizacaoManual(
  tipo: EstadoAtualizacaoManual["tipo"],
) {
  if (tipo === "sucesso") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tipo === "erro") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-blue-200 bg-blue-50 text-blue-800";
}

export function PreviaProdutosLaquilaMock({
  produtos: produtosIniciais,
  erroRecebidos,
  tipoErroRecebidos,
  totalRetornadoApi,
  totalAposRecorte,
  cacheUsado,
  cacheExpiraEm,
  consultadoEm,
  origemDados,
  avisoRecebidos,
  atualizacaoForcada,
}: PreviaProdutosLaquilaMockProps) {
  const [dadosRecebidos, setDadosRecebidos] = useState<DadosRecebidosLaquila>(
    () =>
      normalizarDadosRecebidosLaquila({
        produtos: produtosIniciais,
        erroRecebidos,
        tipoErroRecebidos,
        totalRetornadoApi,
        totalAposRecorte,
        cacheUsado,
        cacheExpiraEm,
        consultadoEm,
        origemDados,
        avisoRecebidos,
      }),
  );
  const [atualizacaoManual, setAtualizacaoManual] =
    useState<EstadoAtualizacaoManual>({
      carregando: false,
    });
  const [progressoAtualizacao, setProgressoAtualizacao] =
    useState<ProgressoRecebidosApiLaquila | null>(null);
  const [busca, setBusca] = useState("");
  const [macroGrupo, setMacroGrupo] = useState("todos");
  const [grupo, setGrupo] = useState("todos");
  const [subgrupo, setSubgrupo] = useState("todos");
  const [ncm, setNcm] = useState("todos");
  const [triagem, setTriagem] = useState("todos");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [triagens, setTriagens] = useState<
    Record<string, EstadoTriagemProdutoLaquila>
  >({});
  const [produtoEmDetalhe, setProdutoEmDetalhe] =
    useState<ProdutoLaquilaMock | null>(null);
  const [produtoImagem, setProdutoImagem] = useState<ProdutoLaquilaMock | null>(
    null,
  );
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(ITENS_POR_PAGINA);
  const produtos = dadosRecebidos.produtos;

  const opcoesMacroGrupo = useMemo(
    () =>
      extrairOpcoesFiltro(produtos, ["ds_ggrupo"], (produto) =>
        obterTextoProduto(produto, ["grupo"], "Sem macro grupo"),
      ),
    [produtos],
  );

  const opcoesGrupo = useMemo(
    () =>
      extrairOpcoesFiltro(produtos, ["ds_grupo"], (produto) =>
        obterTextoProduto(produto, ["grupo"], "Sem grupo"),
      ),
    [produtos],
  );

  const opcoesSubgrupo = useMemo(
    () =>
      extrairOpcoesFiltro(produtos, ["ds_sgrupo"], (produto) =>
        obterTextoProduto(produto, ["categoria"], "Sem subgrupo"),
      ),
    [produtos],
  );

  const opcoesNcm = useMemo(
    () =>
      extrairOpcoesFiltro(produtos, ["NCM", "ncm"], (produto) =>
        obterTextoProduto(produto, ["ncm"], "-"),
      ),
    [produtos],
  );

  const produtosFiltrados = useMemo(
    () =>
      filtrarProdutos({
        produtos,
        busca,
        macroGrupo,
        grupo,
        subgrupo,
        ncm,
        triagem,
        triagens,
      }),
    [busca, macroGrupo, grupo, ncm, produtos, subgrupo, triagem, triagens],
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(produtosFiltrados.length / itensPorPagina),
  );
  const paginaAtualSegura = Math.min(paginaAtual, totalPaginas);
  const inicioPagina = (paginaAtualSegura - 1) * itensPorPagina;
  const produtosVisiveis = produtosFiltrados.slice(
    inicioPagina,
    inicioPagina + itensPorPagina,
  );
  const intervaloInicial =
    produtosFiltrados.length === 0 ? 0 : inicioPagina + 1;
  const intervaloFinal = Math.min(
    inicioPagina + itensPorPagina,
    produtosFiltrados.length,
  );
  const todosVisiveisSelecionados =
    produtosVisiveis.length > 0 &&
    produtosVisiveis.every((produto) => selecionados.includes(produto.id));
  const estadoSelecaoCabecalho = todosVisiveisSelecionados
    ? true
    : produtosVisiveis.some((produto) => selecionados.includes(produto.id))
      ? "indeterminate"
      : false;
  const totalSelecionadosFluxo = produtos.filter(
    (produto) => obterTriagemProduto(triagens, produto.id) === "selecionado",
  ).length;
  const totalIgnoradosFluxo = produtos.filter(
    (produto) => obterTriagemProduto(triagens, produto.id) === "ignorado",
  ).length;
  const totalPendentesFluxo = Math.max(
    produtos.length - totalSelecionadosFluxo - totalIgnoradosFluxo,
    0,
  );

  const totais = {
    encontrados: produtos.length,
    selecionados: totalSelecionadosFluxo,
    ignorados: totalIgnoradosFluxo,
    pendentes: totalPendentesFluxo,
  };
  const filtrosAtivos =
    busca.trim().length > 0 ||
    macroGrupo !== "todos" ||
    grupo !== "todos" ||
    subgrupo !== "todos" ||
    ncm !== "todos" ||
    triagem !== "todos";
  const cacheExpiraEmFormatado = formatarHorarioCurto(
    dadosRecebidos.cacheExpiraEm,
  );
  const textoCache = formatarTempoConsulta(dadosRecebidos.consultadoEm);
  const mensagemErroRecebidos =
    dadosRecebidos.avisoRecebidos ??
    (dadosRecebidos.tipoErroRecebidos === "configuracao"
      ? "Não foi possível carregar a configuração da Laquila."
      : dadosRecebidos.tipoErroRecebidos === "api"
        ? "Falha ao consultar a API Laquila."
        : dadosRecebidos.erroRecebidos);

  useEffect(() => {
    if (!atualizacaoForcada) return;

    const url = new URL(window.location.href);

    url.searchParams.delete("atualizar");
    url.searchParams.delete("t");
    window.history.replaceState(null, "", url.toString());
  }, [atualizacaoForcada]);

  useEffect(() => {
    setDadosRecebidos(
      normalizarDadosRecebidosLaquila({
        produtos: produtosIniciais,
        erroRecebidos,
        tipoErroRecebidos,
        totalRetornadoApi,
        totalAposRecorte,
        cacheUsado,
        cacheExpiraEm,
        consultadoEm,
        origemDados,
        avisoRecebidos,
      }),
    );
  }, [
    produtosIniciais,
    erroRecebidos,
    tipoErroRecebidos,
    totalRetornadoApi,
    totalAposRecorte,
    cacheUsado,
    cacheExpiraEm,
    consultadoEm,
    origemDados,
    avisoRecebidos,
  ]);

  useEffect(() => {
    if (!atualizacaoManual.carregando) return;

    let ativo = true;

    async function consultarProgresso() {
      try {
        const resposta = await fetch(
          "/admin/fornecedores/integracoes/laquila/produtos/progresso",
          { cache: "no-store" },
        );

        if (!resposta.ok) return;

        const progresso =
          (await resposta.json()) as ProgressoRecebidosApiLaquila;

        if (ativo) {
          setProgressoAtualizacao(progresso);
        }
      } catch {
        // O progresso é auxiliar: falha aqui não deve interromper a atualização.
      }
    }

    consultarProgresso();
    const intervalo = window.setInterval(consultarProgresso, 1200);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [atualizacaoManual.carregando]);

  useEffect(() => {
    if (atualizacaoManual.carregando || !atualizacaoManual.mensagem) return;

    const timeout = window.setTimeout(() => {
      setProgressoAtualizacao(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [atualizacaoManual.carregando, atualizacaoManual.mensagem]);

  function alternarSelecao(id: string) {
    setSelecionados((atuais) =>
      atuais.includes(id)
        ? atuais.filter((produtoId) => produtoId !== id)
        : [...atuais, id],
    );
  }

  function alternarTodosVisiveis() {
    if (todosVisiveisSelecionados) {
      setSelecionados((atuais) =>
        atuais.filter(
          (produtoId) =>
            !produtosVisiveis.some((produto) => produto.id === produtoId),
        ),
      );
      return;
    }

    setSelecionados((atuais) =>
      Array.from(
        new Set([...atuais, ...produtosVisiveis.map((produto) => produto.id)]),
      ),
    );
  }

  function adicionarAoFluxo(id: string) {
    setTriagens((atuais) => ({ ...atuais, [id]: "selecionado" }));
  }

  function removerDoFluxo(id: string) {
    setTriagens((atuais) => ({ ...atuais, [id]: "pendente" }));
  }

  function ignorarProduto(id: string) {
    setTriagens((atuais) => ({ ...atuais, [id]: "ignorado" }));
  }

  function desfazerTriagem(id: string) {
    setTriagens((atuais) => ({ ...atuais, [id]: "pendente" }));
  }

  function adicionarSelecionadosAoFluxo() {
    setTriagens((atuais) => {
      const proximasTriagens = { ...atuais };

      selecionados.forEach((id) => {
        proximasTriagens[id] = "selecionado";
      });

      return proximasTriagens;
    });
    setSelecionados([]);
  }

  function removerSelecionadosDoFluxo() {
    setTriagens((atuais) => {
      const proximasTriagens = { ...atuais };

      selecionados.forEach((id) => {
        proximasTriagens[id] = "pendente";
      });

      return proximasTriagens;
    });
    setSelecionados([]);
  }

  function montarProdutosSelecionadosMapeamento() {
    return produtos
      .filter(
        (produto) =>
          obterTriagemProduto(triagens, produto.id) === "selecionado",
      )
      .map((produto): ProdutoSelecionadoMapeamentoLaquila => {
        const dadosBrutosJson = produto.dadosBrutosJson ?? {};

        return {
          cd_item: obterCodigoFornecedorProduto(produto),
          descricao: obterTextoProduto(produto, ["descricao"], produto.nome),
          cd_ean: obterValorTextoPayload(produto, "cd_ean", produto.ean),
          NCM: obterNcmProduto(produto),
          ds_ggrupo: obterValorTextoPayload(produto, "ds_ggrupo"),
          ds_grupo: obterValorTextoPayload(produto, "ds_grupo", produto.grupo),
          ds_sgrupo: obterValorTextoPayload(
            produto,
            "ds_sgrupo",
            produto.categoria,
          ),
          lista_fotos: dadosBrutosJson.lista_fotos ?? produto.imagemUrl,
          vl_preco: obterValorNumeroOuTextoPayload(
            produto,
            "vl_preco",
            produto.preco,
          ),
          qt_saldo: obterValorNumeroOuTextoPayload(
            produto,
            "qt_saldo",
            produto.estoque,
          ),
          peso_bruto: obterValorTextoPayload(produto, "peso_bruto"),
          altura_caixa: obterValorTextoPayload(produto, "altura_caixa"),
          largura_caixa: obterValorTextoPayload(produto, "largura_caixa"),
          comprimento_caixa: obterValorTextoPayload(
            produto,
            "comprimento_caixa",
          ),
          dadosBrutosJson,
        };
      });
  }

  function salvarSelecaoParaMapeamento() {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      CHAVE_PRODUTOS_SELECIONADOS_MAPEAMENTO_LAQUILA,
      JSON.stringify(montarProdutosSelecionadosMapeamento()),
    );
  }

  function limparFiltros() {
    setBusca("");
    setMacroGrupo("todos");
    setGrupo("todos");
    setSubgrupo("todos");
    setNcm("todos");
    setTriagem("todos");
    setPaginaAtual(1);
  }

  async function atualizarAgora() {
    if (atualizacaoManual.carregando) return;

    const controlador = new AbortController();
    const timeout = window.setTimeout(() => {
      controlador.abort();
    }, 95_000);

    setAtualizacaoManual({
      carregando: true,
      tipo: "info",
      mensagem: "Atualizando catálogo da Laquila em segundo plano...",
    });
    setProgressoAtualizacao({
      emAndamento: true,
      etapaAtual: "preparando",
      mensagem: "Preparando consulta da Laquila.",
      percentual: null,
      totalBrutoCarregado: produtos.length,
      totalAposRecorte: dadosRecebidos.totalAposRecorte ?? produtos.length,
      totalEnriquecidoComPrecoEstoque: 0,
      origemDados:
        obterOrigemProgressoInicial(dadosRecebidos.origemDados) ??
        "cache_fresco",
      atualizadoEm: new Date().toISOString(),
    });

    try {
      const resposta = await fetch(
        "/admin/fornecedores/integracoes/laquila/produtos/atualizar",
        {
          method: "POST",
          cache: "no-store",
          signal: controlador.signal,
        },
      );

      if (!resposta.ok) {
        throw new Error("Não foi possível atualizar agora.");
      }

      const resultado = normalizarDadosRecebidosLaquila(
        (await resposta.json()) as DadosRecebidosLaquila,
      );
      const devePreservarUltimoCatalogo =
        resultado.avisoRecebidos || resultado.origemDados === "stale";

      if (devePreservarUltimoCatalogo) {
        setAtualizacaoManual({
          carregando: false,
          tipo: "erro",
          mensagem:
            resultado.avisoRecebidos ??
            "Não foi possível atualizar agora. Mantivemos o último catálogo carregado.",
        });
        return;
      }

      setDadosRecebidos(resultado);
      setAtualizacaoManual({
        carregando: false,
        tipo: "sucesso",
        mensagem: "Catálogo atualizado agora.",
      });
    } catch (erro) {
      const demorouDemais = erro instanceof Error && erro.name === "AbortError";

      setAtualizacaoManual({
        carregando: false,
        tipo: "erro",
        mensagem: demorouDemais
          ? "A atualização demorou mais que o esperado. Mantivemos o último catálogo carregado."
          : "Não foi possível atualizar agora. Mantivemos o último catálogo carregado.",
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function irParaPagina(pagina: number) {
    setPaginaAtual(Math.min(Math.max(pagina, 1), totalPaginas));
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
            <Link href="/admin/fornecedores/integracoes/laquila">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Laquila
            </Link>
          </Button>

          <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Recebidos da API — Laquila
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Dados crus recebidos da Laquila antes de virar produto da loja.
          </p>
        </div>

        <Badge
          variant="outline"
          className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <CheckCircle2 className="h-3 w-3" />
          API Laquila
        </Badge>
      </section>

      {dadosRecebidos.erroRecebidos || dadosRecebidos.avisoRecebidos ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{mensagemErroRecebidos}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full bg-white sm:w-auto"
              onClick={atualizarAgora}
              disabled={atualizacaoManual.carregando}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  atualizacaoManual.carregando ? "animate-spin" : ""
                }`}
              />
              {atualizacaoManual.carregando
                ? "Atualizando..."
                : "Tentar novamente"}
            </Button>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <span>
            API Laquila: {dadosRecebidos.totalRetornadoApi ?? produtos.length}{" "}
            recebido
            {(dadosRecebidos.totalRetornadoApi ?? produtos.length) === 1
              ? ""
              : "s"}{" "}
            · {dadosRecebidos.totalAposRecorte ?? produtos.length} dentro do
            recorte
          </span>
          <span className="flex flex-wrap items-center gap-2">
            {dadosRecebidos.origemDados === "stale" ? (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700"
              >
                Último resultado
              </Badge>
            ) : dadosRecebidos.cacheUsado ? (
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-700"
              >
                Cache temporário
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                Consulta atualizada
              </Badge>
            )}
            <span>
              {dadosRecebidos.cacheUsado
                ? textoCache
                : "Dados atualizados agora"}
            </span>
            {cacheExpiraEmFormatado ? (
              <span>expira às {cacheExpiraEmFormatado}</span>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={atualizarAgora}
              disabled={atualizacaoManual.carregando}
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${
                  atualizacaoManual.carregando ? "animate-spin" : ""
                }`}
              />
              {atualizacaoManual.carregando
                ? "Atualizando..."
                : "Atualizar agora"}
            </Button>
          </span>
        </section>
      )}

      {atualizacaoManual.mensagem ? (
        <section
          className={`rounded-lg border p-3 text-sm shadow-xs ${obterClassesAvisoAtualizacaoManual(
            atualizacaoManual.tipo,
          )}`}
        >
          {atualizacaoManual.carregando ? (
            <BarraProgressoLaquila
              progresso={progressoAtualizacao}
              mensagem={atualizacaoManual.mensagem}
            />
          ) : (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 shrink-0" />
              <p>{atualizacaoManual.mensagem}</p>
            </div>
          )}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Encontrados"
          valor={totais.encontrados}
          icone={Boxes}
          tom="bg-slate-100 text-slate-700"
        />
        <ResumoCard
          titulo="Selecionados"
          valor={totais.selecionados}
          icone={PackagePlus}
          tom="bg-blue-50 text-blue-700"
        />
        <ResumoCard
          titulo="Ignorados"
          valor={totais.ignorados}
          icone={PackageCheck}
          tom="bg-emerald-50 text-emerald-700"
        />
        <ResumoCard
          titulo="Pendentes"
          valor={totais.pendentes}
          icone={AlertTriangle}
          tom="bg-amber-50 text-amber-700"
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={busca}
                onChange={(evento) => {
                  setBusca(evento.target.value);
                  setPaginaAtual(1);
                }}
                placeholder="Buscar por descrição ou código"
                className="pl-9"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={limparFiltros}
              disabled={!filtrosAtivos}
            >
              Limpar filtros
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Select
              value={macroGrupo}
              onValueChange={(valor) => {
                setMacroGrupo(valor);
                setPaginaAtual(1);
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Macro grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os macro grupos</SelectItem>
                {opcoesMacroGrupo.map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {opcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={grupo}
              onValueChange={(valor) => {
                setGrupo(valor);
                setPaginaAtual(1);
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos grupos</SelectItem>
                {opcoesGrupo.map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {opcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={subgrupo}
              onValueChange={(valor) => {
                setSubgrupo(valor);
                setPaginaAtual(1);
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Subgrupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os subgrupos</SelectItem>
                {opcoesSubgrupo.map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {opcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={ncm}
              onValueChange={(valor) => {
                setNcm(valor);
                setPaginaAtual(1);
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="NCM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os NCMs</SelectItem>
                {opcoesNcm.map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {opcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={triagem}
              onValueChange={(valor) => {
                setTriagem(valor);
                setPaginaAtual(1);
              }}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Triagem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="selecionado">Selecionado</SelectItem>
                <SelectItem value="ignorado">Ignorado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {selecionados.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-950 p-3 text-white shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">
            {selecionados.length} produto
            {selecionados.length === 1 ? "" : "s"} marcado
            {selecionados.length === 1 ? "" : "s"} na página
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={adicionarSelecionadosAoFluxo}
            >
              Adicionar ao fluxo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={removerSelecionadosDoFluxo}
            >
              Remover do fluxo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setSelecionados([])}
            >
              Limpar seleção
            </Button>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div>
          <p className="text-sm font-medium text-slate-700">
            {totalSelecionadosFluxo} produto
            {totalSelecionadosFluxo === 1 ? "" : "s"} selecionado
            {totalSelecionadosFluxo === 1 ? "" : "s"} para seguir
          </p>
          {totalSelecionadosFluxo === 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              Selecione pelo menos um produto para continuar.
            </p>
          ) : null}
        </div>
        {totalSelecionadosFluxo > 0 ? (
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link
              href="/admin/fornecedores/integracoes/laquila/mapeamento"
              onClick={salvarSelecaoParaMapeamento}
            >
              Continuar com {totalSelecionadosFluxo} produto
              {totalSelecionadosFluxo === 1 ? "" : "s"} selecionado
              {totalSelecionadosFluxo === 1 ? "" : "s"}
              <MoveRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button type="button" size="sm" disabled className="w-full sm:w-auto">
            Continuar para mapeamento
            <MoveRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-xs">
        {produtosVisiveis.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-500">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-950">
                {dadosRecebidos.erroRecebidos
                  ? "Falha ao carregar produtos"
                  : filtrosAtivos
                    ? "Nenhum produto encontrado com os filtros aplicados"
                    : "Nenhum produto encontrado para o recorte atual"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {dadosRecebidos.erroRecebidos
                  ? "Use Tentar novamente para consultar a API Laquila."
                  : filtrosAtivos
                    ? "Ajuste os filtros."
                    : "A API respondeu, mas nenhum item bateu com o recorte configurado."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={estadoSelecaoCabecalho}
                        onCheckedChange={alternarTodosVisiveis}
                        aria-label="Selecionar produtos visíveis"
                      />
                    </TableHead>
                    <TableHead className="min-w-[320px]">
                      Produto recebido
                    </TableHead>
                    <TableHead className="min-w-[220px]">
                      Classificação
                    </TableHead>
                    <TableHead className="w-28">Preço</TableHead>
                    <TableHead className="w-24">Estoque</TableHead>
                    <TableHead className="w-32">Triagem</TableHead>
                    <TableHead className="w-[220px] text-right">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosVisiveis.map((produto) => {
                    const estadoTriagem = obterTriagemProduto(
                      triagens,
                      produto.id,
                    );
                    const codigoFornecedor =
                      obterCodigoFornecedorProduto(produto);
                    const ncmProduto = obterNcmProduto(produto);
                    return (
                      <TableRow
                        key={produto.id}
                        className={
                          estadoTriagem === "ignorado"
                            ? "bg-slate-50/60 opacity-75"
                            : estadoTriagem === "selecionado"
                              ? "bg-emerald-50/30"
                              : ""
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={selecionados.includes(produto.id)}
                            onCheckedChange={() => alternarSelecao(produto.id)}
                            aria-label={`Selecionar ${produto.nome}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-3">
                            <ImagemProdutoRecebido
                              imagemUrl={produto.imagemUrl}
                              nome={produto.nome}
                              tamanho="sm"
                              onClick={() => setProdutoImagem(produto)}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-950">
                                {produto.nome}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                Código{" "}
                                <span className="font-mono text-slate-600">
                                  {codigoFornecedor}
                                </span>{" "}
                                · NCM{" "}
                                <span className="font-mono text-slate-600">
                                  {ncmProduto}
                                </span>
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ClassificacaoProdutoRecebido produto={produto} />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium whitespace-nowrap text-slate-900">
                            {formatarPrecoRecebido(produto.preco)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium whitespace-nowrap text-slate-900">
                            {formatarEstoqueRecebido(produto.estoque)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={estilosTriagem[estadoTriagem]}
                          >
                            {rotulosTriagem[estadoTriagem]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            {estadoTriagem === "selecionado" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => removerDoFluxo(produto.id)}
                              >
                                Selecionado
                              </Button>
                            ) : estadoTriagem === "ignorado" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => desfazerTriagem(produto.id)}
                              >
                                Desfazer
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                className="h-8"
                                onClick={() => adicionarAoFluxo(produto.id)}
                              >
                                Selecionar
                              </Button>
                            )}
                            {estadoTriagem !== "ignorado" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-slate-600"
                                onClick={() => ignorarProduto(produto.id)}
                              >
                                Ignorar
                              </Button>
                            ) : null}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setProdutoEmDetalhe(produto)}
                                  aria-label="Detalhes"
                                  className="h-8 w-8"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Detalhes</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {produtosVisiveis.map((produto) => (
                <ProdutoMobileCard
                  key={produto.id}
                  produto={produto}
                  selecionado={selecionados.includes(produto.id)}
                  triagem={obterTriagemProduto(triagens, produto.id)}
                  alternarSelecao={alternarSelecao}
                  adicionarAoFluxo={adicionarAoFluxo}
                  removerDoFluxo={removerDoFluxo}
                  ignorarProduto={ignorarProduto}
                  desfazerTriagem={desfazerTriagem}
                  abrirDetalhes={setProdutoEmDetalhe}
                  abrirImagem={setProdutoImagem}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-3 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Exibindo {intervaloInicial}-{intervaloFinal} de{" "}
                {produtosFiltrados.length}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                <Select
                  value={String(itensPorPagina)}
                  onValueChange={(valor) => {
                    setItensPorPagina(Number(valor));
                    setPaginaAtual(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[110px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCOES_ITENS_POR_PAGINA.map((opcao) => (
                      <SelectItem key={opcao} value={String(opcao)}>
                        {opcao} por página
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => irParaPagina(paginaAtualSegura - 1)}
                  disabled={paginaAtualSegura === 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-24 text-center text-xs font-medium text-slate-500">
                  Página {paginaAtualSegura} de {totalPaginas}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => irParaPagina(paginaAtualSegura + 1)}
                  disabled={paginaAtualSegura === totalPaginas}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <DrawerDadosRecebidosFornecedor
        produto={produtoEmDetalhe}
        aberto={Boolean(produtoEmDetalhe)}
        aoAlterarAbertura={(aberto) => {
          if (!aberto) setProdutoEmDetalhe(null);
        }}
      />

      <PreviewImagemProduto
        produto={produtoImagem}
        aberto={Boolean(produtoImagem)}
        aoAlterarAbertura={(aberto) => {
          if (!aberto) setProdutoImagem(null);
        }}
      />
    </main>
  );
}
