"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Copy,
  Layers3,
  Edit3,
  Building2,
  MapPin,
  PauseCircle,
  Plus,
  Receipt,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  alternarStatusPromocaoAdmin,
  buscarCategoriasPromocaoAdmin,
  buscarFretesServicosPromocaoAdmin,
  buscarMarcasPromocaoAdmin,
  buscarProdutosPromocaoAdmin,
  buscarRegioesPromocaoAdmin,
  duplicarPromocaoAdmin,
  salvarPromocaoAdmin,
} from "../../actions";
import type {
  CategoriaPromocaoAdmin,
  FreteServicoPromocaoAdmin,
  MarcaPromocaoAdmin,
  ProdutoPromocaoAdmin,
  PromocaoAdmin,
  RegiaoPromocaoAdmin,
  ResultadoPromocoesAdmin,
  StatusPromocao,
  TipoBeneficioPromocao,
  TipoCampanhaPromocao,
  TipoDescontoPromocao,
} from "../../types";

type FiltrosPromocoesAdmin = {
  busca: string;
  status: string;
  pagina: number;
};

type FormularioPromocaoAdmin = {
  id?: string;
  nome: string;
  slug: string;
  status: StatusPromocao;
  tipoBeneficio: TipoBeneficioPromocao;
  tipoCampanha: TipoCampanhaPromocao;
  tipoDesconto: TipoDescontoPromocao;
  valorDesconto: number;
  prioridade: number;
  acumulativa: boolean;
  dataInicio: string;
  dataFim: string;
  badgePromocional: string;
  countdownPromocionalDataFim: string;
  produtos: ProdutoPromocaoAdmin[];
  categorias: CategoriaPromocaoAdmin[];
  marcas: MarcaPromocaoAdmin[];
  subtotalMinimo: number | "";
  subtotalMaximo: number | "";
  freteGratisSubtotalMinimo: number | "";
  freteGratisModalidade: string;
  freteGratisRegiaoCodigo: string;
  freteGratisFreteServicoCodigo: string;
  freteGratisFreteServicoTipo: "todos" | "transportadora" | "servico";
  freteGratisMensagemProgressiva: string;
};

type PaginaPromocoesAdminProps = {
  resultado: ResultadoPromocoesAdmin;
  filtros: FiltrosPromocoesAdmin;
};

const formularioInicial: FormularioPromocaoAdmin = {
  nome: "",
  slug: "",
  status: "inativa",
  tipoBeneficio: "desconto",
  tipoCampanha: "normal",
  tipoDesconto: "percentual",
  valorDesconto: 10,
  prioridade: 0,
  acumulativa: false,
  dataInicio: "",
  dataFim: "",
  badgePromocional: "",
  countdownPromocionalDataFim: "",
  produtos: [],
  categorias: [],
  marcas: [],
  subtotalMinimo: "",
  subtotalMaximo: "",
  freteGratisSubtotalMinimo: "",
  freteGratisModalidade: "todas",
  freteGratisRegiaoCodigo: "todas",
  freteGratisFreteServicoCodigo: "todos",
  freteGratisFreteServicoTipo: "todos",
  freteGratisMensagemProgressiva: "",
};

const rotulosStatus: Record<StatusPromocao, string> = {
  ativa: "Ativa",
  inativa: "Inativa",
  agendada: "Agendada",
  encerrada: "Encerrada",
};

function formatarPreco(valor: number | null) {
  if (valor === null) return "Sem preço";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor / 100);
}

function formatarData(data: Date | string | null) {
  if (!data) return "Sem fim";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function converterDataParaInput(data: Date | string | null) {
  if (!data) return "";
  const dataConvertida = new Date(data);
  const deslocamento = dataConvertida.getTimezoneOffset() * 60000;
  return new Date(dataConvertida.getTime() - deslocamento)
    .toISOString()
    .slice(0, 16);
}

function converterInputParaData(valor: string) {
  return valor ? new Date(valor) : null;
}

function gerarSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function criarFormularioPorPromocao(
  promocao: PromocaoAdmin,
): FormularioPromocaoAdmin {
  return {
    id: promocao.id,
    nome: promocao.nome,
    slug: promocao.slug,
    status: promocao.status,
    tipoBeneficio: promocao.tipoBeneficio,
    tipoCampanha: promocao.tipoCampanha,
    tipoDesconto: promocao.tipoDesconto,
    valorDesconto: promocao.valorDesconto,
    prioridade: promocao.prioridade,
    acumulativa: promocao.acumulativa,
    dataInicio: converterDataParaInput(promocao.dataInicio),
    dataFim: converterDataParaInput(promocao.dataFim),
    badgePromocional: promocao.badgePromocional ?? "",
    countdownPromocionalDataFim: converterDataParaInput(
      promocao.countdownPromocionalDataFim,
    ),
    produtos: promocao.produtos,
    categorias: promocao.categorias,
    marcas: promocao.marcas,
    subtotalMinimo: promocao.subtotais[0]?.subtotalMinimo ?? "",
    subtotalMaximo: promocao.subtotais[0]?.subtotalMaximo ?? "",
    freteGratisSubtotalMinimo: promocao.fretesGratis[0]?.subtotalMinimo ?? "",
    freteGratisModalidade: promocao.fretesGratis[0]?.modalidade ?? "todas",
    freteGratisRegiaoCodigo: promocao.fretesGratis[0]?.regiaoCodigo ?? "todas",
    freteGratisFreteServicoCodigo:
      promocao.fretesGratis[0]?.servicoCodigo ??
      promocao.fretesGratis[0]?.transportadoraCodigo ??
      "todos",
    freteGratisFreteServicoTipo: promocao.fretesGratis[0]?.servicoCodigo
      ? "servico"
      : promocao.fretesGratis[0]?.transportadoraCodigo
        ? "transportadora"
        : "todos",
    freteGratisMensagemProgressiva:
      promocao.fretesGratis[0]?.mensagemProgressiva ?? "",
  };
}

function obterBadgeStatus(promocao: PromocaoAdmin) {
  const agora = Date.now();
  const dataInicio = new Date(promocao.dataInicio).getTime();
  const dataFim = promocao.dataFim
    ? new Date(promocao.dataFim).getTime()
    : null;

  if (promocao.status === "ativa" && dataInicio > agora) {
    return { rotulo: "Agendada", classe: "bg-amber-100 text-amber-800" };
  }

  if (dataFim && dataFim < agora) {
    return { rotulo: "Expirada", classe: "bg-slate-100 text-slate-700" };
  }

  if (promocao.status === "ativa") {
    return { rotulo: "Ativa", classe: "bg-emerald-100 text-emerald-800" };
  }

  if (promocao.status === "agendada") {
    return { rotulo: "Agendada", classe: "bg-amber-100 text-amber-800" };
  }

  if (promocao.status === "encerrada") {
    return { rotulo: "Encerrada", classe: "bg-slate-100 text-slate-700" };
  }

  return { rotulo: "Inativa", classe: "bg-zinc-100 text-zinc-700" };
}

export function PaginaPromocoesAdmin({
  resultado,
  filtros,
}: PaginaPromocoesAdminProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formulario, setFormulario] =
    useState<FormularioPromocaoAdmin>(formularioInicial);
  const [buscaProdutos, setBuscaProdutos] = useState("");
  const [buscaCategorias, setBuscaCategorias] = useState("");
  const [buscaMarcas, setBuscaMarcas] = useState("");
  const [buscaRegioes, setBuscaRegioes] = useState("");
  const [buscaFretesServicos, setBuscaFretesServicos] = useState("");
  const [produtosEncontrados, setProdutosEncontrados] = useState<
    ProdutoPromocaoAdmin[]
  >([]);
  const [categoriasEncontradas, setCategoriasEncontradas] = useState<
    CategoriaPromocaoAdmin[]
  >([]);
  const [marcasEncontradas, setMarcasEncontradas] = useState<
    MarcaPromocaoAdmin[]
  >([]);
  const [regioesEncontradas, setRegioesEncontradas] = useState<
    RegiaoPromocaoAdmin[]
  >([]);
  const [fretesServicosEncontrados, setFretesServicosEncontrados] = useState<
    FreteServicoPromocaoAdmin[]
  >([]);
  const [buscandoProdutos, setBuscandoProdutos] = useState(false);
  const [buscandoCategorias, setBuscandoCategorias] = useState(false);
  const [buscandoMarcas, setBuscandoMarcas] = useState(false);
  const [buscandoRegioes, setBuscandoRegioes] = useState(false);
  const [buscandoFretesServicos, setBuscandoFretesServicos] = useState(false);
  const [filtrosLocais, setFiltrosLocais] = useState(filtros);

  const produtosSelecionadosIds = useMemo(
    () => new Set(formulario.produtos.map((produto) => produto.id)),
    [formulario.produtos],
  );
  const categoriasSelecionadasIds = useMemo(
    () => new Set(formulario.categorias.map((categoria) => categoria.id)),
    [formulario.categorias],
  );
  const marcasSelecionadasIds = useMemo(
    () => new Set(formulario.marcas.map((marca) => marca.id)),
    [formulario.marcas],
  );

  useEffect(() => {
    if (buscaProdutos.trim().length < 2) {
      setProdutosEncontrados([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setBuscandoProdutos(true);
      try {
        const produtos = await buscarProdutosPromocaoAdmin({
          busca: buscaProdutos,
          limite: 8,
        });
        setProdutosEncontrados(produtos);
      } catch {
        toast.error("Não foi possível buscar produtos.");
      } finally {
        setBuscandoProdutos(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [buscaProdutos]);

  useEffect(() => {
    if (buscaCategorias.trim().length < 2) {
      setCategoriasEncontradas([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setBuscandoCategorias(true);
      try {
        const categorias = await buscarCategoriasPromocaoAdmin({
          busca: buscaCategorias,
          limite: 8,
        });
        setCategoriasEncontradas(categorias);
      } catch {
        toast.error("Não foi possível buscar categorias.");
      } finally {
        setBuscandoCategorias(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [buscaCategorias]);

  useEffect(() => {
    if (buscaMarcas.trim().length < 2) {
      setMarcasEncontradas([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setBuscandoMarcas(true);
      try {
        const marcas = await buscarMarcasPromocaoAdmin({
          busca: buscaMarcas,
          limite: 8,
        });
        setMarcasEncontradas(marcas);
      } catch {
        toast.error("Não foi possível buscar marcas.");
      } finally {
        setBuscandoMarcas(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [buscaMarcas]);

  useEffect(() => {
    if (buscaRegioes.trim().length < 2) {
      setRegioesEncontradas([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setBuscandoRegioes(true);
      try {
        const regioes = await buscarRegioesPromocaoAdmin({
          busca: buscaRegioes,
          limite: 8,
        });
        setRegioesEncontradas(regioes);
      } catch {
        toast.error("Não foi possível buscar regiões promocionais.");
      } finally {
        setBuscandoRegioes(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [buscaRegioes]);

  useEffect(() => {
    if (buscaFretesServicos.trim().length < 2) {
      setFretesServicosEncontrados([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setBuscandoFretesServicos(true);
      try {
        const fretesServicos = await buscarFretesServicosPromocaoAdmin({
          busca: buscaFretesServicos,
          limite: 8,
        });
        setFretesServicosEncontrados(fretesServicos);
      } catch {
        toast.error("Não foi possível buscar transportadoras/serviços.");
      } finally {
        setBuscandoFretesServicos(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [buscaFretesServicos]);

  function atualizarFiltro(campo: keyof FiltrosPromocoesAdmin, valor: string) {
    setFiltrosLocais((atual) => ({
      ...atual,
      [campo]: campo === "pagina" ? Number(valor) : valor,
    }));
  }

  function aplicarFiltros(pagina = 1) {
    const params = new URLSearchParams();
    if (filtrosLocais.busca) params.set("busca", filtrosLocais.busca);
    if (filtrosLocais.status && filtrosLocais.status !== "todos") {
      params.set("status", filtrosLocais.status);
    }
    params.set("pagina", String(pagina));
    router.push(`/admin/marketing/promocoes?${params.toString()}`);
  }

  function atualizarFormulario<TCampo extends keyof FormularioPromocaoAdmin>(
    campo: TCampo,
    valor: FormularioPromocaoAdmin[TCampo],
  ) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
      ...(campo === "nome" && !atual.id
        ? { slug: gerarSlug(String(valor)) }
        : {}),
    }));
  }

  function selecionarProduto(produto: ProdutoPromocaoAdmin) {
    if (produtosSelecionadosIds.has(produto.id)) {
      toast.info("Produto já vinculado nesta promoção.");
      return;
    }

    setFormulario((atual) => ({
      ...atual,
      produtos: [...atual.produtos, { ...produto, modalidade: null }],
    }));
  }

  function atualizarModalidadeProduto(produtoId: string, modalidade: string) {
    setFormulario((atual) => ({
      ...atual,
      produtos: atual.produtos.map((produto) =>
        produto.id === produtoId
          ? {
              ...produto,
              modalidade: modalidade === "todas" ? null : modalidade,
            }
          : produto,
      ),
    }));
  }

  function selecionarCategoria(categoria: CategoriaPromocaoAdmin) {
    if (categoriasSelecionadasIds.has(categoria.id)) {
      toast.info("Categoria já vinculada nesta promoção.");
      return;
    }

    setFormulario((atual) => ({
      ...atual,
      categorias: [...atual.categorias, categoria],
    }));
  }

  function selecionarMarca(marca: MarcaPromocaoAdmin) {
    if (marcasSelecionadasIds.has(marca.id)) {
      toast.info("Marca já vinculada nesta promoção.");
      return;
    }

    setFormulario((atual) => ({
      ...atual,
      marcas: [...atual.marcas, marca],
    }));
  }

  function selecionarRegiaoFreteGratis(regiao: RegiaoPromocaoAdmin) {
    atualizarFormulario("freteGratisRegiaoCodigo", regiao.codigo);
    setBuscaRegioes(regiao.nome);
    setRegioesEncontradas([]);
  }

  function selecionarFreteServicoFreteGratis(
    freteServico: FreteServicoPromocaoAdmin,
  ) {
    atualizarFormulario("freteGratisFreteServicoCodigo", freteServico.codigo);
    atualizarFormulario("freteGratisFreteServicoTipo", freteServico.tipo);
    setBuscaFretesServicos(freteServico.nome);
    setFretesServicosEncontrados([]);
  }

  function removerProduto(produtoId: string) {
    setFormulario((atual) => ({
      ...atual,
      produtos: atual.produtos.filter((produto) => produto.id !== produtoId),
    }));
  }

  function removerCategoria(categoriaId: string) {
    setFormulario((atual) => ({
      ...atual,
      categorias: atual.categorias.filter(
        (categoria) => categoria.id !== categoriaId,
      ),
    }));
  }

  function removerMarca(marcaId: string) {
    setFormulario((atual) => ({
      ...atual,
      marcas: atual.marcas.filter((marca) => marca.id !== marcaId),
    }));
  }

  function normalizarValorOpcional(valor: number | "") {
    return valor === "" ? null : valor;
  }

  function executarAcao(
    acao: () => Promise<{ success: boolean }>,
    mensagemSucesso: string,
  ) {
    startTransition(async () => {
      try {
        await acao();
        toast.success(mensagemSucesso);
        setFormulario(formularioInicial);
        setBuscaProdutos("");
        setBuscaCategorias("");
        setBuscaMarcas("");
        setBuscaRegioes("");
        setBuscaFretesServicos("");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a ação.",
        );
      }
    });
  }

  function salvarFormulario() {
    executarAcao(
      () =>
        salvarPromocaoAdmin({
          id: formulario.id,
          nome: formulario.nome,
          slug: formulario.slug,
          status: formulario.status,
          tipoBeneficio: formulario.tipoBeneficio,
          tipoCampanha: formulario.tipoCampanha,
          tipoDesconto: formulario.tipoDesconto,
          valorDesconto: formulario.valorDesconto,
          prioridade: formulario.prioridade,
          acumulativa: formulario.acumulativa,
          dataInicio: converterInputParaData(formulario.dataInicio),
          dataFim: converterInputParaData(formulario.dataFim),
          badgePromocional: formulario.badgePromocional || null,
          countdownPromocionalDataFim: converterInputParaData(
            formulario.countdownPromocionalDataFim,
          ),
          produtos: formulario.produtos.map((produto) => ({
            produtoId: produto.id,
            modalidade: produto.modalidade,
          })),
          produtosIds: formulario.produtos.map((produto) => produto.id),
          categoriasIds: formulario.categorias.map((categoria) => categoria.id),
          marcasIds: formulario.marcas.map((marca) => marca.id),
          subtotalMinimo: normalizarValorOpcional(formulario.subtotalMinimo),
          subtotalMaximo: normalizarValorOpcional(formulario.subtotalMaximo),
          freteGratisSubtotalMinimo: normalizarValorOpcional(
            formulario.freteGratisSubtotalMinimo,
          ),
          freteGratisModalidade:
            formulario.freteGratisModalidade === "todas"
              ? null
              : formulario.freteGratisModalidade,
          freteGratisRegiaoCodigo:
            formulario.freteGratisRegiaoCodigo === "todas"
              ? null
              : formulario.freteGratisRegiaoCodigo,
          freteGratisTransportadoraCodigo:
            formulario.freteGratisFreteServicoTipo === "transportadora"
              ? formulario.freteGratisFreteServicoCodigo
              : null,
          freteGratisServicoCodigo:
            formulario.freteGratisFreteServicoTipo === "servico"
              ? formulario.freteGratisFreteServicoCodigo
              : null,
          freteGratisMensagemProgressiva:
            formulario.freteGratisMensagemProgressiva || null,
        }),
      formulario.id ? "Promoção atualizada." : "Promoção criada.",
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">
              Marketing
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                Promoções
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                Controle campanhas por produto com prioridade, período e
                descontos seguros para o motor central de preços.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              asChild
              variant="outline"
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
            >
              <Link href="/admin/marketing/promocoes/diagnostico-relampago">
                <Activity className="h-4 w-4" />
                Diagnóstico relâmpago
              </Link>
            </Button>
            <Button
              type="button"
              onClick={() => setFormulario(formularioInicial)}
              className="w-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova promoção
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={filtrosLocais.busca}
                    onChange={(event) =>
                      atualizarFiltro("busca", event.target.value)
                    }
                    placeholder="Buscar por nome ou slug"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filtrosLocais.status || "todos"}
                  onValueChange={(valor) => atualizarFiltro("status", valor)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="encerrada">Encerrada</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={() => aplicarFiltros(1)}>
                  Filtrar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hidden overflow-hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promoção</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Abrangência</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.promocoes.map((promocao) => {
                  const badge = obterBadgeStatus(promocao);

                  return (
                    <TableRow key={promocao.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-950">
                            {promocao.nome}
                          </p>
                          <p className="text-xs text-slate-500">
                            {promocao.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            promocao.tipoCampanha === "relampago"
                              ? "border-orange-300 bg-orange-50 text-orange-800"
                              : ""
                          }
                        >
                          {promocao.tipoCampanha === "relampago"
                            ? "Relâmpago"
                            : "Normal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={badge.classe}>{badge.rotulo}</Badge>
                      </TableCell>
                      <TableCell>
                        {promocao.tipoDesconto === "percentual"
                          ? `${promocao.valorDesconto}%`
                          : formatarPreco(promocao.valorDesconto)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs leading-5 text-slate-600">
                          <p>{formatarData(promocao.dataInicio)}</p>
                          <p>até {formatarData(promocao.dataFim)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            promocao.prioridade >= 50
                              ? "border-amber-300 bg-amber-50 text-amber-800"
                              : ""
                          }
                        >
                          {promocao.prioridade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {promocao.quantidadeProdutos > 0 && (
                            <Badge variant="outline">
                              {promocao.quantidadeProdutos} prod.
                            </Badge>
                          )}
                          {promocao.quantidadeCategorias > 0 && (
                            <Badge variant="outline">
                              {promocao.quantidadeCategorias} cat.
                            </Badge>
                          )}
                          {promocao.quantidadeMarcas > 0 && (
                            <Badge variant="outline">
                              {promocao.quantidadeMarcas} marcas
                            </Badge>
                          )}
                          {promocao.possuiRegraSubtotal && (
                            <Badge variant="outline">subtotal</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setFormulario(
                                criarFormularioPorPromocao(promocao),
                              )
                            }
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              executarAcao(
                                () =>
                                  alternarStatusPromocaoAdmin(
                                    promocao.id,
                                    promocao.status === "ativa"
                                      ? "inativa"
                                      : "ativa",
                                  ),
                                promocao.status === "ativa"
                                  ? "Promoção desativada."
                                  : "Promoção ativada.",
                              )
                            }
                          >
                            {promocao.status === "ativa" ? (
                              <PauseCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              executarAcao(
                                () => duplicarPromocaoAdmin(promocao.id),
                                "Promoção duplicada.",
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="space-y-3 lg:hidden">
            {resultado.promocoes.map((promocao) => {
              const badge = obterBadgeStatus(promocao);

              return (
                <Card key={promocao.id}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {promocao.nome}
                        </p>
                        <p className="text-xs text-slate-500">
                          {promocao.slug}
                        </p>
                      </div>
                      <Badge className={badge.classe}>{badge.rotulo}</Badge>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        promocao.tipoCampanha === "relampago"
                          ? "w-fit border-orange-300 bg-orange-50 text-orange-800"
                          : "w-fit"
                      }
                    >
                      {promocao.tipoCampanha === "relampago"
                        ? "Relâmpago"
                        : "Normal"}
                    </Badge>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Desconto</p>
                        <p className="font-semibold">
                          {promocao.tipoDesconto === "percentual"
                            ? `${promocao.valorDesconto}%`
                            : formatarPreco(promocao.valorDesconto)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Abrangência</p>
                        <p className="font-semibold">
                          {[
                            promocao.quantidadeProdutos > 0
                              ? `${promocao.quantidadeProdutos} prod.`
                              : null,
                            promocao.quantidadeCategorias > 0
                              ? `${promocao.quantidadeCategorias} cat.`
                              : null,
                            promocao.quantidadeMarcas > 0
                              ? `${promocao.quantidadeMarcas} marcas`
                              : null,
                            promocao.possuiRegraSubtotal ? "subtotal" : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Sem escopo"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          setFormulario(criarFormularioPorPromocao(promocao))
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          executarAcao(
                            () => duplicarPromocaoAdmin(promocao.id),
                            "Promoção duplicada.",
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border bg-white p-4 sm:flex-row">
            <p className="text-sm text-slate-600">
              Página {resultado.pagina} de {resultado.totalPaginas} ·{" "}
              {resultado.total} promoções
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={resultado.pagina <= 1}
                onClick={() => aplicarFiltros(resultado.pagina - 1)}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={resultado.pagina >= resultado.totalPaginas}
                onClick={() => aplicarFiltros(resultado.pagina + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>

        <Card className="h-fit xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              {formulario.id ? "Editar promoção" : "Criar promoção"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formulario.nome}
                  onChange={(event) =>
                    atualizarFormulario("nome", event.target.value)
                  }
                  placeholder="Semana do consumidor"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formulario.slug}
                  onChange={(event) =>
                    atualizarFormulario("slug", gerarSlug(event.target.value))
                  }
                  placeholder="semana-do-consumidor"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formulario.status}
                    onValueChange={(valor: StatusPromocao) =>
                      atualizarFormulario("status", valor)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(rotulosStatus).map(([valor, rotulo]) => (
                        <SelectItem key={valor} value={valor}>
                          {rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Benefício</Label>
                  <Select
                    value={formulario.tipoBeneficio}
                    onValueChange={(valor: TipoBeneficioPromocao) =>
                      atualizarFormulario("tipoBeneficio", valor)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desconto">Desconto</SelectItem>
                      <SelectItem value="frete_gratis">Frete grátis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Campanha</Label>
                  <Select
                    value={formulario.tipoCampanha}
                    onValueChange={(valor: TipoCampanhaPromocao) =>
                      atualizarFormulario("tipoCampanha", valor)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="relampago">Relâmpago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formulario.tipoBeneficio === "desconto" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo desconto</Label>
                    <Select
                      value={formulario.tipoDesconto}
                      onValueChange={(valor: TipoDescontoPromocao) =>
                        atualizarFormulario("tipoDesconto", valor)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentual">Percentual</SelectItem>
                        <SelectItem value="valor_fixo">Valor fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor desconto</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formulario.valorDesconto}
                      onChange={(event) =>
                        atualizarFormulario(
                          "valorDesconto",
                          Number(event.target.value),
                        )
                      }
                    />
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formulario.prioridade}
                    onChange={(event) =>
                      atualizarFormulario(
                        "prioridade",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input
                    type="datetime-local"
                    value={formulario.dataInicio}
                    onChange={(event) =>
                      atualizarFormulario("dataInicio", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input
                    type="datetime-local"
                    value={formulario.dataFim}
                    onChange={(event) =>
                      atualizarFormulario("dataFim", event.target.value)
                    }
                  />
                </div>
              </div>
              {formulario.tipoCampanha === "relampago" && (
                <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4">
                  <div className="mb-3">
                    <Label>Configuração relâmpago</Label>
                    <p className="mt-1 text-xs text-orange-800">
                      Data final é obrigatória; o countdown oficial usa a data
                      abaixo ou a data fim da promoção.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Badge oficial</Label>
                      <Input
                        value={formulario.badgePromocional}
                        onChange={(event) =>
                          atualizarFormulario(
                            "badgePromocional",
                            event.target.value,
                          )
                        }
                        placeholder="Oferta relâmpago"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Countdown até</Label>
                      <Input
                        type="datetime-local"
                        value={formulario.countdownPromocionalDataFim}
                        onChange={(event) =>
                          atualizarFormulario(
                            "countdownPromocionalDataFim",
                            event.target.value,
                          )
                        }
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
              <label className="flex items-center justify-between rounded-2xl border p-4">
                <span>
                  <span className="block text-sm font-medium">Acumulativa</span>
                  <span className="text-xs text-slate-500">
                    Preparado para regras futuras.
                  </span>
                </span>
                <Switch
                  checked={formulario.acumulativa}
                  onCheckedChange={(valor) =>
                    atualizarFormulario("acumulativa", valor)
                  }
                />
              </label>
            </div>

            <div className="space-y-3 rounded-3xl border bg-slate-50 p-4">
              <div>
                <Label>Produtos vinculados</Label>
                <p className="mt-1 text-xs text-slate-500">
                  Busque por nome, slug ou SKU. Produtos duplicados são
                  bloqueados.
                </p>
              </div>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={buscaProdutos}
                  onChange={(event) => setBuscaProdutos(event.target.value)}
                  placeholder="Buscar produto..."
                  className="bg-white pl-9"
                />
              </div>
              <div className="space-y-2">
                {buscandoProdutos && (
                  <p className="text-sm text-slate-500">Buscando produtos...</p>
                )}
                {produtosEncontrados.map((produto) => (
                  <button
                    key={produto.id}
                    type="button"
                    onClick={() => selecionarProduto(produto)}
                    className="flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <img
                      src={produto.imagemUrl || "/produto-sem-foto.webp"}
                      alt={produto.nome}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {produto.nome}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        SKU {produto.sku} ·{" "}
                        {formatarPreco(produto.precoAtualEmCentavos)}
                      </span>
                    </span>
                    <Tag className="h-4 w-4 text-blue-600" />
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {formulario.produtos.map((produto) => (
                  <div
                    key={produto.id}
                    className="flex items-center gap-3 rounded-2xl border bg-white p-3"
                  >
                    <img
                      src={produto.imagemUrl || "/produto-sem-foto.webp"}
                      alt={produto.nome}
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {produto.nome}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {produto.sku} ·{" "}
                        {formatarPreco(produto.precoAtualEmCentavos)}
                      </p>
                      <div className="mt-2 max-w-56">
                        <Select
                          value={produto.modalidade ?? "todas"}
                          onValueChange={(valor) =>
                            atualizarModalidadeProduto(produto.id, valor)
                          }
                        >
                          <SelectTrigger className="h-8 bg-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">
                              Todas as modalidades
                            </SelectItem>
                            {produto.modalidadesDisponiveis.map(
                              (modalidade) => (
                                <SelectItem key={modalidade} value={modalidade}>
                                  {modalidade}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerProduto(produto.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border bg-slate-50 p-4">
              <div>
                <Label>Categorias vinculadas</Label>
                <p className="mt-1 text-xs text-slate-500">
                  Aplica a regra para produtos da categoria informada.
                </p>
              </div>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={buscaCategorias}
                  onChange={(event) => setBuscaCategorias(event.target.value)}
                  placeholder="Buscar categoria..."
                  className="bg-white pl-9"
                />
              </div>
              <div className="space-y-2">
                {buscandoCategorias && (
                  <p className="text-sm text-slate-500">
                    Buscando categorias...
                  </p>
                )}
                {categoriasEncontradas.map((categoria) => (
                  <button
                    key={categoria.id}
                    type="button"
                    onClick={() => selecionarCategoria(categoria)}
                    className="flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Layers3 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {categoria.nome}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {categoria.slug}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {formulario.categorias.map((categoria) => (
                  <div
                    key={categoria.id}
                    className="flex items-center gap-3 rounded-2xl border bg-white p-3"
                  >
                    <Layers3 className="h-4 w-4 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {categoria.nome}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {categoria.slug}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerCategoria(categoria.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border bg-slate-50 p-4">
              <div>
                <Label>Marcas vinculadas</Label>
                <p className="mt-1 text-xs text-slate-500">
                  Aplica a regra para produtos da marca informada.
                </p>
              </div>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={buscaMarcas}
                  onChange={(event) => setBuscaMarcas(event.target.value)}
                  placeholder="Buscar marca..."
                  className="bg-white pl-9"
                />
              </div>
              <div className="space-y-2">
                {buscandoMarcas && (
                  <p className="text-sm text-slate-500">Buscando marcas...</p>
                )}
                {marcasEncontradas.map((marca) => (
                  <button
                    key={marca.id}
                    type="button"
                    onClick={() => selecionarMarca(marca)}
                    className="flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-700">
                      {marca.logoUrl ? (
                        <img
                          src={marca.logoUrl}
                          alt={marca.nome}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {marca.nome}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {marca.slug}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {formulario.marcas.map((marca) => (
                  <div
                    key={marca.id}
                    className="flex items-center gap-3 rounded-2xl border bg-white p-3"
                  >
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {marca.nome}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {marca.slug}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerMarca(marca.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border bg-slate-50 p-4">
              <div>
                <Label>Regra por subtotal</Label>
                <p className="mt-1 text-xs text-slate-500">
                  Faixa preparada para uso server-side futuro em carrinho e
                  checkout, sem integrar visualmente nesta etapa.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Receipt className="h-3.5 w-3.5" />
                    Subtotal mínimo
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={formulario.subtotalMinimo}
                    onChange={(event) =>
                      atualizarFormulario(
                        "subtotalMinimo",
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                      )
                    }
                    placeholder="Ex: 50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Subtotal máximo opcional</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formulario.subtotalMaximo}
                    onChange={(event) =>
                      atualizarFormulario(
                        "subtotalMaximo",
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                      )
                    }
                    placeholder="Sem limite"
                  />
                </div>
              </div>
            </div>

            {formulario.tipoBeneficio === "frete_gratis" ? (
              <div className="space-y-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                <div>
                  <Label>Frete grátis progressivo</Label>
                  <p className="mt-1 text-xs text-emerald-800">
                    Benefício promocional calculado separadamente da logística.
                    Não altera transportadoras, regras de entrega ou checkout
                    logístico.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Subtotal mínimo</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formulario.freteGratisSubtotalMinimo}
                      onChange={(event) =>
                        atualizarFormulario(
                          "freteGratisSubtotalMinimo",
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                        )
                      }
                      placeholder="Ex: 29900"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Modalidade opcional</Label>
                    <Select
                      value={formulario.freteGratisModalidade}
                      onValueChange={(valor) =>
                        atualizarFormulario("freteGratisModalidade", valor)
                      }
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">
                          Todas as modalidades
                        </SelectItem>
                        <SelectItem value="stock">Estoque próprio</SelectItem>
                        <SelectItem value="pre_sale">
                          Reserva/pré-venda
                        </SelectItem>
                        <SelectItem value="dropshipping">
                          Dropshipping
                        </SelectItem>
                        <SelectItem value="order_basis">Fabricante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Região promocional opcional</Label>
                  <div className="rounded-2xl border border-emerald-200 bg-white p-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={buscaRegioes}
                        onChange={(event) =>
                          setBuscaRegioes(event.target.value)
                        }
                        placeholder="Buscar Brasil, Sudeste, MG, BH ou região de entrega"
                        className="bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          atualizarFormulario(
                            "freteGratisRegiaoCodigo",
                            "todas",
                          );
                          setBuscaRegioes("");
                          setRegioesEncontradas([]);
                        }}
                      >
                        Todas regiões
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-800">
                      <MapPin className="size-3.5" />
                      {formulario.freteGratisRegiaoCodigo === "todas"
                        ? "Regra global, válida para qualquer região."
                        : `Escopo regional: ${formulario.freteGratisRegiaoCodigo}`}
                    </div>
                    {buscandoRegioes ? (
                      <p className="mt-2 text-xs text-emerald-700">
                        Buscando regiões...
                      </p>
                    ) : null}
                    {regioesEncontradas.length > 0 ? (
                      <div className="mt-3 grid gap-2">
                        {regioesEncontradas.map((regiao) => (
                          <button
                            key={regiao.codigo}
                            type="button"
                            className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-left transition hover:border-emerald-300"
                            onClick={() => selecionarRegiaoFreteGratis(regiao)}
                          >
                            <span className="block text-sm font-medium text-emerald-950">
                              {regiao.nome}
                            </span>
                            <span className="mt-0.5 block text-xs text-emerald-700">
                              {regiao.descricao} · {regiao.codigo}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">
                    Transportadora/serviço opcional
                  </Label>
                  <div className="rounded-2xl border border-emerald-200 bg-white p-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={buscaFretesServicos}
                        onChange={(event) =>
                          setBuscaFretesServicos(event.target.value)
                        }
                        placeholder="Buscar Correios, Jadlog, Sedex, PAC..."
                        className="bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          atualizarFormulario(
                            "freteGratisFreteServicoCodigo",
                            "todos",
                          );
                          atualizarFormulario(
                            "freteGratisFreteServicoTipo",
                            "todos",
                          );
                          setBuscaFretesServicos("");
                          setFretesServicosEncontrados([]);
                        }}
                      >
                        Todos serviços
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-emerald-800">
                      {formulario.freteGratisFreteServicoTipo === "todos"
                        ? "Regra global, válida para qualquer transportadora/serviço selecionado."
                        : `Escopo: ${formulario.freteGratisFreteServicoCodigo}`}
                    </div>
                    {buscandoFretesServicos ? (
                      <p className="mt-2 text-xs text-emerald-700">
                        Buscando transportadoras/serviços...
                      </p>
                    ) : null}
                    {fretesServicosEncontrados.length > 0 ? (
                      <div className="mt-3 grid gap-2">
                        {fretesServicosEncontrados.map((freteServico) => (
                          <button
                            key={freteServico.codigo}
                            type="button"
                            className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-left transition hover:border-emerald-300"
                            onClick={() =>
                              selecionarFreteServicoFreteGratis(freteServico)
                            }
                          >
                            <span className="block text-sm font-medium text-emerald-950">
                              {freteServico.nome}
                            </span>
                            <span className="mt-0.5 block text-xs text-emerald-700">
                              {freteServico.tipo} · {freteServico.descricao} ·{" "}
                              {freteServico.codigo}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Mensagem progressiva</Label>
                  <Input
                    value={formulario.freteGratisMensagemProgressiva}
                    onChange={(event) =>
                      atualizarFormulario(
                        "freteGratisMensagemProgressiva",
                        event.target.value,
                      )
                    }
                    placeholder="Faltam pouco para ganhar frete grátis"
                    className="bg-white"
                  />
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <CalendarDays className="mb-2 h-4 w-4" />A promoção será consumida
              pelo Promotion Engine central. Nenhuma integração visual com loja,
              PDP, carrinho ou checkout foi feita nesta tela.
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="flex-1"
                disabled={isPending}
                onClick={salvarFormulario}
              >
                {isPending ? "Salvando..." : "Salvar promoção"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormulario(formularioInicial)}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
