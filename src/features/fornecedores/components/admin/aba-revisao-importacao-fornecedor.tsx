"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet,
  PackageCheck,
  Plus,
  Sparkles,
  Tag,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { createCategory } from "@/actions/admin/categories/create";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { categoryKeys } from "@/features/admin/categories/hooks/query-keys";
import { CategoryTreeSelector } from "@/features/admin/products/components/CategoryTreeSelector";
import { MarcaPopoverSelector } from "@/features/admin/products/components/MarcaPopoverSelector";
import { criarMarca } from "@/features/admin/marcas/services/marcaService";
import { atualizarRevisaoImportacaoFornecedorAction } from "../../actions";

type MarcaAtiva = {
  id: string;
  nome: string;
};

type LinhaStagingRevisaoFornecedor = {
  id: string;
  codigoFornecedor: string | null;
  nomeProduto: string;
  categoriaFornecedor: string | null;
  marcaFornecedor: string | null;
  precoFornecedor: string | null;
  produtoVinculadoSku: string | null;
  dadosBrutos: Record<string, string | number | boolean | Date | null>;
};

type CampoRevisao = "categoria" | "marca" | "nome";
type StatusCampoRevisao =
  | "conforme"
  | "sem_valor"
  | "divergente"
  | "novo_arquivo";

type AbaRevisaoImportacaoFornecedorProps = {
  importacaoId: string;
  linhas: LinhaStagingRevisaoFornecedor[];
  categorias: string[];
  marcas: string[];
  total: number;
  pagina: number;
  totalPaginas: number;
  limite: number;
  busca: string;
  categoriaRevisao: string;
  marcaRevisao: string;
  marcasAtivas: MarcaAtiva[];
};

const camposRevisao: Array<{
  chave: CampoRevisao;
  rotulo: string;
  rotuloSemValor: string;
  icone: typeof Tag;
}> = [
  {
    chave: "categoria",
    rotulo: "Categoria",
    rotuloSemValor: "Sem categoria",
    icone: Tag,
  },
  {
    chave: "marca",
    rotulo: "Marca",
    rotuloSemValor: "Sem marca",
    icone: Sparkles,
  },
  {
    chave: "nome",
    rotulo: "Nome",
    rotuloSemValor: "Sem nome",
    icone: Type,
  },
];

const aliasesArquivo: Record<CampoRevisao, string[]> = {
  categoria: [
    "categoria_fornecedor",
    "categoria",
    "grupo",
    "category",
    "categoria fornecedor",
  ],
  marca: ["marca_fornecedor", "marca", "brand", "marca fornecedor"],
  nome: [
    "nome_produto",
    "nome produto",
    "produto",
    "nome",
    "descricao",
    "descrição",
  ],
};

const estilosStatus: Record<
  StatusCampoRevisao,
  { rotulo: string; badge: string; ponto: string }
> = {
  conforme: {
    rotulo: "Conforme",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ponto: "bg-emerald-500",
  },
  sem_valor: {
    rotulo: "Sem valor",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    ponto: "bg-amber-500",
  },
  divergente: {
    rotulo: "Divergente",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    ponto: "bg-rose-500",
  },
  novo_arquivo: {
    rotulo: "Novo no arquivo",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    ponto: "bg-violet-500",
  },
};

function normalizarTexto(valor: string | null | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizarChave(valor: string) {
  return normalizarTexto(valor)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function temTexto(valor: string | null | undefined) {
  return Boolean(valor && valor.trim().length > 0);
}

function valorBrutoArquivo(
  linha: LinhaStagingRevisaoFornecedor,
  campo: CampoRevisao,
) {
  const mapaNormalizado = new Map<string, string>();

  Object.entries(linha.dadosBrutos ?? {}).forEach(([chave, valor]) => {
    const texto = String(valor ?? "").trim();
    if (texto) {
      mapaNormalizado.set(normalizarChave(chave), texto);
    }
  });

  for (const alias of aliasesArquivo[campo]) {
    const valor = mapaNormalizado.get(normalizarChave(alias));
    if (valor) return valor;
  }

  return null;
}

function valorStaging(
  linha: LinhaStagingRevisaoFornecedor,
  campo: CampoRevisao,
) {
  if (campo === "categoria") return linha.categoriaFornecedor;
  if (campo === "marca") return linha.marcaFornecedor;
  return linha.nomeProduto;
}

function statusCampo(
  linha: LinhaStagingRevisaoFornecedor,
  campo: CampoRevisao,
): StatusCampoRevisao {
  const arquivo = valorBrutoArquivo(linha, campo);
  const staging = valorStaging(linha, campo);

  if (!temTexto(staging) && temTexto(arquivo)) return "novo_arquivo";
  if (!temTexto(staging)) return "sem_valor";

  if (
    temTexto(arquivo) &&
    normalizarTexto(arquivo) !== normalizarTexto(staging)
  ) {
    return "divergente";
  }

  return "conforme";
}

function gerarSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function RotuloOrigem({ campo, origem }: { campo: string; origem: "arquivo" }) {
  return (
    <span className="inline-flex flex-col items-start text-left leading-tight">
      <span>{campo}</span>
      <span className="text-[10px] font-medium tracking-normal text-slate-400 normal-case">
        {origem}
      </span>
    </span>
  );
}

export function AbaRevisaoImportacaoFornecedor({
  importacaoId,
  linhas,
  pagina,
  limite,
  busca,
  categoriaRevisao,
  marcaRevisao,
  categorias,
  marcas,
  marcasAtivas,
}: AbaRevisaoImportacaoFornecedorProps) {
  const queryClient = useQueryClient();
  const [campoAtivo, setCampoAtivo] = useState<CampoRevisao>("categoria");
  const [buscaLocal, setBuscaLocal] = useState(busca);
  const [buscaAplicada, setBuscaAplicada] = useState(busca);
  const [paginaLocal, setPaginaLocal] = useState(pagina);
  const [limiteLocal, setLimiteLocal] = useState(limite);
  const [categoriaLocal, setCategoriaLocal] = useState(categoriaRevisao);
  const [marcaLocal, setMarcaLocal] = useState(marcaRevisao);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [modoDrawer, setModoDrawer] = useState<"categoria" | "marca" | null>(
    null,
  );
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState("");
  const [marcaSelecionadaId, setMarcaSelecionadaId] = useState("");
  const [marcaSelecionadaNome, setMarcaSelecionadaNome] = useState("");
  const [nomeNovaCategoria, setNomeNovaCategoria] = useState("");
  const [slugNovaCategoria, setSlugNovaCategoria] = useState("");
  const [descricaoNovaCategoria, setDescricaoNovaCategoria] = useState("");
  const [marcasLocais, setMarcasLocais] = useState(marcasAtivas);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setBuscaAplicada(buscaLocal);
      setPaginaLocal(1);
    }, 180);

    return () => window.clearTimeout(temporizador);
  }, [buscaLocal]);

  useEffect(() => {
    setSelecionados([]);
    setPaginaLocal(1);
  }, [campoAtivo, categoriaLocal, marcaLocal]);

  const mutacaoCriarCategoria = useMutation({
    mutationFn: createCategory,
    onSuccess: async (resultado) => {
      if (!resultado.success || !resultado.data) {
        toast.error(resultado.message ?? "Não foi possível criar a categoria.");
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: categoryKeys.all,
      });
      setCategoriaSelecionadaId(resultado.data.id);
      setNomeNovaCategoria("");
      setSlugNovaCategoria("");
      setDescricaoNovaCategoria("");
      toast.success("Categoria criada e disponível para seleção.");
    },
    onError: (erro) => {
      toast.error(
        erro instanceof Error ? erro.message : "Erro ao criar categoria.",
      );
    },
  });

  const mutacaoCriarMarca = useMutation({
    mutationFn: criarMarca,
    onSuccess: (resultado) => {
      if (!resultado.success || !resultado.marca) {
        toast.error("Não foi possível criar a marca.");
        return;
      }

      setMarcasLocais((atual) => [
        ...atual,
        { id: resultado.marca.id, nome: resultado.marca.nome },
      ]);
      setMarcaSelecionadaId(resultado.marca.id);
      setMarcaSelecionadaNome(resultado.marca.nome);
      toast.success("Marca criada e disponível para seleção.");
    },
    onError: (erro) => {
      toast.error(
        erro instanceof Error ? erro.message : "Erro ao criar marca.",
      );
    },
  });

  const resumoPorCampo = useMemo(() => {
    return camposRevisao.reduce(
      (acumulado, campo) => {
        const contadores = {
          conforme: 0,
          sem_valor: 0,
          divergente: 0,
          novo_arquivo: 0,
        };

        linhas.forEach((linha) => {
          contadores[statusCampo(linha, campo.chave)] += 1;
        });

        acumulado[campo.chave] = contadores;
        return acumulado;
      },
      {} as Record<CampoRevisao, Record<StatusCampoRevisao, number>>,
    );
  }, [linhas]);

  const linhasFiltradas = useMemo(() => {
    const termo = normalizarTexto(buscaAplicada);
    const categoria = normalizarTexto(categoriaLocal);
    const marca = normalizarTexto(marcaLocal);

    return linhas.filter((linha) => {
      const textoBusca = normalizarTexto(
        [linha.codigoFornecedor, linha.produtoVinculadoSku, linha.nomeProduto]
          .filter((valor): valor is string => Boolean(valor))
          .join(" "),
      );

      if (termo && !textoBusca.includes(termo)) return false;
      if (
        categoria &&
        normalizarTexto(linha.categoriaFornecedor) !== categoria
      ) {
        return false;
      }
      if (marca && normalizarTexto(linha.marcaFornecedor) !== marca) {
        return false;
      }

      return true;
    });
  }, [buscaAplicada, categoriaLocal, linhas, marcaLocal]);

  const totalFiltrado = linhasFiltradas.length;
  const totalPaginasLocal = Math.max(1, Math.ceil(totalFiltrado / limiteLocal));
  const paginaAtual = Math.min(paginaLocal, totalPaginasLocal);
  const linhasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * limiteLocal;
    return linhasFiltradas.slice(inicio, inicio + limiteLocal);
  }, [linhasFiltradas, limiteLocal, paginaAtual]);

  const campo = camposRevisao.find((item) => item.chave === campoAtivo)!;
  const resumoAtivo = resumoPorCampo[campoAtivo];
  const kpisAtivos: Array<{
    rotulo: string;
    valor: number;
    Icone: LucideIcon;
    cor: "emerald" | "amber" | "rose" | "violet";
  }> = [
    {
      rotulo: "Conformes",
      valor: resumoAtivo.conforme,
      Icone: CheckCircle2,
      cor: "emerald",
    },
    {
      rotulo: campo.rotuloSemValor,
      valor: resumoAtivo.sem_valor,
      Icone: AlertTriangle,
      cor: "amber",
    },
    {
      rotulo: "Divergentes",
      valor: resumoAtivo.divergente,
      Icone: AlertTriangle,
      cor: "rose",
    },
    {
      rotulo: "Novos no arquivo",
      valor: resumoAtivo.novo_arquivo,
      Icone: Sparkles,
      cor: "violet",
    },
  ];
  const totalSelecionados = selecionados.length;
  const todosSelecionados = useMemo(
    () =>
      linhasPaginadas.length > 0 &&
      linhasPaginadas.every((linha) => selecionados.includes(linha.id)),
    [linhasPaginadas, selecionados],
  );
  const itensSelecionados = useMemo(
    () => selecionados.filter((id) => linhas.some((linha) => linha.id === id)),
    [linhas, selecionados],
  );

  const alternarTodos = (marcado: boolean) => {
    const idsPagina = linhasPaginadas.map((linha) => linha.id);

    setSelecionados((atual) =>
      marcado
        ? Array.from(new Set([...atual, ...idsPagina]))
        : atual.filter((id) => !idsPagina.includes(id)),
    );
  };

  const alternarItem = (stagingId: string, marcado: boolean) => {
    setSelecionados((atual) =>
      marcado
        ? Array.from(new Set([...atual, stagingId]))
        : atual.filter((item) => item !== stagingId),
    );
  };

  const abrirDrawerCategoria = (ids?: string[]) => {
    if (ids) setSelecionados(ids);
    setCategoriaSelecionadaId("");
    setNomeNovaCategoria("");
    setSlugNovaCategoria("");
    setDescricaoNovaCategoria("");
    setModoDrawer("categoria");
    setDrawerAberto(true);
  };

  const abrirDrawerMarca = (ids?: string[]) => {
    if (ids) setSelecionados(ids);
    setMarcaSelecionadaId("");
    setMarcaSelecionadaNome("");
    setModoDrawer("marca");
    setDrawerAberto(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-950">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                Arquivo do fornecedor
              </div>
              <p className="mt-1 text-xs text-blue-700">
                Dados originais usados como referência.
              </p>
            </div>
            <ArrowRight className="hidden h-4 w-4 text-slate-400 md:block" />
            <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                <Database className="h-4 w-4 text-amber-600" />
                Staging
              </div>
              <p className="mt-1 text-xs text-amber-700">
                Correções salvas apenas nesta importação.
              </p>
            </div>
            <ArrowRight className="hidden h-4 w-4 text-slate-400 md:block" />
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
                <PackageCheck className="h-4 w-4 text-emerald-600" />
                Catálogo real
              </div>
              <p className="mt-1 text-xs text-emerald-700">
                Nenhum produto real é alterado nesta etapa.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-2">
          <div className="flex gap-2 overflow-x-auto">
            {camposRevisao.map((item) => {
              const Icone = item.icone;
              const pendencias =
                resumoPorCampo[item.chave].sem_valor +
                resumoPorCampo[item.chave].divergente +
                resumoPorCampo[item.chave].novo_arquivo;
              const ativo = campoAtivo === item.chave;

              return (
                <button
                  key={item.chave}
                  type="button"
                  onClick={() => setCampoAtivo(item.chave)}
                  className={`flex min-w-[150px] items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    ativo
                      ? "border-slate-900 bg-slate-950 text-white shadow-sm"
                      : "border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icone className="h-4 w-4" />
                    {item.rotulo}
                  </span>
                  <Badge
                    variant="secondary"
                    className={
                      pendencias > 0
                        ? "border border-amber-200 bg-amber-50 text-amber-700"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    }
                  >
                    {pendencias > 0 ? pendencias : "OK"}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {kpisAtivos.map(({ rotulo, valor, Icone, cor }) => (
            <div
              key={String(rotulo)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">{rotulo}</p>
                <Icone
                  className={`h-4 w-4 ${
                    cor === "emerald"
                      ? "text-emerald-600"
                      : cor === "amber"
                        ? "text-amber-600"
                        : cor === "rose"
                          ? "text-rose-600"
                          : "text-violet-600"
                  }`}
                />
              </div>
              <p className="mt-1 text-xl font-semibold text-slate-950">
                {String(valor)}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_180px_auto]">
            <Input
              value={buscaLocal}
              placeholder="Pesquisar por SKU, código ou nome do produto..."
              className="h-9"
              onChange={(event) => setBuscaLocal(event.target.value)}
            />
            <select
              value={categoriaLocal}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm"
              onChange={(event) => setCategoriaLocal(event.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
            <select
              value={marcaLocal}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm"
              onChange={(event) => setMarcaLocal(event.target.value)}
            >
              <option value="">Todas as marcas</option>
              {marcas.map((marca) => (
                <option key={marca} value={marca}>
                  {marca}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                setBuscaLocal("");
                setBuscaAplicada("");
                setCategoriaLocal("");
                setMarcaLocal("");
                setPaginaLocal(1);
              }}
            >
              Limpar
            </Button>
          </div>
        </div>

        {totalSelecionados > 0 && campoAtivo !== "nome" ? (
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-slate-700">
              {totalSelecionados} selecionado
              {totalSelecionados === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap gap-2">
              {campoAtivo === "categoria" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => abrirDrawerCategoria()}
                >
                  Definir categoria
                </Button>
              ) : null}
              {campoAtivo === "marca" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => abrirDrawerMarca()}
                >
                  Definir marca
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="h-10 w-[44px] px-3">
                  <Checkbox
                    checked={todosSelecionados}
                    onCheckedChange={(valor) => alternarTodos(Boolean(valor))}
                    aria-label="Selecionar todos os itens da revisão"
                  />
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                  <RotuloOrigem campo="Nome" origem="arquivo" />
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                  Status
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                  <RotuloOrigem campo={campo.rotulo} origem="arquivo" />
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                  {campo.rotulo} em revisão
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                  Resolução
                </TableHead>
                <TableHead className="h-10 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                  Outros campos
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhasPaginadas.length === 0 ? (
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableCell
                    colSpan={7}
                    className="h-20 text-center text-sm text-slate-500"
                  >
                    Nenhum produto encontrado com os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                linhasPaginadas.map((linha) => {
                  const status = statusCampo(linha, campoAtivo);
                  const arquivo = valorBrutoArquivo(linha, campoAtivo);
                  const staging = valorStaging(linha, campoAtivo);

                  return (
                    <TableRow key={linha.id} className="border-slate-100">
                      <TableCell className="px-3 py-2 align-middle">
                        <Checkbox
                          checked={selecionados.includes(linha.id)}
                          onCheckedChange={(valor) =>
                            alternarItem(linha.id, Boolean(valor))
                          }
                          aria-label={`Selecionar ${linha.nomeProduto}`}
                        />
                      </TableCell>
                      <TableCell className="max-w-[300px] py-2 align-middle">
                        <p className="truncate font-medium text-slate-950">
                          {linha.nomeProduto || "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Cód. {linha.codigoFornecedor ?? "-"} · SKU{" "}
                          {linha.produtoVinculadoSku ?? "-"}
                        </p>
                      </TableCell>
                      <TableCell className="py-2 align-middle">
                        <Badge
                          variant="secondary"
                          className={`gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${estilosStatus[status].badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${estilosStatus[status].ponto}`}
                          />
                          {estilosStatus[status].rotulo}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] py-2 align-middle text-sm text-slate-700">
                        <span className="block truncate">{arquivo ?? "-"}</span>
                      </TableCell>
                      <TableCell className="max-w-[220px] py-2 align-middle text-sm text-slate-700">
                        <span className="block truncate">{staging || "-"}</span>
                      </TableCell>
                      <TableCell className="py-2 align-middle">
                        {campoAtivo === "categoria" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => abrirDrawerCategoria([linha.id])}
                          >
                            Resolver
                          </Button>
                        ) : null}
                        {campoAtivo === "marca" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => abrirDrawerMarca([linha.id])}
                          >
                            Resolver
                          </Button>
                        ) : null}
                        {campoAtivo === "nome" ? (
                          <form
                            action={atualizarRevisaoImportacaoFornecedorAction}
                            className="flex min-w-[260px] gap-2"
                          >
                            <input
                              type="hidden"
                              name="importacaoId"
                              value={importacaoId}
                            />
                            <input type="hidden" name="escopo" value="nome" />
                            <input
                              type="hidden"
                              name="retornoBusca"
                              value={buscaAplicada}
                            />
                            <input
                              type="hidden"
                              name="retornoCategoriaRevisao"
                              value={categoriaLocal}
                            />
                            <input
                              type="hidden"
                              name="retornoMarcaRevisao"
                              value={marcaLocal}
                            />
                            <input
                              type="hidden"
                              name="retornoPagina"
                              value={paginaAtual}
                            />
                            <input
                              type="hidden"
                              name="retornoLimite"
                              value={limiteLocal}
                            />
                            <input
                              type="hidden"
                              name="stagingIds"
                              value={linha.id}
                            />
                            <Input
                              name="nomeProduto"
                              defaultValue={linha.nomeProduto}
                              className="h-8 min-w-0 text-sm"
                            />
                            <Button size="sm" className="h-8" type="submit">
                              <Check className="h-4 w-4" />
                            </Button>
                          </form>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-2 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {camposRevisao
                            .filter((item) => item.chave !== campoAtivo)
                            .map((item) => {
                              const statusOutro = statusCampo(
                                linha,
                                item.chave,
                              );

                              return (
                                <button
                                  key={item.chave}
                                  type="button"
                                  onClick={() => setCampoAtivo(item.chave)}
                                  className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition hover:opacity-80 ${estilosStatus[statusOutro].badge}`}
                                >
                                  {item.rotulo}{" "}
                                  {statusOutro === "conforme" ? "OK" : "!"}
                                </button>
                              );
                            })}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <span>
            Página {paginaAtual} de {totalPaginasLocal} · {totalFiltrado}{" "}
            registros
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={paginaAtual <= 1}
              className="gap-1"
              type="button"
              onClick={() => setPaginaLocal((atual) => Math.max(1, atual - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={paginaAtual >= totalPaginasLocal}
              className="gap-1"
              type="button"
              onClick={() =>
                setPaginaLocal((atual) =>
                  Math.min(totalPaginasLocal, atual + 1),
                )
              }
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
            <select
              value={limiteLocal}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
              onChange={(event) => {
                setLimiteLocal(Number(event.target.value));
                setPaginaLocal(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <Sheet open={drawerAberto} onOpenChange={setDrawerAberto}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>
              {modoDrawer === "categoria"
                ? "Definir categoria"
                : "Definir marca"}
            </SheetTitle>
            <SheetDescription>
              A correção será aplicada somente aos itens do staging
              selecionados.
            </SheetDescription>
          </SheetHeader>

          {modoDrawer === "categoria" ? (
            <div className="space-y-4 px-4 pb-6">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <CategoryTreeSelector
                  value={categoriaSelecionadaId}
                  onChange={(categoryId) =>
                    setCategoriaSelecionadaId(categoryId)
                  }
                />
              </div>

              <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nova categoria</Label>
                    <Input
                      value={nomeNovaCategoria}
                      onChange={(event) => {
                        const valor = event.target.value;
                        setNomeNovaCategoria(valor);
                        setSlugNovaCategoria(gerarSlug(valor));
                      }}
                      placeholder="Ex: Acessórios"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      value={slugNovaCategoria}
                      onChange={(event) =>
                        setSlugNovaCategoria(event.target.value)
                      }
                      placeholder="ex: acessorios"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={descricaoNovaCategoria}
                    onChange={(event) =>
                      setDescricaoNovaCategoria(event.target.value)
                    }
                    placeholder="Opcional"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  onClick={() =>
                    mutacaoCriarCategoria.mutate({
                      name: nomeNovaCategoria,
                      slug: slugNovaCategoria,
                      description: descricaoNovaCategoria,
                      isActive: true,
                      orderIndex: 0,
                      parentId: null,
                    })
                  }
                  disabled={
                    !nomeNovaCategoria.trim() || !slugNovaCategoria.trim()
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar categoria
                </Button>
              </div>

              <form
                action={atualizarRevisaoImportacaoFornecedorAction}
                className="flex justify-end gap-2"
              >
                <input type="hidden" name="importacaoId" value={importacaoId} />
                <input type="hidden" name="escopo" value="categoria" />
                <input
                  type="hidden"
                  name="retornoBusca"
                  value={buscaAplicada}
                />
                <input
                  type="hidden"
                  name="retornoCategoriaRevisao"
                  value={categoriaLocal}
                />
                <input
                  type="hidden"
                  name="retornoMarcaRevisao"
                  value={marcaLocal}
                />
                <input type="hidden" name="retornoPagina" value={paginaAtual} />
                <input type="hidden" name="retornoLimite" value={limiteLocal} />
                {itensSelecionados.map((id) => (
                  <input key={id} type="hidden" name="stagingIds" value={id} />
                ))}
                <input
                  type="hidden"
                  name="categoriaId"
                  value={categoriaSelecionadaId}
                />
                <Button type="submit" disabled={!categoriaSelecionadaId}>
                  Salvar no staging
                </Button>
              </form>
            </div>
          ) : modoDrawer === "marca" ? (
            <div className="space-y-4 px-4 pb-6">
              <div className="space-y-2">
                <Label>Marca</Label>
                <MarcaPopoverSelector
                  value={marcaSelecionadaId}
                  brands={marcasLocais}
                  onChange={(brandId, brandName) => {
                    setMarcaSelecionadaId(brandId);
                    setMarcaSelecionadaNome(brandName);
                  }}
                  onCreateBrand={async (nome) => {
                    const resultado = await mutacaoCriarMarca.mutateAsync({
                      nome,
                    });
                    return resultado.marca;
                  }}
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Marca selecionada: {marcaSelecionadaNome || "nenhuma"}
              </div>

              <form
                action={atualizarRevisaoImportacaoFornecedorAction}
                className="flex justify-end gap-2"
              >
                <input type="hidden" name="importacaoId" value={importacaoId} />
                <input type="hidden" name="escopo" value="marca" />
                <input
                  type="hidden"
                  name="retornoBusca"
                  value={buscaAplicada}
                />
                <input
                  type="hidden"
                  name="retornoCategoriaRevisao"
                  value={categoriaLocal}
                />
                <input
                  type="hidden"
                  name="retornoMarcaRevisao"
                  value={marcaLocal}
                />
                <input type="hidden" name="retornoPagina" value={paginaAtual} />
                <input type="hidden" name="retornoLimite" value={limiteLocal} />
                {itensSelecionados.map((id) => (
                  <input key={id} type="hidden" name="stagingIds" value={id} />
                ))}
                <input
                  type="hidden"
                  name="marcaId"
                  value={marcaSelecionadaId}
                />
                <Button type="submit" disabled={!marcaSelecionadaId}>
                  Salvar no staging
                </Button>
              </form>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
