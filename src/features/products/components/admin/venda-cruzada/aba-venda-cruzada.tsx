"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  GripVertical,
  Info,
  Loader2,
  PackagePlus,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBuscaProdutosVendaCruzada } from "@/features/products/hooks/use-busca-produtos-venda-cruzada";
import { useConfiguracaoVendaCruzada } from "@/features/products/hooks/use-configuracao-venda-cruzada";
import { useSalvarVendaCruzada } from "@/features/products/hooks/use-salvar-venda-cruzada";
import type { ProdutoVendaCruzadaAdmin } from "@/features/products/types/venda-cruzada.types";

const LIMITE_PRODUTOS = 4;

type AbaVendaCruzadaProps = { produtoId: string };

function formatarPreco(valorEmCentavos: number | null) {
  if (valorEmCentavos === null) return "Preço indisponível";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorEmCentavos / 100);
}

function obterMensagemErro(erro: unknown, alternativa: string) {
  return erro instanceof Error && erro.message ? erro.message : alternativa;
}

function criarAssinatura(ativa: boolean, produtos: ProdutoVendaCruzadaAdmin[]) {
  return JSON.stringify({ ativa, ids: produtos.map((produto) => produto.id) });
}

function StatusProduto({ produto }: { produto: ProdutoVendaCruzadaAdmin }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={produto.ativo ? "success" : "destructive"}>
        {produto.ativo ? "Ativo" : "Inativo"}
      </Badge>
      <Badge variant={produto.publicado ? "info" : "warning"}>
        {produto.publicado ? "Publicado" : "Rascunho"}
      </Badge>
      {!produto.disponivel ? (
        <Badge variant="outline">Indisponível</Badge>
      ) : null}
    </div>
  );
}

function ImagemProduto({ produto }: { produto: ProdutoVendaCruzadaAdmin }) {
  return (
    <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg border">
      <Image
        src={produto.imagemUrl || "/produto-sem-foto.webp"}
        alt=""
        fill
        sizes="56px"
        className="object-cover"
      />
    </div>
  );
}

function ItemSelecionadoOrdenavel({
  indice,
  produto,
  total,
  desabilitado,
  aoMover,
  aoRemover,
}: {
  indice: number;
  produto: ProdutoVendaCruzadaAdmin;
  total: number;
  desabilitado: boolean;
  aoMover: (direcao: -1 | 1) => void;
  aoRemover: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: produto.id, disabled: desabilitado });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-card grid min-w-0 gap-3 rounded-xl border p-3 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto] sm:items-center ${
        isDragging ? "ring-primary/30 z-10 shadow-lg ring-2" : ""
      }`}
    >
      <button
        type="button"
        aria-label={`Reordenar ${produto.nome}`}
        disabled={desabilitado}
        className="text-muted-foreground focus-visible:ring-ring col-start-1 row-start-1 flex size-9 cursor-grab items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:row-auto"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="col-start-2 row-start-1 sm:row-auto">
        <ImagemProduto produto={produto} />
      </div>
      <div className="col-span-2 min-w-0 sm:col-span-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Posição {indice + 1}</Badge>
          <Badge variant="outline">
            {produto.tipo === "variavel" ? "Com variantes" : "Simples"}
          </Badge>
        </div>
        <p className="truncate text-sm font-semibold">{produto.nome}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          SKU {produto.sku} · {formatarPreco(produto.precoComercialEmCentavos)}
        </p>
        <div className="mt-2">
          <StatusProduto produto={produto} />
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={desabilitado || indice === 0}
          aria-label={`Mover ${produto.nome} para cima`}
          onClick={() => aoMover(-1)}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={desabilitado || indice === total - 1}
          aria-label={`Mover ${produto.nome} para baixo`}
          onClick={() => aoMover(1)}
        >
          <ArrowDown className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={desabilitado}
          aria-label={`Remover ${produto.nome}`}
          onClick={aoRemover}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function PreviaVendaCruzada({
  produtoPrincipal,
  produtos,
}: {
  produtoPrincipal: ProdutoVendaCruzadaAdmin;
  produtos: ProdutoVendaCruzadaAdmin[];
}) {
  const [idsMarcados, setIdsMarcados] = useState<string[]>([]);
  const selecionados = produtos.filter((produto) =>
    idsMarcados.includes(produto.id),
  );
  const possuiTotalPix =
    produtoPrincipal.precoPixEmCentavos !== null &&
    selecionados.every((produto) => produto.precoPixEmCentavos !== null);
  const totalPix = possuiTotalPix
    ? (produtoPrincipal.precoPixEmCentavos ?? 0) +
      selecionados.reduce(
        (total, produto) => total + (produto.precoPixEmCentavos ?? 0),
        0,
      )
    : null;
  const totalCartao =
    produtoPrincipal.precoComercialEmCentavos !== null &&
    selecionados.every((produto) => produto.precoComercialEmCentavos !== null)
      ? (produtoPrincipal.precoComercialEmCentavos ?? 0) +
        selecionados.reduce(
          (total, produto) => total + (produto.precoComercialEmCentavos ?? 0),
          0,
        )
      : null;
  const maximoParcelas = Math.min(
    ...[produtoPrincipal, ...selecionados]
      .map((produto) => produto.parcelamentoCartao?.parcelas ?? 0)
      .filter((parcelas) => parcelas > 0),
  );

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Eye className="text-primary size-5" />
          <CardTitle>Prévia administrativa da PDP</CardTitle>
        </div>
        <CardDescription>
          Produtos e preços vêm do catálogo atual, mas esta simulação não altera
          a PDP nem o carrinho.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-background rounded-xl border p-4 sm:p-5">
          <h3 className="text-lg font-bold">Aproveite e leve também</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Uma seleção especial para acrescentar ao seu pedido.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {produtos.length === 0 ? (
              <p className="text-muted-foreground col-span-full rounded-lg border border-dashed p-4 text-center text-sm">
                Adicione produtos para visualizar a seção.
              </p>
            ) : (
              produtos.map((produto) => {
                const marcado = idsMarcados.includes(produto.id);
                return (
                  <label
                    key={produto.id}
                    className="bg-card flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                  >
                    <Checkbox
                      checked={marcado}
                      onCheckedChange={(checked) =>
                        setIdsMarcados((atuais) =>
                          checked
                            ? [...atuais, produto.id]
                            : atuais.filter((id) => id !== produto.id),
                        )
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {produto.nome}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatarPreco(produto.precoPixEmCentavos)} no PIX
                        {produto.tipo === "variavel"
                          ? " · variante será escolhida na PDP"
                          : ""}
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-muted-foreground text-xs">
                Total no PIX com 1 unidade de cada adicional
              </p>
              <p className="text-primary text-xl font-bold">
                {formatarPreco(totalPix)}
              </p>
              {totalCartao !== null &&
              Number.isFinite(maximoParcelas) &&
              maximoParcelas > 0 ? (
                <p className="text-muted-foreground text-xs">
                  ou {maximoParcelas}x de{" "}
                  {formatarPreco(Math.ceil(totalCartao / maximoParcelas))} no
                  cartão
                </p>
              ) : null}
            </div>
            <Button type="button" disabled={idsMarcados.length === 0}>
              Adicionar selecionados ao carrinho
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AbaVendaCruzada({ produtoId }: AbaVendaCruzadaProps) {
  const configuracao = useConfiguracaoVendaCruzada(produtoId);
  const salvar = useSalvarVendaCruzada(produtoId);
  const [ativa, setAtiva] = useState(false);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [produtosSelecionados, setProdutosSelecionados] = useState<
    ProdutoVendaCruzadaAdmin[]
  >([]);
  const [assinaturaSalva, setAssinaturaSalva] = useState("");
  const [carregamentoAplicado, setCarregamentoAplicado] = useState(false);
  const buscaProdutos = useBuscaProdutosVendaCruzada(produtoId, buscaDebounced);
  const sensores = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const temporizador = window.setTimeout(
      () => setBuscaDebounced(busca.trim()),
      300,
    );
    return () => window.clearTimeout(temporizador);
  }, [busca]);

  useEffect(() => {
    if (!configuracao.data || carregamentoAplicado) return;
    setAtiva(configuracao.data.ativa);
    setProdutosSelecionados(configuracao.data.produtos);
    setAssinaturaSalva(
      criarAssinatura(configuracao.data.ativa, configuracao.data.produtos),
    );
    setCarregamentoAplicado(true);
  }, [carregamentoAplicado, configuracao.data]);

  const idsSelecionados = useMemo(
    () => new Set(produtosSelecionados.map((produto) => produto.id)),
    [produtosSelecionados],
  );
  const limiteAtingido = produtosSelecionados.length >= LIMITE_PRODUTOS;
  const assinaturaAtual = criarAssinatura(ativa, produtosSelecionados);
  const possuiAlteracoes =
    carregamentoAplicado && assinaturaAtual !== assinaturaSalva;

  function moverProduto(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= produtosSelecionados.length) return;
    setProdutosSelecionados((atuais) => arrayMove(atuais, indice, destino));
  }

  function finalizarArraste(evento: DragEndEvent) {
    if (!evento.over || evento.active.id === evento.over.id) return;
    setProdutosSelecionados((atuais) => {
      const origem = atuais.findIndex(
        (produto) => produto.id === evento.active.id,
      );
      const destino = atuais.findIndex(
        (produto) => produto.id === evento.over!.id,
      );
      return origem < 0 || destino < 0
        ? atuais
        : arrayMove(atuais, origem, destino);
    });
  }

  async function salvarConfiguracao() {
    const resultado = await salvar.mutateAsync({
      produtoPrincipalId: produtoId,
      ativa,
      produtosIds: produtosSelecionados.map((produto) => produto.id),
    });
    if (!resultado.sucesso) {
      toast.error(resultado.mensagem);
      return;
    }
    setAssinaturaSalva(assinaturaAtual);
    toast.success(resultado.mensagem);
  }

  if (configuracao.isPending) {
    return (
      <div className="text-muted-foreground flex min-h-56 items-center justify-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Carregando venda cruzada...
      </div>
    );
  }

  if (configuracao.isError || !configuracao.data) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="space-y-3 p-6 text-center">
          <p className="text-sm font-medium">
            {obterMensagemErro(
              configuracao.error,
              "Não foi possível carregar a venda cruzada.",
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => configuracao.refetch()}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <PackagePlus className="text-primary size-5" />
                Venda cruzada
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl">
                Selecione produtos para exibir na seção “Aproveite e leve
                também” da página deste produto.
              </CardDescription>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 sm:justify-start">
              <Label htmlFor="venda-cruzada-ativa" className="cursor-pointer">
                {ativa ? "Ativada" : "Desativada"}
              </Label>
              <Switch
                id="venda-cruzada-ativa"
                checked={ativa}
                disabled={salvar.isPending}
                onCheckedChange={setAtiva}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="bg-muted/50 flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <Info className="text-primary mt-0.5 size-4 shrink-0" />
              <p className="text-muted-foreground">
                Produtos não compráveis permanecem configurados, mas serão
                ocultados da PDP pública.
              </p>
            </div>
            <Badge variant={limiteAtingido ? "warning" : "secondary"}>
              {produtosSelecionados.length} de {LIMITE_PRODUTOS} produtos
            </Badge>
          </div>
          <div>
            <Label htmlFor="busca-venda-cruzada">Buscar no catálogo</Label>
            <div className="relative mt-2">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="busca-venda-cruzada"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Busque por nome ou SKU"
                className="pl-9"
              />
            </div>
          </div>

          {buscaProdutos.isPending ? (
            <div className="text-muted-foreground flex min-h-28 items-center justify-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Buscando produtos...
            </div>
          ) : buscaProdutos.isError ? (
            <div className="border-destructive/30 rounded-lg border p-4 text-center text-sm">
              <p>
                {obterMensagemErro(
                  buscaProdutos.error,
                  "Não foi possível buscar produtos.",
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => buscaProdutos.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 lg:grid-cols-2">
              {buscaProdutos.data?.map((produto) => {
                const ehProdutoPrincipal = produto.id === produtoId;
                const jaSelecionado = idsSelecionados.has(produto.id);
                const bloqueado =
                  ehProdutoPrincipal || jaSelecionado || limiteAtingido;
                const texto = ehProdutoPrincipal
                  ? "Produto atual"
                  : jaSelecionado
                    ? "Já selecionado"
                    : limiteAtingido
                      ? "Limite atingido"
                      : "Adicionar";
                const explicacao = ehProdutoPrincipal
                  ? "O produto não pode ser relacionado a ele mesmo."
                  : limiteAtingido && !jaSelecionado
                    ? "Remova um item para liberar uma das quatro vagas."
                    : undefined;
                return (
                  <div
                    key={produto.id}
                    className="bg-card grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                  >
                    <ImagemProduto produto={produto} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {produto.nome}
                        </p>
                        <Badge variant="outline">
                          {produto.tipo === "variavel"
                            ? "Com variantes"
                            : "Simples"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        SKU {produto.sku} ·{" "}
                        {formatarPreco(produto.precoComercialEmCentavos)}
                      </p>
                      <div className="mt-1.5">
                        <StatusProduto produto={produto} />
                      </div>
                    </div>
                    <div className="col-span-2 flex flex-col items-end sm:col-span-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={bloqueado ? "secondary" : "outline"}
                        disabled={bloqueado || salvar.isPending}
                        title={explicacao || texto}
                        onClick={() =>
                          setProdutosSelecionados((atuais) => [
                            ...atuais,
                            produto,
                          ])
                        }
                      >
                        {!bloqueado ? <Plus className="size-4" /> : null}
                        {texto}
                      </Button>
                      {explicacao ? (
                        <p className="text-muted-foreground mt-1 max-w-44 text-right text-[11px]">
                          {explicacao}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {buscaProdutos.data?.length === 0 ? (
                <p className="text-muted-foreground col-span-full rounded-lg border border-dashed p-6 text-center text-sm">
                  Nenhum produto encontrado.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos selecionados</CardTitle>
          <CardDescription>
            Arraste os itens ou use as setas para definir a ordem persistida na
            PDP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {produtosSelecionados.length === 0 ? (
            <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
              Nenhum produto selecionado. Use a busca acima para montar a venda
              cruzada.
            </div>
          ) : (
            <DndContext
              sensors={sensores}
              collisionDetection={closestCenter}
              onDragEnd={finalizarArraste}
            >
              <SortableContext
                items={produtosSelecionados.map((produto) => produto.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {produtosSelecionados.map((produto, indice) => (
                    <ItemSelecionadoOrdenavel
                      key={produto.id}
                      produto={produto}
                      indice={indice}
                      total={produtosSelecionados.length}
                      desabilitado={salvar.isPending}
                      aoMover={(direcao) => moverProduto(indice, direcao)}
                      aoRemover={() =>
                        setProdutosSelecionados((atuais) =>
                          atuais.filter((item) => item.id !== produto.id),
                        )
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          <div className="mt-5 flex flex-col gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs">
              {possuiAlteracoes
                ? "Há alterações ainda não salvas."
                : "Configuração sincronizada com o banco."}
            </p>
            <Button
              type="button"
              disabled={!possuiAlteracoes || salvar.isPending}
              onClick={salvarConfiguracao}
            >
              {salvar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {salvar.isPending ? "Salvando..." : "Salvar venda cruzada"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PreviaVendaCruzada
        produtoPrincipal={configuracao.data.produtoPrincipal}
        produtos={produtosSelecionados}
      />
    </div>
  );
}
