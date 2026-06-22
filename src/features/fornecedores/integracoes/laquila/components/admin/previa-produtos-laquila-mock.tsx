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
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  ProdutoLaquilaMock,
  StatusProdutoLaquilaMock,
} from "../../types/produto-laquila-mock.types";
import type { ProdutoApiStagingLaquilaCatalogo } from "../../queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
const IMAGEM_PLACEHOLDER = "/produto-sem-foto.webp";

const rotulosStatus: Record<StatusProdutoLaquilaMock, string> = {
  novo: "Novo",
  vinculado: "Vinculado",
  atencao: "Atenção",
  ignorado: "Ignorado",
};

const estilosStatus: Record<StatusProdutoLaquilaMock, string> = {
  novo: "border-blue-200 bg-blue-50 text-blue-700",
  vinculado: "border-emerald-200 bg-emerald-50 text-emerald-700",
  atencao: "border-amber-200 bg-amber-50 text-amber-700",
  ignorado: "border-slate-200 bg-slate-100 text-slate-600",
};

const tiposOperacionais: Record<StatusProdutoLaquilaMock, string> = {
  novo: "Novo produto",
  vinculado: "Possível existente",
  atencao: "Com alerta",
  ignorado: "Atualização",
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

function formatarDataRecebimento(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function obterValorPayload(
  dadosBrutosJson: Record<string, unknown>,
  campo: string,
) {
  return dadosBrutosJson[campo];
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
  marca,
  grupo,
  status,
  somenteSelecionados,
  selecionados,
}: {
  produtos: ProdutoLaquilaMock[];
  busca: string;
  marca: string;
  grupo: string;
  status: string;
  somenteSelecionados: boolean;
  selecionados: string[];
}) {
  const buscaNormalizada = normalizarTexto(busca.trim());

  return produtos.filter((produto) => {
    const correspondeBusca =
      !buscaNormalizada ||
      normalizarTexto(
        `${produto.codigo} ${produto.nome} ${produto.marca} ${produto.ean}`,
      ).includes(buscaNormalizada);

    const correspondeMarca = marca === "todas" || produto.marca === marca;
    const correspondeGrupo = grupo === "todos" || produto.grupo === grupo;
    const correspondeStatus = status === "todos" || produto.status === status;
    const correspondeSelecao =
      !somenteSelecionados || selecionados.includes(produto.id);

    return (
      correspondeBusca &&
      correspondeMarca &&
      correspondeGrupo &&
      correspondeStatus &&
      correspondeSelecao
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
  alternarSelecao,
  abrirDetalhes,
  abrirImagem,
}: {
  produto: ProdutoLaquilaMock;
  selecionado: boolean;
  alternarSelecao: (id: string) => void;
  abrirDetalhes: (produto: ProdutoLaquilaMock) => void;
  abrirImagem: (produto: ProdutoLaquilaMock) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
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
              <p className="mt-0.5 font-mono text-xs text-slate-500">
                {produto.codigo}
              </p>
            </div>
            <Badge variant="outline" className={estilosStatus[produto.status]}>
              {rotulosStatus[produto.status]}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-500">Marca</p>
              <p className="font-medium text-slate-900">{produto.marca}</p>
            </div>
            <div>
              <p className="text-slate-500">Grupo</p>
              <p className="font-medium text-slate-900">{produto.grupo}</p>
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

          <Button
            variant="ghost"
            size="sm"
            className="mt-3 h-8 px-0"
            onClick={() => abrirDetalhes(produto)}
            aria-label="Detalhes"
          >
            <Eye className="mr-1 h-4 w-4" />
            Detalhes
          </Button>
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
                  <p className="text-xs font-medium text-slate-500">Tipo</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {tiposOperacionais[produto.status]}
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
                    {produto.codigo}
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
                {produto.codigo} · {produto.nome}
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
};

export function PreviaProdutosLaquilaMock({
  produtos,
}: PreviaProdutosLaquilaMockProps) {
  const [busca, setBusca] = useState("");
  const [marca, setMarca] = useState("todas");
  const [grupo, setGrupo] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [produtoEmDetalhe, setProdutoEmDetalhe] =
    useState<ProdutoLaquilaMock | null>(null);
  const [produtoImagem, setProdutoImagem] = useState<ProdutoLaquilaMock | null>(
    null,
  );
  const [paginaAtual, setPaginaAtual] = useState(1);

  const marcas = useMemo(
    () => Array.from(new Set(produtos.map((produto) => produto.marca))),
    [produtos],
  );

  const grupos = useMemo(
    () => Array.from(new Set(produtos.map((produto) => produto.grupo))),
    [produtos],
  );

  const produtosFiltrados = useMemo(
    () =>
      filtrarProdutos({
        produtos,
        busca,
        marca,
        grupo,
        status,
        somenteSelecionados: false,
        selecionados,
      }),
    [busca, marca, grupo, produtos, status, selecionados],
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA),
  );
  const paginaAtualSegura = Math.min(paginaAtual, totalPaginas);
  const inicioPagina = (paginaAtualSegura - 1) * ITENS_POR_PAGINA;
  const produtosVisiveis = produtosFiltrados.slice(
    inicioPagina,
    inicioPagina + ITENS_POR_PAGINA,
  );
  const intervaloInicial =
    produtosFiltrados.length === 0 ? 0 : inicioPagina + 1;
  const intervaloFinal = Math.min(
    inicioPagina + ITENS_POR_PAGINA,
    produtosFiltrados.length,
  );
  const todosVisiveisSelecionados =
    produtosVisiveis.length > 0 &&
    produtosVisiveis.every((produto) => selecionados.includes(produto.id));

  const totais = {
    encontrados: produtos.length,
    novos: produtos.filter((produto) => produto.status === "novo").length,
    vinculados: produtos.filter((produto) => produto.status === "vinculado")
      .length,
    atencao: produtos.filter((produto) => produto.status === "atencao").length,
  };

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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Encontrados"
          valor={totais.encontrados}
          icone={Boxes}
          tom="bg-slate-100 text-slate-700"
        />
        <ResumoCard
          titulo="Novos"
          valor={totais.novos}
          icone={PackagePlus}
          tom="bg-blue-50 text-blue-700"
        />
        <ResumoCard
          titulo="Vinculados"
          valor={totais.vinculados}
          icone={PackageCheck}
          tom="bg-emerald-50 text-emerald-700"
        />
        <ResumoCard
          titulo="Atenção"
          valor={totais.atencao}
          icone={AlertTriangle}
          tom="bg-amber-50 text-amber-700"
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(150px,0.8fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={busca}
              onChange={(evento) => {
                setBusca(evento.target.value);
                setPaginaAtual(1);
              }}
              placeholder="Buscar produto"
              className="pl-9"
            />
          </div>

          <Select
            value={marca}
            onValueChange={(valor) => {
              setMarca(valor);
              setPaginaAtual(1);
            }}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas marcas</SelectItem>
              {marcas.map((marcaProduto) => (
                <SelectItem key={marcaProduto} value={marcaProduto}>
                  {marcaProduto}
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
              {grupos.map((grupoProduto) => (
                <SelectItem key={grupoProduto} value={grupoProduto}>
                  {grupoProduto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(valor) => {
              setStatus(valor);
              setPaginaAtual(1);
            }}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="vinculado">Vinculado</SelectItem>
              <SelectItem value="atencao">Atenção</SelectItem>
              <SelectItem value="ignorado">Ignorado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <p className="text-sm font-medium text-slate-700">
          {selecionados.length} selecionados
        </p>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/admin/fornecedores/integracoes/laquila/mapeamento">
            Continuar para mapeamento
            <MoveRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-xs">
        {produtosVisiveis.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-500">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-950">Nenhum produto</p>
              <p className="mt-1 text-sm text-slate-500">Ajuste os filtros.</p>
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
                        checked={todosVisiveisSelecionados}
                        onCheckedChange={alternarTodosVisiveis}
                        aria-label="Selecionar produtos visíveis"
                      />
                    </TableHead>
                    <TableHead className="w-14">Imagem</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosVisiveis.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <Checkbox
                          checked={selecionados.includes(produto.id)}
                          onCheckedChange={() => alternarSelecao(produto.id)}
                          aria-label={`Selecionar ${produto.nome}`}
                        />
                      </TableCell>
                      <TableCell>
                        <ImagemProdutoRecebido
                          imagemUrl={produto.imagemUrl}
                          nome={produto.nome}
                          tamanho="sm"
                          onClick={() => setProdutoImagem(produto)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {produto.codigo}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <p className="truncate font-medium text-slate-950">
                          {produto.nome}
                        </p>
                        <p className="text-xs text-slate-500">
                          EAN {produto.ean} · NCM {produto.ncm}
                        </p>
                      </TableCell>
                      <TableCell>{produto.marca}</TableCell>
                      <TableCell>{produto.grupo}</TableCell>
                      <TableCell className="font-medium">
                        {formatarPrecoRecebido(produto.preco)}
                      </TableCell>
                      <TableCell>
                        {formatarEstoqueRecebido(produto.estoque)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={estilosStatus[produto.status]}
                        >
                          {rotulosStatus[produto.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {produtosVisiveis.map((produto) => (
                <ProdutoMobileCard
                  key={produto.id}
                  produto={produto}
                  selecionado={selecionados.includes(produto.id)}
                  alternarSelecao={alternarSelecao}
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
              <div className="flex items-center justify-between gap-2 sm:justify-end">
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
