"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Download,
  Link2,
  PackageCheck,
  PackagePlus,
  Search,
} from "lucide-react";
import Image from "next/image";
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

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
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
}: {
  produto: ProdutoLaquilaMock;
  selecionado: boolean;
  alternarSelecao: (id: string) => void;
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
        <Image
          src={produto.imagemUrl}
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 rounded-md border border-slate-100 object-cover"
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
            <Badge
              variant="outline"
              className={estilosStatus[produto.status]}
            >
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
                {formatarMoeda(produto.preco)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Estoque</p>
              <p className="font-medium text-slate-900">{produto.estoque}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="mt-3 h-8 px-0">
            Revisar
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
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

  const produtosVisiveis = produtosFiltrados;
  const todosVisiveisSelecionados =
    produtosVisiveis.length > 0 &&
    produtosVisiveis.every((produto) => selecionados.includes(produto.id));

  const totais = {
    encontrados: produtos.length,
    novos: produtos.filter((produto) => produto.status === "novo").length,
    vinculados: produtos.filter(
      (produto) => produto.status === "vinculado",
    ).length,
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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
            <Link href="/admin/fornecedores/integracoes/laquila">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Laquila
            </Link>
          </Button>

          <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Catálogo API — Laquila
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Itens disponíveis na API antes de importar para a loja.
          </p>
        </div>

        <Badge
          variant="outline"
          className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <CheckCircle2 className="h-3 w-3" />
          Mock visual
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
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar produto"
              className="pl-9"
            />
          </div>

          <Select value={marca} onValueChange={setMarca}>
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

          <Select value={grupo} onValueChange={setGrupo}>
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

          <Select value={status} onValueChange={setStatus}>
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
        <div className="grid gap-2 sm:flex sm:items-center">
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-2 h-4 w-4" />
            Importar selecionados
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Link2 className="mr-2 h-4 w-4" />
            Vincular existente
          </Button>
          <Button variant="outline" size="sm" disabled>
            <CircleDashed className="mr-2 h-4 w-4" />
            Ignorar
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-xs">
        {produtosVisiveis.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-500">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-950">Nenhum produto</p>
              <p className="mt-1 text-sm text-slate-500">
                Ajuste os filtros.
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
                        <Image
                          src={produto.imagemUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-md border border-slate-100 object-cover"
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
                        {formatarMoeda(produto.preco)}
                      </TableCell>
                      <TableCell>{produto.estoque}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={estilosStatus[produto.status]}
                        >
                          {rotulosStatus[produto.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled>
                          Revisar
                        </Button>
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
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
