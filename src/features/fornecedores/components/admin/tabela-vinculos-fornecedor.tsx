"use client";

import { CheckCircle2, Link2, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ProductFormData } from "@/app/admin/products/new/data/product-form-data";
import {
  type DadosFornecedorParaRascunhoProduto,
  ModalRascunhoProdutoFornecedor,
} from "./modal-rascunho-produto-fornecedor";

export type StatusVinculoFornecedorVisual =
  | "vinculado"
  | "aguardando"
  | "novo"
  | "ignorado"
  | "erro";

export type ProdutoLojaParaVinculoFornecedor = {
  id: string;
  nome: string;
  sku: string;
  categoria?: string | null;
  preco?: string | null;
  jaVinculado?: boolean;
};

export type ItemVinculoFornecedor = {
  id: string;
  produtoRecebido: {
    nome: string;
    codigo?: string | null;
    ean?: string | null;
    ncm?: string | null;
    preco?: string | null;
    estoque?: number | null;
    imagens?: string[];
    pesoBruto?: string | null;
    alturaCaixa?: string | null;
    larguraCaixa?: string | null;
    comprimentoCaixa?: string | null;
    complemento?: string | null;
  };
  status: StatusVinculoFornecedorVisual;
  produtoLoja?: ProdutoLojaParaVinculoFornecedor | null;
  podeVincular?: boolean;
  podeMarcarNovo?: boolean;
};

export type TabelaVinculosFornecedorProps = {
  tipoOrigem: "arquivo" | "api";
  titulo: string;
  subtitulo: string;
  labelProdutoRecebido: string;
  itens: ItemVinculoFornecedor[];
  produtosDaLoja: ProdutoLojaParaVinculoFornecedor[];
  textoAcaoPrincipal: string;
  hrefAcaoPrincipal?: string;
  acaoVincular?: (formData: FormData) => void | Promise<void>;
  nomeCampoItem?: string;
  nomeCampoProduto?: string;
};

type EstadoItemVinculoFornecedor = {
  status: StatusVinculoFornecedorVisual;
  produtoLoja: ProdutoLojaParaVinculoFornecedor | null;
};

type RascunhoProdutoFornecedorVisual = {
  produto: ProductFormData;
  codigoFornecedor: string | null;
  ean: string | null;
};

function normalizarEstadoInicial(
  item: ItemVinculoFornecedor,
): EstadoItemVinculoFornecedor {
  if (item.produtoLoja && item.status === "vinculado") {
    return {
      status: "vinculado",
      produtoLoja: item.produtoLoja,
    };
  }

  if (item.status === "erro" || item.status === "ignorado") {
    return {
      status: item.status,
      produtoLoja: null,
    };
  }

  return {
    status: "aguardando",
    produtoLoja: null,
  };
}

function formatarMoeda(valor?: string | null) {
  if (!valor) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
}

function montarResumoRecebido(item: ItemVinculoFornecedor) {
  const partes = [
    item.produtoRecebido.codigo
      ? `Código ${item.produtoRecebido.codigo}`
      : null,
    formatarMoeda(item.produtoRecebido.preco),
    typeof item.produtoRecebido.estoque === "number"
      ? `Estoque ${item.produtoRecebido.estoque}`
      : null,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" · ") : "Sem dados auxiliares";
}

function rotuloStatus(status: StatusVinculoFornecedorVisual) {
  const rotulos: Record<StatusVinculoFornecedorVisual, string> = {
    vinculado: "Vinculado",
    aguardando: "Aguardando vínculo",
    novo: "Novo produto",
    ignorado: "Ignorado",
    erro: "Com erro",
  };

  return rotulos[status];
}

function classeStatus(status: StatusVinculoFornecedorVisual) {
  const classes: Record<StatusVinculoFornecedorVisual, string> = {
    vinculado: "border-emerald-200 bg-emerald-50 text-emerald-700",
    aguardando: "border-amber-200 bg-amber-50 text-amber-700",
    novo: "border-blue-200 bg-blue-50 text-blue-700",
    ignorado: "border-slate-200 bg-slate-100 text-slate-600",
    erro: "border-red-200 bg-red-50 text-red-700",
  };

  return classes[status];
}

function montarDadosRascunho(
  item: ItemVinculoFornecedor,
): DadosFornecedorParaRascunhoProduto {
  return {
    id: item.id,
    nome: item.produtoRecebido.nome,
    codigo: item.produtoRecebido.codigo,
    ean: item.produtoRecebido.ean,
    ncm: item.produtoRecebido.ncm,
    preco: item.produtoRecebido.preco,
    estoque: item.produtoRecebido.estoque,
    imagens: item.produtoRecebido.imagens,
    pesoBruto: item.produtoRecebido.pesoBruto,
    alturaCaixa: item.produtoRecebido.alturaCaixa,
    larguraCaixa: item.produtoRecebido.larguraCaixa,
    comprimentoCaixa: item.produtoRecebido.comprimentoCaixa,
    complemento: item.produtoRecebido.complemento,
  };
}

function ProdutoLojaResumo({
  estado,
  rascunhoCriado,
}: {
  estado: EstadoItemVinculoFornecedor;
  rascunhoCriado?: boolean;
}) {
  if (estado.status === "novo") {
    return (
      <div className="px-1 py-1">
        <p className="text-sm font-medium text-slate-900">
          {rascunhoCriado ? "Rascunho criado" : "Será criado como novo"}
        </p>
        {rascunhoCriado ? (
          <p className="mt-0.5 text-xs text-slate-500">
            Produto oculto até a publicação.
          </p>
        ) : null}
      </div>
    );
  }

  if (estado.status === "ignorado") {
    return (
      <div className="px-1 py-1">
        <p className="text-sm font-medium text-slate-600">
          Linha será descartada
        </p>
      </div>
    );
  }

  if (estado.produtoLoja) {
    return (
      <div className="px-1 py-1">
        <p className="truncate text-sm font-medium text-slate-950">
          {estado.produtoLoja.nome}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          SKU {estado.produtoLoja.sku}
          {estado.produtoLoja.categoria
            ? ` · ${estado.produtoLoja.categoria}`
            : ""}
          {formatarMoeda(estado.produtoLoja.preco)
            ? ` · ${formatarMoeda(estado.produtoLoja.preco)}`
            : ""}
        </p>
        <p className="mt-1 text-xs text-emerald-700">Produto vinculado</p>
      </div>
    );
  }

  return (
    <div className="px-1 py-1">
      <p className="text-sm font-medium text-slate-600">Produto sem vínculo</p>
    </div>
  );
}

function ModalVincularProdutoFornecedor({
  aberto,
  aoAlterarAbertura,
  item,
  origem,
  produtosDaLoja,
  selecionadoId,
  aoSelecionarProduto,
  aoConfirmarVisual,
  acaoVincular,
  nomeCampoItem,
  nomeCampoProduto,
}: {
  aberto: boolean;
  aoAlterarAbertura: (aberto: boolean) => void;
  item: ItemVinculoFornecedor | null;
  origem: string;
  produtosDaLoja: ProdutoLojaParaVinculoFornecedor[];
  selecionadoId: string;
  aoSelecionarProduto: (produtoId: string) => void;
  aoConfirmarVisual: () => void;
  acaoVincular?: (formData: FormData) => void | Promise<void>;
  nomeCampoItem: string;
  nomeCampoProduto: string;
}) {
  const [busca, setBusca] = useState("");
  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return produtosDaLoja;

    return produtosDaLoja.filter((produto) =>
      [produto.nome, produto.sku, produto.categoria ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [busca, produtosDaLoja]);

  if (!item) return null;

  const conteudo = (
    <>
      <input type="hidden" name={nomeCampoItem} value={item.id} />
      <input type="hidden" name={nomeCampoProduto} value={selecionadoId} />
      <DialogHeader>
        <DialogTitle>Vincular produto da loja</DialogTitle>
        <DialogDescription>
          Escolha o produto da loja correspondente ao item recebido.
        </DialogDescription>
      </DialogHeader>

      <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {item.produtoRecebido.nome}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {montarResumoRecebido(item)}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {origem}
          </Badge>
        </div>
      </section>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Buscar por nome, SKU ou categoria"
          className="pl-9"
        />
      </div>

      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {produtosFiltrados.map((produto) => {
          const selecionado = produto.id === selecionadoId;

          return (
            <button
              key={produto.id}
              type="button"
              onClick={() => aoSelecionarProduto(produto.id)}
              className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                selecionado
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              } ${produto.jaVinculado ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-950">
                    {produto.nome}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    SKU {produto.sku}
                    {produto.categoria ? ` · ${produto.categoria}` : ""}
                    {formatarMoeda(produto.preco)
                      ? ` · ${formatarMoeda(produto.preco)}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {produto.jaVinculado ? (
                    <Badge variant="outline" className="bg-slate-50">
                      Já vinculado
                    </Badge>
                  ) : null}
                  {selecionado ? (
                    <CheckCircle2 className="h-4 w-4 text-slate-900" />
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => aoAlterarAbertura(false)}
        >
          Cancelar
        </Button>
        {acaoVincular ? (
          <Button type="submit" disabled={!selecionadoId}>
            Confirmar vínculo
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!selecionadoId}
            onClick={aoConfirmarVisual}
          >
            Confirmar vínculo
          </Button>
        )}
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={aberto} onOpenChange={aoAlterarAbertura}>
      <DialogContent className="max-w-2xl">
        {acaoVincular ? (
          <form action={acaoVincular} className="grid gap-4">
            {conteudo}
          </form>
        ) : (
          <div className="grid gap-4">{conteudo}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TabelaVinculosFornecedor({
  tipoOrigem,
  titulo,
  subtitulo,
  labelProdutoRecebido,
  itens,
  produtosDaLoja,
  textoAcaoPrincipal,
  hrefAcaoPrincipal,
  acaoVincular,
  nomeCampoItem = "stagingId",
  nomeCampoProduto = "produtoId",
}: TabelaVinculosFornecedorProps) {
  const estadosIniciais = useMemo(
    () =>
      Object.fromEntries(
        itens.map((item) => [item.id, normalizarEstadoInicial(item)]),
      ) as Record<string, EstadoItemVinculoFornecedor>,
    [itens],
  );
  const [estados, setEstados] =
    useState<Record<string, EstadoItemVinculoFornecedor>>(estadosIniciais);
  const [itemEmVinculo, setItemEmVinculo] =
    useState<ItemVinculoFornecedor | null>(null);
  const [itemEmRascunho, setItemEmRascunho] =
    useState<ItemVinculoFornecedor | null>(null);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [idsSelecionados, setIdsSelecionados] = useState<string[]>([]);
  const [rascunhos, setRascunhos] = useState<
    Record<string, RascunhoProdutoFornecedorVisual>
  >({});

  useEffect(() => {
    setEstados(estadosIniciais);
    setIdsSelecionados([]);
  }, [estadosIniciais]);

  function abrirModal(item: ItemVinculoFornecedor) {
    setItemEmVinculo(item);
    setProdutoSelecionadoId(estados[item.id]?.produtoLoja?.id ?? "");
  }

  function abrirModalRascunho(item: ItemVinculoFornecedor) {
    setItemEmRascunho(item);
  }

  function marcarComoNovo(item: ItemVinculoFornecedor) {
    setEstados((atuais) => ({
      ...atuais,
      [item.id]: { status: "novo", produtoLoja: null },
    }));
  }

  function salvarRascunhoVisual(
    item: ItemVinculoFornecedor,
    dados: ProductFormData,
  ) {
    setRascunhos((atuais) => ({
      ...atuais,
      [item.id]: {
        produto: { ...dados, isActive: false },
        codigoFornecedor: item.produtoRecebido.codigo ?? null,
        ean: item.produtoRecebido.ean ?? null,
      },
    }));
    marcarComoNovo(item);
  }

  function desfazer(item: ItemVinculoFornecedor) {
    setEstados((atuais) => ({
      ...atuais,
      [item.id]: { status: "aguardando", produtoLoja: null },
    }));
    setRascunhos((atuais) => {
      const proximo = { ...atuais };
      delete proximo[item.id];
      return proximo;
    });
  }

  function confirmarVinculoVisual() {
    if (!itemEmVinculo || !produtoSelecionadoId) return;

    const produto = produtosDaLoja.find(
      (item) => item.id === produtoSelecionadoId,
    );

    if (!produto) return;

    setEstados((atuais) => ({
      ...atuais,
      [itemEmVinculo.id]: { status: "vinculado", produtoLoja: produto },
    }));
    setItemEmVinculo(null);
  }

  function alternarSelecao(itemId: string, selecionado: boolean) {
    setIdsSelecionados((atuais) =>
      selecionado
        ? Array.from(new Set([...atuais, itemId]))
        : atuais.filter((id) => id !== itemId),
    );
  }

  function alternarTodos(selecionado: boolean) {
    setIdsSelecionados(selecionado ? itens.map((item) => item.id) : []);
  }

  function marcarSelecionadosComoNovos() {
    setEstados((atuais) => ({
      ...atuais,
      ...Object.fromEntries(
        idsSelecionados.map((id) => [
          id,
          { status: "novo", produtoLoja: null },
        ]),
      ),
    }));
  }

  function ignorarSelecionados() {
    setEstados((atuais) => ({
      ...atuais,
      ...Object.fromEntries(
        idsSelecionados.map((id) => [
          id,
          { status: "ignorado", produtoLoja: null },
        ]),
      ),
    }));
  }

  function restaurar(item: ItemVinculoFornecedor) {
    setEstados((atuais) => ({
      ...atuais,
      [item.id]: { status: "aguardando", produtoLoja: null },
    }));
  }

  const origem = tipoOrigem === "api" ? "API" : "Arquivo";
  const totalSelecionados = idsSelecionados.length;
  const todosSelecionados =
    itens.length > 0 &&
    itens.every((item) => idsSelecionados.includes(item.id));

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {totalSelecionados > 0 ? (
              <p className="text-base font-semibold text-slate-950">
                {totalSelecionados}{" "}
                {totalSelecionados === 1
                  ? "linha selecionada"
                  : "linhas selecionadas"}
              </p>
            ) : (
              <>
                <h2 className="text-base font-semibold text-slate-950">
                  {titulo}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  {subtitulo}
                </p>
              </>
            )}
          </div>
          {totalSelecionados > 0 ? (
            <div className="grid gap-2 sm:flex sm:items-center">
              <Button
                type="button"
                size="sm"
                onClick={marcarSelecionadosComoNovos}
              >
                Marcar como novo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={ignorarSelecionados}
              >
                Ignorar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIdsSelecionados([])}
              >
                Limpar seleção
              </Button>
            </div>
          ) : (
            <Badge variant="outline" className="w-fit">
              {origem}
            </Badge>
          )}
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs md:block">
        <div className="grid grid-cols-[44px_minmax(280px,1.35fr)_180px_minmax(280px,1.2fr)_190px] border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          <span>
            <Checkbox
              checked={todosSelecionados}
              onCheckedChange={(valor) => alternarTodos(Boolean(valor))}
              aria-label="Selecionar todos"
            />
          </span>
          <span>{labelProdutoRecebido}</span>
          <span>Status</span>
          <span>Produto da loja</span>
          <span className="text-right">Ações</span>
        </div>

        <div className="divide-y divide-slate-100">
          {itens.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Nenhum produto recebido para vincular.
            </div>
          ) : (
            itens.map((item) => {
              const estado = estados[item.id] ?? estadosIniciais[item.id];
              const rascunhoCriado = Boolean(rascunhos[item.id]);
              const podeVincular =
                item.podeVincular !== false && estado.status !== "erro";
              const podeNovo =
                item.podeMarcarNovo !== false && estado.status !== "erro";

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[44px_minmax(280px,1.35fr)_180px_minmax(280px,1.2fr)_190px] gap-4 px-4 py-3"
                >
                  <div className="pt-1">
                    <Checkbox
                      checked={idsSelecionados.includes(item.id)}
                      onCheckedChange={(valor) =>
                        alternarSelecao(item.id, Boolean(valor))
                      }
                      aria-label={`Selecionar ${item.produtoRecebido.nome}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-950">
                      {item.produtoRecebido.nome}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {montarResumoRecebido(item)}
                    </p>
                    {item.produtoRecebido.complemento ? (
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {item.produtoRecebido.complemento}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <Badge
                      variant="outline"
                      className={classeStatus(estado.status)}
                    >
                      {rotuloStatus(estado.status)}
                    </Badge>
                  </div>

                  <ProdutoLojaResumo
                    estado={estado}
                    rascunhoCriado={rascunhoCriado}
                  />

                  <div className="flex justify-end gap-2">
                    {estado.status === "ignorado" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => restaurar(item)}
                      >
                        Restaurar
                      </Button>
                    ) : estado.status === "vinculado" ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => abrirModal(item)}
                        >
                          Trocar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => desfazer(item)}
                        >
                          Desfazer
                        </Button>
                      </>
                    ) : estado.status === "novo" ? (
                      <>
                        {rascunhoCriado ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModalRascunho(item)}
                          >
                            Editar rascunho
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => desfazer(item)}
                        >
                          Desfazer
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!podeVincular}
                          onClick={() => abrirModal(item)}
                        >
                          Vincular
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!podeNovo}
                          onClick={() => abrirModalRascunho(item)}
                        >
                          Novo
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {itens.map((item) => {
          const estado = estados[item.id] ?? estadosIniciais[item.id];
          const rascunhoCriado = Boolean(rascunhos[item.id]);
          const podeVincular =
            item.podeVincular !== false && estado.status !== "erro";
          const podeNovo =
            item.podeMarcarNovo !== false && estado.status !== "erro";

          return (
            <article
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <Checkbox
                    checked={idsSelecionados.includes(item.id)}
                    onCheckedChange={(valor) =>
                      alternarSelecao(item.id, Boolean(valor))
                    }
                    aria-label={`Selecionar ${item.produtoRecebido.nome}`}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                      {labelProdutoRecebido}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                      {item.produtoRecebido.nome}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {montarResumoRecebido(item)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={classeStatus(estado.status)}
                >
                  {rotuloStatus(estado.status)}
                </Badge>
              </div>

              <div className="mt-3">
                <ProdutoLojaResumo
                  estado={estado}
                  rascunhoCriado={rascunhoCriado}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {estado.status === "ignorado" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="col-span-2"
                    onClick={() => restaurar(item)}
                  >
                    Restaurar
                  </Button>
                ) : estado.status === "vinculado" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => abrirModal(item)}
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      Trocar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => desfazer(item)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Desfazer
                    </Button>
                  </>
                ) : estado.status === "novo" ? (
                  <>
                    {rascunhoCriado ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => abrirModalRascunho(item)}
                      >
                        Editar rascunho
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className={rascunhoCriado ? "" : "col-span-2"}
                      onClick={() => desfazer(item)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Desfazer
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!podeVincular}
                      onClick={() => abrirModal(item)}
                    >
                      Vincular
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!podeNovo}
                      onClick={() => abrirModalRascunho(item)}
                    >
                      Novo
                    </Button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Revise os vínculos antes de avançar para conciliação.
        </p>
        {hrefAcaoPrincipal ? (
          <Button asChild>
            <a href={hrefAcaoPrincipal}>{textoAcaoPrincipal}</a>
          </Button>
        ) : (
          <Button type="button" disabled>
            {textoAcaoPrincipal}
          </Button>
        )}
      </div>

      <ModalVincularProdutoFornecedor
        aberto={Boolean(itemEmVinculo)}
        aoAlterarAbertura={(aberto) => {
          if (!aberto) setItemEmVinculo(null);
        }}
        item={itemEmVinculo}
        origem={origem}
        produtosDaLoja={produtosDaLoja}
        selecionadoId={produtoSelecionadoId}
        aoSelecionarProduto={setProdutoSelecionadoId}
        aoConfirmarVisual={confirmarVinculoVisual}
        acaoVincular={acaoVincular}
        nomeCampoItem={nomeCampoItem}
        nomeCampoProduto={nomeCampoProduto}
      />
      <ModalRascunhoProdutoFornecedor
        aberto={Boolean(itemEmRascunho)}
        item={itemEmRascunho ? montarDadosRascunho(itemEmRascunho) : null}
        dadosSalvos={
          itemEmRascunho
            ? (rascunhos[itemEmRascunho.id]?.produto ?? null)
            : null
        }
        aoAlterarAbertura={(aberto) => {
          if (!aberto) setItemEmRascunho(null);
        }}
        aoSalvarRascunho={(dados) => {
          if (itemEmRascunho) salvarRascunhoVisual(itemEmRascunho, dados);
        }}
      />
    </section>
  );
}
