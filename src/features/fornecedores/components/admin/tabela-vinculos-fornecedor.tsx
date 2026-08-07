"use client";

import {
  CheckCircle2,
  ClipboardCheck,
  Link2,
  Pencil,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { ProductFormData } from "@/app/admin/products/new/data/product-form-data";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { montarDadosIniciaisRascunhoProdutoFornecedor } from "@/features/fornecedores/lib/montar-dados-iniciais-rascunho-produto-fornecedor";
import type {
  DadosFornecedorParaRascunhoProduto,
  ValoresPadraoRascunhoProdutoFornecedor,
} from "@/features/fornecedores/types/mapeamento-fornecedor.types";
import { cn } from "@/lib/utils";

import { BotaoSubmitComEstado } from "./botao-submit-com-estado";
import { ModalRascunhoProdutoFornecedor } from "./modal-rascunho-produto-fornecedor";

export type StatusVinculoFornecedorVisual =
  | "vinculado"
  | "aguardando"
  | "novo"
  | "rascunho"
  | "ignorado"
  | "erro";

export type ProdutoLojaParaVinculoFornecedor = {
  id: string;
  vinculoId?: string;
  nome: string;
  sku: string;
  categoria?: string | null;
  preco?: string | null;
  jaVinculado?: boolean;
};

export type RascunhoSalvoVinculoFornecedor = {
  id: string;
  nome: string;
  categoriaNome?: string | null;
  marcaNome?: string | null;
  precoLoja?: string | null;
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
    camposOrigem?: Record<string, string | null | undefined>;
  };
  status: StatusVinculoFornecedorVisual;
  produtoLoja?: ProdutoLojaParaVinculoFornecedor | null;
  rascunhoSalvo?: RascunhoSalvoVinculoFornecedor | null;
  podeVincular?: boolean;
  podeMarcarNovo?: boolean;
};

export type TabelaVinculosFornecedorProps = {
  tipoOrigem: "arquivo" | "api" | "manual";
  titulo: string;
  subtitulo: string;
  labelProdutoRecebido: string;
  itens: ItemVinculoFornecedor[];
  produtosDaLoja: ProdutoLojaParaVinculoFornecedor[];
  textoAcaoPrincipal: string;
  hrefAcaoPrincipal?: string;
  totalRascunhosPersistidosInicial?: number;
  acaoVincular?: (formData: FormData) => void | Promise<void>;
  permitirVinculoVisual?: boolean;
  aoBuscarProdutosLoja?: (entrada: {
    busca: string;
    limite?: number;
  }) => Promise<{
    sucesso: boolean;
    erro?: string;
    produtos?: ProdutoLojaParaVinculoFornecedor[];
  }>;
  aoVincularProdutoPersistido?: (entrada: {
    item: ItemVinculoFornecedor;
    produto: ProdutoLojaParaVinculoFornecedor;
  }) => Promise<{
    sucesso: boolean;
    mensagem?: string;
    erro?: string;
    vinculoId?: string;
    produto?: ProdutoLojaParaVinculoFornecedor;
  }>;
  aoDesfazerVinculoPersistido?: (entrada: { vinculoId: string }) => Promise<{
    sucesso: boolean;
    mensagem?: string;
    erro?: string;
  }>;
  nomeCampoItem?: string;
  nomeCampoProduto?: string;
  valoresPadraoNovoProduto?: ValoresPadraoRascunhoProdutoFornecedor;
  obterValoresPadraoNovoProduto?: (
    item: ItemVinculoFornecedor,
  ) => ValoresPadraoRascunhoProdutoFornecedor;
  aoAlterarRascunhos?: (rascunhos: RascunhoVinculoFornecedor[]) => void;
  aoSalvarRascunhoPersistido?: (entrada: {
    item: DadosFornecedorParaRascunhoProduto;
    produto: ProductFormData;
  }) => Promise<{
    sucesso: boolean;
    mensagem?: string;
    erro?: string;
    rascunhoId?: string;
    rascunho?: RascunhoSalvoVinculoFornecedor & {
      categoriaId?: string | null;
      marcaId?: string | null;
    };
  }>;
  aoRemoverRascunhoPersistido?: (entrada: { rascunhoId: string }) => Promise<{
    sucesso: boolean;
    mensagem?: string;
    erro?: string;
  }>;
  aoAlterarTriagemPersistida?: (entrada: {
    itemIds: string[];
    acao: "ignorar" | "restaurar";
  }) => Promise<{
    sucesso: boolean;
    mensagem?: string;
    erro?: string;
  }>;
  /**
   * Confirma a seleção atual para avançar à Conciliação — só os itens
   * selecionados avançam; os demais continuam no staging. Quando presente,
   * substitui o link estático de "Continuar" por essa ação.
   */
  aoContinuarSelecionados?: (stagingIds: string[]) => Promise<{
    sucesso: boolean;
    mensagem?: string;
    erro?: string;
  }>;
};

type EstadoItemVinculoFornecedor = {
  status: StatusVinculoFornecedorVisual;
  produtoLoja: ProdutoLojaParaVinculoFornecedor | null;
  rascunhoSalvo?: RascunhoSalvoVinculoFornecedor | null;
};

type FiltroVinculoFornecedor =
  | "todos"
  | "vinculados"
  | "pendentes"
  | "novos"
  | "ignorados";

export type RascunhoProdutoFornecedorVisual = {
  produto: ProductFormData;
  codigoFornecedor: string | null;
  ean: string | null;
};

export type RascunhoVinculoFornecedor = RascunhoProdutoFornecedorVisual & {
  item: ItemVinculoFornecedor;
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

  if (item.rascunhoSalvo || item.status === "rascunho") {
    return {
      status: "rascunho",
      produtoLoja: null,
      rascunhoSalvo: item.rascunhoSalvo ?? null,
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

function ImagemProdutoRecebidoFornecedor({
  imagens,
  nome,
}: {
  imagens?: string[];
  nome: string;
}) {
  const imagem = imagens?.find((item) => item.trim().length > 0);

  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-100 bg-slate-50">
      {imagem ? (
        <img
          src={imagem}
          alt={nome}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-400">
          Sem foto
        </div>
      )}
    </div>
  );
}

function rotuloStatus(status: StatusVinculoFornecedorVisual) {
  const rotulos: Record<StatusVinculoFornecedorVisual, string> = {
    vinculado: "Vinculado",
    aguardando: "Pendente",
    novo: "Novo",
    rascunho: "Novo produto",
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
    rascunho: "border-blue-200 bg-blue-50 text-blue-700",
    ignorado: "border-slate-200 bg-slate-100 text-slate-600",
    erro: "border-red-200 bg-red-50 text-red-700",
  };

  return classes[status];
}

function obterFiltroStatus(status: StatusVinculoFornecedorVisual) {
  if (status === "vinculado") return "vinculados";
  if (status === "ignorado") return "ignorados";
  if (status === "novo" || status === "rascunho") return "novos";

  return "pendentes";
}

function combinaBuscaVinculo(
  item: ItemVinculoFornecedor,
  estado: EstadoItemVinculoFornecedor,
  termo: string,
) {
  if (!termo) return true;

  const texto = [
    item.produtoRecebido.nome,
    item.produtoRecebido.codigo,
    item.produtoRecebido.ean,
    item.produtoRecebido.ncm,
    item.produtoRecebido.complemento,
    estado.produtoLoja?.nome,
    estado.produtoLoja?.sku,
    estado.rascunhoSalvo?.nome,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return texto.includes(termo);
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
  rascunho,
}: {
  estado: EstadoItemVinculoFornecedor;
  rascunhoCriado?: boolean;
  rascunho?: RascunhoSalvoVinculoFornecedor | null;
}) {
  const rascunhoAtual = rascunho ?? estado.rascunhoSalvo;

  if (estado.status === "rascunho" || rascunhoAtual) {
    return (
      <div className="px-1 py-1">
        <p className="text-sm font-medium text-slate-900">
          Será criado como produto novo
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {rascunhoAtual?.nome ?? "Produto salvo para conciliação"}
        </p>
        {rascunhoAtual?.categoriaNome || rascunhoAtual?.marcaNome ? (
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {[rascunhoAtual.categoriaNome, rascunhoAtual.marcaNome]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-blue-700">Revise na Conciliação</p>
      </div>
    );
  }

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
      <p className="text-sm font-medium text-slate-600">
        Nenhum produto vinculado
      </p>
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
  confirmandoVinculo,
  acaoVincular,
  permitirVinculoVisual,
  aoBuscarProdutosLoja,
  nomeCampoItem,
  nomeCampoProduto,
}: {
  aberto: boolean;
  aoAlterarAbertura: (aberto: boolean) => void;
  item: ItemVinculoFornecedor | null;
  origem: string;
  produtosDaLoja: ProdutoLojaParaVinculoFornecedor[];
  selecionadoId: string;
  aoSelecionarProduto: (produto: ProdutoLojaParaVinculoFornecedor) => void;
  aoConfirmarVisual: () => void;
  confirmandoVinculo: boolean;
  acaoVincular?: (formData: FormData) => void | Promise<void>;
  permitirVinculoVisual: boolean;
  aoBuscarProdutosLoja?: (entrada: {
    busca: string;
    limite?: number;
  }) => Promise<{
    sucesso: boolean;
    erro?: string;
    produtos?: ProdutoLojaParaVinculoFornecedor[];
  }>;
  nomeCampoItem: string;
  nomeCampoProduto: string;
}) {
  const [busca, setBusca] = useState("");
  const [produtosEncontrados, setProdutosEncontrados] = useState<
    ProdutoLojaParaVinculoFornecedor[]
  >([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const fonteProdutos = aoBuscarProdutosLoja
    ? produtosEncontrados
    : produtosDaLoja;
  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (aoBuscarProdutosLoja) return fonteProdutos;
    if (!termo) return fonteProdutos;

    return fonteProdutos.filter((produto) =>
      [produto.nome, produto.sku, produto.categoria ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [aoBuscarProdutosLoja, busca, fonteProdutos]);

  useEffect(() => {
    if (!aberto || !aoBuscarProdutosLoja) return;

    const termo = busca.trim();

    if (termo.length < 2) {
      setProdutosEncontrados([]);
      setErroBusca(null);
      return;
    }

    let cancelado = false;
    setBuscando(true);
    setErroBusca(null);

    const timeout = window.setTimeout(() => {
      aoBuscarProdutosLoja({ busca: termo, limite: 20 })
        .then((resultado) => {
          if (cancelado) return;

          if (!resultado.sucesso) {
            setProdutosEncontrados([]);
            setErroBusca(
              resultado.erro ?? "Não foi possível buscar produtos reais.",
            );
            return;
          }

          setProdutosEncontrados(resultado.produtos ?? []);
        })
        .finally(() => {
          if (!cancelado) setBuscando(false);
        });
    }, 350);

    return () => {
      cancelado = true;
      window.clearTimeout(timeout);
    };
  }, [aberto, aoBuscarProdutosLoja, busca]);

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
          placeholder="Buscar por nome, SKU ou código"
          className="pl-9"
        />
      </div>

      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {aoBuscarProdutosLoja && busca.trim().length < 2 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Digite pelo menos 2 caracteres para buscar produtos reais da loja.
          </div>
        ) : null}
        {!aoBuscarProdutosLoja && produtosDaLoja.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Busca de produtos reais ainda não implementada para este fluxo.
          </div>
        ) : null}
        {buscando ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Buscando produtos reais...
          </div>
        ) : null}
        {erroBusca ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erroBusca}
          </div>
        ) : null}
        {!buscando &&
        !erroBusca &&
        busca.trim().length >= 2 &&
        produtosFiltrados.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Nenhum produto real encontrado para a busca.
          </div>
        ) : null}
        {produtosFiltrados.map((produto) => {
          const selecionado = produto.id === selecionadoId;

          return (
            <button
              key={produto.id}
              type="button"
              onClick={() => aoSelecionarProduto(produto)}
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
          <BotaoSubmitComEstado
            disabled={!selecionadoId}
            textoProcessando="Vinculando produto…"
          >
            Confirmar vínculo
          </BotaoSubmitComEstado>
        ) : permitirVinculoVisual ? (
          <Button
            type="button"
            disabled={!selecionadoId || confirmandoVinculo}
            onClick={aoConfirmarVisual}
          >
            {confirmandoVinculo ? "Salvando vínculo..." : "Confirmar vínculo"}
          </Button>
        ) : (
          <Button type="button" disabled>
            Vínculo real pendente
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
  totalRascunhosPersistidosInicial,
  acaoVincular,
  permitirVinculoVisual = true,
  aoBuscarProdutosLoja,
  aoVincularProdutoPersistido,
  aoDesfazerVinculoPersistido,
  nomeCampoItem = "stagingId",
  nomeCampoProduto = "produtoId",
  valoresPadraoNovoProduto,
  obterValoresPadraoNovoProduto,
  aoAlterarRascunhos,
  aoSalvarRascunhoPersistido,
  aoRemoverRascunhoPersistido,
  aoAlterarTriagemPersistida,
  aoContinuarSelecionados,
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
  const [produtoSelecionadoVinculo, setProdutoSelecionadoVinculo] =
    useState<ProdutoLojaParaVinculoFornecedor | null>(null);
  const [idsSelecionados, setIdsSelecionados] = useState<string[]>([]);
  const [filtro, setFiltro] = useState<FiltroVinculoFornecedor>("todos");
  const [buscaTabela, setBuscaTabela] = useState("");
  const [rascunhos, setRascunhos] = useState<
    Record<string, RascunhoProdutoFornecedorVisual>
  >({});
  const [rascunhosSalvos, setRascunhosSalvos] = useState<
    Record<string, RascunhoSalvoVinculoFornecedor>
  >({});
  const [mensagemRascunho, setMensagemRascunho] = useState<string | null>(null);
  const [confirmandoVinculo, setConfirmandoVinculo] = useState(false);
  const [criandoRascunhosEmMassa, setCriandoRascunhosEmMassa] = useState(false);
  const [confirmandoSelecao, setConfirmandoSelecao] = useState(false);
  const [totalRascunhosPersistidos, setTotalRascunhosPersistidos] = useState(
    totalRascunhosPersistidosInicial,
  );

  useEffect(() => {
    if (!aoAlterarRascunhos) return;

    aoAlterarRascunhos(
      Object.entries(rascunhos)
        .map(([itemId, rascunho]) => {
          const item = itens.find((itemAtual) => itemAtual.id === itemId);
          if (!item) return null;

          return {
            ...rascunho,
            item,
          };
        })
        .filter(
          (rascunho): rascunho is RascunhoVinculoFornecedor =>
            rascunho !== null,
        ),
    );
  }, [aoAlterarRascunhos, itens, rascunhos]);

  useEffect(() => {
    setEstados(estadosIniciais);
    setIdsSelecionados([]);
    setRascunhosSalvos(
      Object.fromEntries(
        itens.flatMap((item) =>
          item.rascunhoSalvo ? [[item.id, item.rascunhoSalvo]] : [],
        ),
      ),
    );
  }, [estadosIniciais]);

  function abrirModal(item: ItemVinculoFornecedor) {
    setItemEmVinculo(item);
    const produtoAtual = estados[item.id]?.produtoLoja ?? null;
    setProdutoSelecionadoId(produtoAtual?.id ?? "");
    setProdutoSelecionadoVinculo(produtoAtual);
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

  async function salvarRascunhoVisual(
    item: ItemVinculoFornecedor,
    dados: ProductFormData,
    opcoes?: { silencioso?: boolean },
  ): Promise<boolean> {
    const itemRascunho = montarDadosRascunho(item);
    let rascunhoSalvoResultado: RascunhoSalvoVinculoFornecedor | null = null;

    if (aoSalvarRascunhoPersistido) {
      if (!opcoes?.silencioso) setMensagemRascunho("Salvando rascunho...");
      const toastId = opcoes?.silencioso
        ? undefined
        : toast.loading("Salvando rascunho...");

      const resultado = await aoSalvarRascunhoPersistido({
        item: itemRascunho,
        produto: { ...dados, isActive: false },
      }).catch((erro) => {
        console.error("[TabelaVinculosFornecedor:salvarRascunho]", {
          mensagem: erro instanceof Error ? erro.message : "Erro desconhecido",
        });

        return {
          sucesso: false,
          erro: "Não foi possível salvar o rascunho.",
          rascunhoId: undefined,
          rascunho: undefined,
        };
      });

      if (!resultado.sucesso) {
        if (!opcoes?.silencioso) {
          setMensagemRascunho(
            resultado.erro ?? "Não foi possível salvar o rascunho.",
          );
          toast.error(resultado.erro ?? "Não foi possível salvar o rascunho.", {
            id: toastId,
          });
        }
        return false;
      }

      if (!opcoes?.silencioso) {
        setMensagemRascunho(
          "Rascunho salvo com sucesso. Revise este produto na Conciliação.",
        );
        toast.success(
          "Rascunho salvo com sucesso. Revise este produto na Conciliação.",
          { id: toastId },
        );
      }

      if (resultado.rascunho) {
        const jaEstavaPersistido = Boolean(
          rascunhosSalvos[item.id] ?? item.rascunhoSalvo,
        );
        const rascunhoSalvo: RascunhoSalvoVinculoFornecedor = {
          id: resultado.rascunho.id,
          nome: resultado.rascunho.nome,
          categoriaNome:
            resultado.rascunho.categoriaNome ?? resultado.rascunho.categoriaId,
          marcaNome: resultado.rascunho.marcaNome ?? resultado.rascunho.marcaId,
          precoLoja: resultado.rascunho.precoLoja,
        };
        rascunhoSalvoResultado = rascunhoSalvo;
        setRascunhosSalvos((atuais) => ({
          ...atuais,
          [item.id]: rascunhoSalvo,
        }));
        if (!jaEstavaPersistido) {
          setTotalRascunhosPersistidos((total) =>
            typeof total === "number" ? total + 1 : total,
          );
        }
      }
    }

    setRascunhos((atuais) => ({
      ...atuais,
      [item.id]: {
        produto: { ...dados, isActive: false },
        codigoFornecedor: item.produtoRecebido.codigo ?? null,
        ean: item.produtoRecebido.ean ?? null,
      },
    }));
    setEstados((atuais) => ({
      ...atuais,
      [item.id]: {
        status: "rascunho",
        produtoLoja: null,
        rascunhoSalvo:
          rascunhoSalvoResultado ??
          rascunhosSalvos[item.id] ??
          (aoSalvarRascunhoPersistido
            ? null
            : {
                id: item.id,
                nome: dados.name,
                categoriaNome: dados.categoryId,
                marcaNome: dados.brand || dados.brandId,
              }),
      },
    }));
    return true;
  }

  async function desfazer(item: ItemVinculoFornecedor) {
    const estadoAtual = estados[item.id] ?? estadosIniciais[item.id];
    const vinculoId = estadoAtual.produtoLoja?.vinculoId;

    if (vinculoId && aoDesfazerVinculoPersistido) {
      const toastId = toast.loading("Desfazendo vínculo...");
      const resultado = await aoDesfazerVinculoPersistido({ vinculoId }).catch(
        () => ({
          sucesso: false,
          erro: "Não foi possível desfazer o vínculo.",
          mensagem: undefined,
        }),
      );

      if (!resultado.sucesso) {
        toast.error(resultado.erro ?? "Não foi possível desfazer o vínculo.", {
          id: toastId,
        });
        return;
      }

      toast.success(resultado.mensagem ?? "Vínculo desfeito.", { id: toastId });
    }

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

  async function confirmarVinculoVisual() {
    if (!itemEmVinculo || !produtoSelecionadoId) return;

    const produto =
      produtoSelecionadoVinculo ??
      produtosDaLoja.find((item) => item.id === produtoSelecionadoId);

    if (!produto) return;

    let produtoVinculado = produto;

    if (aoVincularProdutoPersistido) {
      setConfirmandoVinculo(true);
      const toastId = toast.loading("Salvando vínculo...");
      const resultado = await aoVincularProdutoPersistido({
        item: itemEmVinculo,
        produto,
      })
        .catch(() => ({
          sucesso: false,
          erro: "Não foi possível salvar o vínculo.",
          mensagem: undefined,
          vinculoId: undefined,
          produto: undefined,
        }))
        .finally(() => setConfirmandoVinculo(false));

      if (!resultado.sucesso) {
        toast.error(resultado.erro ?? "Não foi possível salvar o vínculo.", {
          id: toastId,
        });
        return;
      }

      produtoVinculado = {
        ...(resultado.produto ?? produto),
        vinculoId: resultado.vinculoId,
      };
      toast.success(resultado.mensagem ?? "Produto vinculado com sucesso.", {
        id: toastId,
      });
    }

    setEstados((atuais) => ({
      ...atuais,
      [itemEmVinculo.id]: {
        status: "vinculado",
        produtoLoja: produtoVinculado,
      },
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
    setIdsSelecionados(
      selecionado ? itensFiltrados.map((item) => item.id) : [],
    );
  }

  async function marcarSelecionadosComoNovos() {
    if (criandoRascunhosEmMassa || idsSelecionados.length === 0) return;

    if (!aoSalvarRascunhoPersistido) {
      toast.error("A persistência de rascunhos não está disponível.");
      return;
    }

    const itensSelecionados = idsSelecionados
      .map((id) => itens.find((item) => item.id === id))
      .filter((item): item is ItemVinculoFornecedor => Boolean(item));
    const itensComRascunho = itensSelecionados.filter((item) =>
      Boolean(rascunhosSalvos[item.id] ?? item.rascunhoSalvo),
    );
    const itensParaCriar = itensSelecionados.filter(
      (item) => !Boolean(rascunhosSalvos[item.id] ?? item.rascunhoSalvo),
    );

    if (itensParaCriar.length === 0) {
      toast.info("Os itens selecionados já possuem rascunho.");
      setIdsSelecionados([]);
      return;
    }

    setCriandoRascunhosEmMassa(true);
    const toastId = toast.loading(
      `Criando ${itensParaCriar.length} rascunho${itensParaCriar.length === 1 ? "" : "s"}...`,
    );
    let totalCriado = 0;
    const itensComFalha: string[] = [];

    try {
      for (const item of itensParaCriar) {
        const valoresPadrao =
          obterValoresPadraoNovoProduto?.(item) ?? valoresPadraoNovoProduto;
        const dados = montarDadosIniciaisRascunhoProdutoFornecedor(
          montarDadosRascunho(item),
          null,
          valoresPadrao,
        );
        const sucesso = await salvarRascunhoVisual(item, dados, {
          silencioso: true,
        });

        if (sucesso) totalCriado += 1;
        else itensComFalha.push(item.produtoRecebido.nome);
      }

      setIdsSelecionados([]);
      if (itensComFalha.length > 0) {
        toast.error(
          `${totalCriado} rascunho${totalCriado === 1 ? " criado" : "s criados"}, ${itensComFalha.length} falharam.`,
          { id: toastId },
        );
      } else {
        const complemento =
          itensComRascunho.length > 0
            ? ` ${itensComRascunho.length} já possuía${itensComRascunho.length === 1 ? "" : "m"} rascunho.`
            : "";
        toast.success(
          `${totalCriado} rascunho${totalCriado === 1 ? " criado como novo produto" : "s criados como novos produtos"}.${complemento}`,
          { id: toastId },
        );
      }
    } finally {
      setCriandoRascunhosEmMassa(false);
    }
  }

  async function persistirTriagem(
    itemIds: string[],
    acao: "ignorar" | "restaurar",
  ) {
    if (!aoAlterarTriagemPersistida) return true;

    const resultado = await aoAlterarTriagemPersistida({ itemIds, acao });

    if (!resultado.sucesso) {
      toast.error(resultado.erro ?? "Não foi possível atualizar a triagem.");
      return false;
    }

    toast.success(
      resultado.mensagem ??
        (acao === "ignorar" ? "Itens ignorados." : "Itens restaurados."),
    );
    return true;
  }

  async function ignorarItens(itemIds: string[]) {
    if (!(await persistirTriagem(itemIds, "ignorar"))) return false;

    setEstados((atuais) => ({
      ...atuais,
      ...Object.fromEntries(
        itemIds.map((id) => [id, { status: "ignorado", produtoLoja: null }]),
      ),
    }));
    return true;
  }

  async function ignorarSelecionados() {
    if (await ignorarItens(idsSelecionados)) setIdsSelecionados([]);
  }

  async function continuarSelecionados() {
    if (confirmandoSelecao || idsSelecionados.length === 0) return;
    if (!aoContinuarSelecionados) return;

    // Barreira de item pendente: só "vinculado" (produto real encontrado) e
    // "rascunho" (marcado como novo) podem avançar. Quem ainda não recebeu
    // decisão fica retido aqui, com a instrução do que fazer.
    const itensNaoElegiveis = idsSelecionados.filter((id) => {
      const estado = estados[id] ?? estadosIniciais[id];
      return estado.status !== "vinculado" && estado.status !== "rascunho";
    });

    if (itensNaoElegiveis.length > 0) {
      toast.error(
        "Alguns itens selecionados ainda não têm decisão. Vincule, marque como novo ou ignore antes de continuar.",
      );
      return;
    }

    setConfirmandoSelecao(true);
    try {
      const resultado = await aoContinuarSelecionados(idsSelecionados);

      if (!resultado.sucesso) {
        toast.error(
          resultado.erro ?? "Não foi possível continuar para a Conciliação.",
        );
        return;
      }

      toast.success(resultado.mensagem ?? "Itens enviados para a Conciliação.");
      setIdsSelecionados([]);
    } finally {
      setConfirmandoSelecao(false);
    }
  }

  async function restaurar(item: ItemVinculoFornecedor) {
    if (!(await persistirTriagem([item.id], "restaurar"))) return;

    setEstados((atuais) => ({
      ...atuais,
      [item.id]: { status: "aguardando", produtoLoja: null },
    }));
  }

  async function removerRascunho(item: ItemVinculoFornecedor) {
    const rascunho = rascunhosSalvos[item.id] ?? item.rascunhoSalvo;

    if (rascunho?.id && aoRemoverRascunhoPersistido) {
      const resultado = await aoRemoverRascunhoPersistido({
        rascunhoId: rascunho.id,
      });

      if (!resultado.sucesso) {
        toast.error(resultado.erro ?? "Não foi possível remover o rascunho.");
        return;
      }

      toast.success(resultado.mensagem ?? "Rascunho removido.");
    }

    setRascunhos((atuais) => {
      const proximo = { ...atuais };
      delete proximo[item.id];
      return proximo;
    });
    setRascunhosSalvos((atuais) => {
      const proximo = { ...atuais };
      delete proximo[item.id];
      return proximo;
    });
    if (rascunho?.id) {
      setTotalRascunhosPersistidos((total) =>
        typeof total === "number" ? Math.max(0, total - 1) : total,
      );
    }
    setEstados((atuais) => ({
      ...atuais,
      [item.id]: { status: "aguardando", produtoLoja: null },
    }));
  }

  const origem =
    tipoOrigem === "api"
      ? "API"
      : tipoOrigem === "manual"
        ? "Manual"
        : "Arquivo";
  const totalSelecionados = idsSelecionados.length;
  const termoBusca = buscaTabela.trim().toLowerCase();
  const itensFiltrados = itens.filter((item) => {
    const estado = estados[item.id] ?? estadosIniciais[item.id];
    const filtroStatus = obterFiltroStatus(estado.status);
    const passaFiltro = filtro === "todos" || filtro === filtroStatus;

    return passaFiltro && combinaBuscaVinculo(item, estado, termoBusca);
  });
  const contadores = itens.reduce(
    (totais, item) => {
      const estado = estados[item.id] ?? estadosIniciais[item.id];
      const filtroStatus = obterFiltroStatus(estado.status);

      return {
        ...totais,
        todos: totais.todos + 1,
        [filtroStatus]: totais[filtroStatus] + 1,
      };
    },
    {
      todos: 0,
      vinculados: 0,
      pendentes: 0,
      novos: 0,
      ignorados: 0,
    } satisfies Record<FiltroVinculoFornecedor, number>,
  );
  const totalRascunhosSalvos =
    totalRascunhosPersistidos ??
    itens.filter((item) => {
      const estado = estados[item.id] ?? estadosIniciais[item.id];
      return (
        estado.status === "rascunho" ||
        Boolean(rascunhosSalvos[item.id]) ||
        Boolean(item.rascunhoSalvo)
      );
    }).length;
  const textoAcaoPrincipalFinal =
    totalRascunhosSalvos > 0 && hrefAcaoPrincipal?.includes("conciliacao")
      ? `Continuar para Conciliação (${totalRascunhosSalvos} rascunho${totalRascunhosSalvos === 1 ? "" : "s"})`
      : textoAcaoPrincipal;
  const todosSelecionados =
    itensFiltrados.length > 0 &&
    itensFiltrados.every((item) => idsSelecionados.includes(item.id));
  const filtrosVinculo: Array<{
    chave: FiltroVinculoFornecedor;
    label: string;
  }> = [
    { chave: "todos", label: "Todos" },
    { chave: "vinculados", label: "Vinculados" },
    { chave: "pendentes", label: "Pendentes" },
    { chave: "novos", label: "Novos" },
    { chave: "ignorados", label: "Ignorados" },
  ];

  return (
    <section className="space-y-4">
      {totalRascunhosSalvos > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-blue-950 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Rascunhos salvos</p>
            <p className="mt-1 text-sm text-blue-800">
              Você tem {totalRascunhosSalvos} produto
              {totalRascunhosSalvos === 1 ? "" : "s"} salvo
              {totalRascunhosSalvos === 1 ? "" : "s"} como rascunho para revisar
              na Conciliação.
            </p>
          </div>
          <Button asChild size="sm" className="bg-blue-900 hover:bg-blue-800">
            <a href={hrefAcaoPrincipal ?? "#"}>Ir para Conciliação</a>
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1 lg:w-auto">
          {filtrosVinculo.map((itemFiltro) => (
            <button
              key={itemFiltro.chave}
              type="button"
              onClick={() => setFiltro(itemFiltro.chave)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition",
                filtro === itemFiltro.chave
                  ? "bg-white text-slate-950 shadow-xs"
                  : "hover:bg-white/70 hover:text-slate-900",
              )}
            >
              {itemFiltro.label}
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                {contadores[itemFiltro.chave]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={buscaTabela}
            onChange={(evento) => setBuscaTabela(evento.target.value)}
            placeholder="Buscar por SKU ou nome..."
            className="h-9 bg-white pl-9"
          />
        </div>
      </div>

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
                disabled={criandoRascunhosEmMassa}
                onClick={marcarSelecionadosComoNovos}
              >
                {criandoRascunhosEmMassa
                  ? "Criando rascunhos..."
                  : "Marcar como novo"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={criandoRascunhosEmMassa}
                onClick={ignorarSelecionados}
              >
                Ignorar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={criandoRascunhosEmMassa}
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
        <div className="grid grid-cols-[44px_minmax(260px,1.35fr)_150px_minmax(320px,1.45fr)_132px] border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
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
          {itensFiltrados.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Nenhum produto encontrado para os filtros atuais.
            </div>
          ) : (
            itensFiltrados.map((item) => {
              const estado = estados[item.id] ?? estadosIniciais[item.id];
              const rascunhoCriado =
                Boolean(rascunhos[item.id]) ||
                Boolean(rascunhosSalvos[item.id]) ||
                Boolean(item.rascunhoSalvo);
              const rascunhoAtual =
                rascunhosSalvos[item.id] ??
                estado.rascunhoSalvo ??
                item.rascunhoSalvo;
              const podeVincular =
                item.podeVincular !== false && estado.status !== "erro";
              const podeNovo =
                item.podeMarcarNovo !== false && estado.status !== "erro";

              return (
                <div
                  key={item.id}
                  className={cn(
                    "grid grid-cols-[44px_minmax(260px,1.35fr)_150px_minmax(320px,1.45fr)_132px] gap-4 px-4 py-3",
                    estado.status === "ignorado" && "bg-slate-50/70 opacity-75",
                  )}
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
                  <div className="flex min-w-0 gap-3">
                    <ImagemProdutoRecebidoFornecedor
                      imagens={item.produtoRecebido.imagens}
                      nome={item.produtoRecebido.nome}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-950">
                        {item.produtoRecebido.nome}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {montarResumoRecebido(item)}
                      </p>
                      {item.produtoRecebido.ncm ? (
                        <p className="mt-1 text-xs text-slate-500">
                          NCM {item.produtoRecebido.ncm}
                        </p>
                      ) : null}
                      {item.produtoRecebido.complemento ? (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                          {item.produtoRecebido.complemento}
                        </p>
                      ) : null}
                    </div>
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
                    rascunho={rascunhoAtual}
                  />

                  <div className="flex justify-end gap-2">
                    {estado.status === "ignorado" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void restaurar(item)}
                      >
                        Restaurar
                      </Button>
                    ) : estado.status === "vinculado" ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
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
                    ) : estado.status === "rascunho" ? (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => abrirModalRascunho(item)}
                              aria-label="Editar rascunho"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar rascunho</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              asChild
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              <a
                                href={hrefAcaoPrincipal ?? "#"}
                                aria-label="Ver na conciliação"
                              >
                                <ClipboardCheck className="h-4 w-4" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver na conciliação</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => removerRascunho(item)}
                              aria-label="Desfazer decisão"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Desfazer decisão</TooltipContent>
                        </Tooltip>
                      </>
                    ) : estado.status === "novo" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => desfazer(item)}
                      >
                        Desfazer
                      </Button>
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
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => void ignorarItens([item.id])}
                        >
                          Ignorar
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
        {itensFiltrados.map((item) => {
          const estado = estados[item.id] ?? estadosIniciais[item.id];
          const rascunhoCriado =
            Boolean(rascunhos[item.id]) ||
            Boolean(rascunhosSalvos[item.id]) ||
            Boolean(item.rascunhoSalvo);
          const rascunhoAtual =
            rascunhosSalvos[item.id] ??
            estado.rascunhoSalvo ??
            item.rascunhoSalvo;
          const podeVincular =
            item.podeVincular !== false && estado.status !== "erro";
          const podeNovo =
            item.podeMarcarNovo !== false && estado.status !== "erro";

          return (
            <article
              key={item.id}
              className={cn(
                "rounded-lg border border-slate-200 bg-white p-3 shadow-xs",
                estado.status === "ignorado" && "bg-slate-50/70 opacity-75",
              )}
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
                  <ImagemProdutoRecebidoFornecedor
                    imagens={item.produtoRecebido.imagens}
                    nome={item.produtoRecebido.nome}
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
                    {item.produtoRecebido.ncm ? (
                      <p className="mt-1 text-xs text-slate-500">
                        NCM {item.produtoRecebido.ncm}
                      </p>
                    ) : null}
                    {item.produtoRecebido.complemento ? (
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {item.produtoRecebido.complemento}
                      </p>
                    ) : null}
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
                  rascunho={rascunhoAtual}
                />
              </div>

              <div
                className={cn(
                  "mt-3 grid gap-2",
                  estado.status === "rascunho" ? "grid-cols-3" : "grid-cols-2",
                )}
              >
                {estado.status === "ignorado" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="col-span-2"
                    onClick={() => void restaurar(item)}
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
                ) : estado.status === "rascunho" ? (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => abrirModalRascunho(item)}
                      aria-label="Editar rascunho"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button asChild size="icon" variant="outline">
                      <a
                        href={hrefAcaoPrincipal ?? "#"}
                        aria-label="Ver na conciliação"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removerRascunho(item)}
                      aria-label="Desfazer decisão"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </>
                ) : estado.status === "novo" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="col-span-2"
                    onClick={() => desfazer(item)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Desfazer
                  </Button>
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
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="col-span-2"
                      onClick={() => void ignorarItens([item.id])}
                    >
                      Ignorar
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
          {mensagemRascunho ??
            "Revise os vínculos antes de avançar para conciliação."}
        </p>
        {aoContinuarSelecionados ? (
          // Deixou de ser um link estático: agora persiste a seleção antes de
          // avançar. Sem isso, os itens vinculados chegavam à Conciliação sem
          // nenhum registro e a tela aparecia vazia.
          <Button
            type="button"
            disabled={confirmandoSelecao || idsSelecionados.length === 0}
            aria-busy={confirmandoSelecao}
            onClick={continuarSelecionados}
          >
            {confirmandoSelecao
              ? "Enviando para conciliação…"
              : idsSelecionados.length > 0
                ? `Continuar para conciliação (${idsSelecionados.length})`
                : textoAcaoPrincipalFinal}
          </Button>
        ) : hrefAcaoPrincipal ? (
          <Button asChild>
            <a href={hrefAcaoPrincipal}>{textoAcaoPrincipalFinal}</a>
          </Button>
        ) : (
          <Button type="button" disabled>
            {textoAcaoPrincipalFinal}
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
        aoSelecionarProduto={(produto) => {
          setProdutoSelecionadoId(produto.id);
          setProdutoSelecionadoVinculo(produto);
        }}
        aoConfirmarVisual={confirmarVinculoVisual}
        confirmandoVinculo={confirmandoVinculo}
        acaoVincular={acaoVincular}
        permitirVinculoVisual={permitirVinculoVisual}
        aoBuscarProdutosLoja={aoBuscarProdutosLoja}
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
        valoresPadrao={
          itemEmRascunho
            ? (obterValoresPadraoNovoProduto?.(itemEmRascunho) ??
              valoresPadraoNovoProduto)
            : valoresPadraoNovoProduto
        }
        aoAlterarAbertura={(aberto) => {
          if (!aberto) setItemEmRascunho(null);
        }}
        aoSalvarRascunho={(dados) => {
          if (itemEmRascunho) {
            return salvarRascunhoVisual(itemEmRascunho, dados);
          }

          return false;
        }}
      />
    </section>
  );
}
