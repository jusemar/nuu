"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { PaginacaoAdmin } from "@/components/shared/paginacao-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dividirLotesPublicacaoFornecedor } from "@/features/fornecedores/lib/conciliacao/lotes-publicacao-fornecedor";
import {
  OPCOES_LIMITE_FORNECEDORES,
  type PaginacaoFornecedores,
} from "@/features/fornecedores/lib/paginacao-fornecedores";

import { CheckboxFornecedor } from "./compartilhados/checkbox-fornecedor";

export type RascunhoPublicacaoFornecedor = {
  id: string;
  codigoFornecedor: string | null;
  nome: string;
  categoriaNome: string | null;
  marcaNome: string | null;
  precoLoja: string | null;
  estoqueFornecedor: number | null;
  imagemUrl: string | null;
  pronto: boolean;
  pendencias: string[];
  /** Presente só quando este item vai atualizar um produto já existente. */
  produtoAtualizadoId?: string | null;
  produtoAtualizadoNome?: string | null;
};

type ItemPublicadoFornecedor = {
  rascunhoId: string;
  produtoId: string;
  varianteTecnicaId: string | null;
  slug: string;
  sku: string;
};

type ResultadoPublicacaoFornecedor = {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  publicados: ItemPublicadoFornecedor[];
};

/** Progresso real da publicação, item a item. */
type ProgressoPublicacaoFornecedor = {
  total: number;
  concluidos: number;
  /** Nome do item que está sendo publicado agora. */
  atual: string | null;
  falhas: Array<{ nome: string; erro: string }>;
};

type PaginaPublicacaoFornecedorAdminProps = {
  titulo: string;
  subtitulo: string;
  hrefVoltar: string;
  hrefBasePaginacao: string;
  rascunhosIniciais: RascunhoPublicacaoFornecedor[];
  paginacao: PaginacaoFornecedores;
  sessaoAtiva: boolean;
  acaoPublicar: (entrada: {
    rascunhoIds: string[];
  }) => Promise<ResultadoPublicacaoFornecedor>;
};

function formatarPreco(valor: string | null) {
  if (!valor) return "Pendente";
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function PaginaPublicacaoFornecedorAdmin({
  titulo,
  subtitulo,
  hrefVoltar,
  hrefBasePaginacao,
  rascunhosIniciais,
  paginacao,
  sessaoAtiva,
  acaoPublicar,
}: PaginaPublicacaoFornecedorAdminProps) {
  const router = useRouter();
  const [rascunhos, setRascunhos] = useState(rascunhosIniciais);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [confirmacao, setConfirmacao] = useState<string[]>([]);
  const [processando, iniciarTransicao] = useTransition();
  const [progresso, setProgresso] =
    useState<ProgressoPublicacaoFornecedor | null>(null);
  const [falhasPersistentes, setFalhasPersistentes] = useState<
    Array<{ nome: string; erro: string }>
  >([]);
  // Trocar de página troca a lista: sem isso o estado local seguraria os itens
  // da página anterior, e a seleção atravessaria páginas — exatamente o que
  // não pode acontecer, já que publicar age sobre o que está selecionado.
  useEffect(() => {
    setRascunhos(rascunhosIniciais);
    setSelecionados([]);
  }, [rascunhosIniciais]);

  const prontos = useMemo(
    () => rascunhos.filter((rascunho) => rascunho.pronto),
    [rascunhos],
  );
  const selecionadosProntos = selecionados.filter((id) =>
    prontos.some((rascunho) => rascunho.id === id),
  );
  const todosProntosSelecionados =
    prontos.length > 0 && selecionadosProntos.length === prontos.length;

  function montarHrefPagina(mudancas: { pagina?: number; limite?: number }) {
    const parametros = new URLSearchParams();
    parametros.set("pagina", String(mudancas.pagina ?? paginacao.pagina));
    parametros.set("limite", String(mudancas.limite ?? paginacao.limite));

    return `${hrefBasePaginacao}?${parametros.toString()}`;
  }

  function alternarSelecionado(id: string, marcado: boolean) {
    setSelecionados((atuais) =>
      marcado
        ? Array.from(new Set([...atuais, id]))
        : atuais.filter((atual) => atual !== id),
    );
  }

  /**
   * Publica mostrando o andamento REAL, não só o resultado no fim.
   *
   * Até 25 itens, cada um vai numa chamada própria: o gestor vê "Publicando 2
   * de 5", sabe qual produto está sendo gravado e, se algum falhar, descobre
   * qual foi — sem perder os que já entraram. Cada item já era uma transação
   * independente no servidor, então dividir a chamada não muda a garantia:
   * troca uma barra de progresso falsa por uma verdadeira.
   */
  function publicarConfirmados() {
    const ids = [...confirmacao];
    if (ids.length === 0) return;

    const nomePorId = new Map(
      rascunhos.map((rascunho) => [rascunho.id, rascunho.nome]),
    );

    setConfirmacao([]);
    setProgresso({
      total: ids.length,
      concluidos: 0,
      atual: nomePorId.get(ids[0]) ?? null,
      falhas: [],
    });

    iniciarTransicao(async () => {
      const lotes = dividirLotesPublicacaoFornecedor(ids);
      const publicadosIds: string[] = [];
      const falhas: Array<{ nome: string; erro: string }> = [];

      for (const lote of lotes) {
        setProgresso((atual) =>
          atual ? { ...atual, atual: nomePorId.get(lote[0]) ?? null } : atual,
        );

        const resultado = await acaoPublicar({ rascunhoIds: lote });
        const idsDoLote = resultado.publicados.map((item) => item.rascunhoId);
        publicadosIds.push(...idsDoLote);

        if (idsDoLote.length < lote.length) {
          for (const id of lote) {
            if (idsDoLote.includes(id)) continue;
            falhas.push({
              nome: nomePorId.get(id) ?? "Produto",
              erro: resultado.erro ?? "Não foi possível publicar este item.",
            });
          }
        }

        // Some da lista assim que entra no catálogo: a tela acompanha o banco.
        if (idsDoLote.length > 0) {
          setRascunhos((atuais) =>
            atuais.filter((rascunho) => !idsDoLote.includes(rascunho.id)),
          );
          setSelecionados((atuais) =>
            atuais.filter((id) => !idsDoLote.includes(id)),
          );
        }

        setProgresso((atual) =>
          atual
            ? {
                ...atual,
                concluidos: atual.concluidos + lote.length,
                falhas: [...falhas],
              }
            : atual,
        );
      }

      setProgresso(null);

      // O servidor refaz a conta e faz o clamp da página: publicar os itens da
      // última página encolhe o total, e sem isso o gestor cairia numa tela
      // vazia sem entender o motivo.
      if (publicadosIds.length > 0) router.refresh();

      if (publicadosIds.length > 0 && falhas.length === 0) {
        toast.success(
          publicadosIds.length === 1
            ? "Produto publicado e já atualizado na loja."
            : `${publicadosIds.length} produtos publicados e já atualizados na loja.`,
        );
        return;
      }

      if (publicadosIds.length > 0) {
        toast.warning(
          `${publicadosIds.length} publicado(s), ${falhas.length} com problema.`,
        );
        setFalhasPersistentes(falhas);
        return;
      }

      toast.error(falhas[0]?.erro ?? "Não foi possível concluir a publicação.");
      setFalhasPersistentes(falhas);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <header className="flex flex-col gap-4 rounded-lg border bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={hrefVoltar}
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Conciliação
          </Link>
          <h1 className="text-2xl font-semibold text-slate-950">{titulo}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
        </div>
        <Badge variant="outline" className="w-fit">
          {prontos.length} pronto{prontos.length === 1 ? "" : "s"}
        </Badge>
      </header>

      {!sessaoAtiva ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Sua sessão expirou. Entre novamente antes de publicar.
        </section>
      ) : null}

      {/* Progresso real: quantos, qual agora, quanto falta. Fica no topo para
          o gestor não precisar procurar sinal de vida na tela. */}
      {progresso ? (
        <section
          role="status"
          aria-live="polite"
          className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-blue-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-blue-950">
                {progresso.total === 1
                  ? "Publicando 1 produto…"
                  : `Publicando ${Math.min(progresso.concluidos + 1, progresso.total)} de ${progresso.total} produtos…`}
              </p>
              {progresso.atual ? (
                <p className="mt-0.5 truncate text-xs text-blue-800">
                  {progresso.atual}
                </p>
              ) : null}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
                  style={{
                    width: `${Math.round((progresso.concluidos / progresso.total) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-blue-800">
                {progresso.concluidos} concluído
                {progresso.concluidos === 1 ? "" : "s"} · não feche esta página.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {falhasPersistentes.length > 0 && !progresso ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-950">
                {falhasPersistentes.length}{" "}
                {falhasPersistentes.length === 1 ? "item" : "itens"}
                {falhasPersistentes.length === 1
                  ? " não pôde ser publicado"
                  : " não puderam ser publicados"}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-amber-900">
                {falhasPersistentes.map((falha) => (
                  <li key={`${falha.nome}-${falha.erro}`}>
                    <span className="font-medium">{falha.nome}</span> —{" "}
                    {falha.erro}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {rascunhos.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-lg border bg-white p-10 text-center shadow-xs">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          <div>
            <h2 className="font-semibold text-slate-950">
              Nenhum rascunho aguardando publicação
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Produtos já publicados não ficam disponíveis novamente.
            </p>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border bg-white shadow-xs">
          {selecionadosProntos.length > 0 ? (
            <div className="flex flex-col gap-3 border-b bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-700">
                {selecionadosProntos.length} produto
                {selecionadosProntos.length === 1
                  ? " selecionado"
                  : "s selecionados"}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => setConfirmacao(selecionadosProntos)}
                disabled={processando || !sessaoAtiva}
                aria-busy={processando}
              >
                {processando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PackageCheck className="mr-2 h-4 w-4" />
                )}
                {processando
                  ? "Publicando…"
                  : `Publicar ${selecionadosProntos.length} selecionado${selecionadosProntos.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          ) : null}

          <div className="hidden grid-cols-[40px_minmax(260px,1fr)_150px_170px_150px] items-center gap-4 border-b bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500 uppercase md:grid">
            <CheckboxFornecedor
              checked={todosProntosSelecionados}
              onCheckedChange={(marcado) =>
                setSelecionados(
                  marcado === true ? prontos.map((item) => item.id) : [],
                )
              }
              aria-label={`Selecionar os ${prontos.length} produtos prontos desta página`}
            />
            <span>Produto</span>
            <span>Preço</span>
            <span>Situação</span>
            <span className="text-right">Ações</span>
          </div>

          <div className="divide-y">
            {rascunhos.map((rascunho) => (
              <article
                key={rascunho.id}
                className="grid gap-4 p-4 md:grid-cols-[40px_minmax(260px,1fr)_150px_170px_150px] md:items-center"
              >
                <CheckboxFornecedor
                  checked={selecionados.includes(rascunho.id)}
                  disabled={!rascunho.pronto || processando}
                  onCheckedChange={(marcado) =>
                    alternarSelecionado(rascunho.id, marcado === true)
                  }
                  aria-label={`Selecionar ${rascunho.nome}`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-950">
                      {rascunho.nome}
                    </p>
                    {/* Deixa explícito, antes de confirmar, se o item cria um
                        produto novo ou mexe em um produto que já está na loja. */}
                    <Badge
                      variant="outline"
                      className={
                        rascunho.produtoAtualizadoId
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }
                    >
                      {rascunho.produtoAtualizadoId
                        ? "Atualizar produto"
                        : "Criar produto"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Código fornecedor:{" "}
                    {rascunho.codigoFornecedor ?? "Não informado"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {rascunho.produtoAtualizadoId
                      ? `Produto na loja: ${rascunho.produtoAtualizadoNome ?? "-"}`
                      : `${rascunho.categoriaNome ?? "Sem categoria"} · ${rascunho.marcaNome ?? "Sem marca"}`}
                  </p>
                </div>
                <p className="text-sm font-medium text-slate-800">
                  {formatarPreco(rascunho.precoLoja)}
                </p>
                <div>
                  {rascunho.pronto ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      Pronto
                    </Badge>
                  ) : (
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className="border-amber-300 text-amber-700"
                      >
                        Bloqueado
                      </Badge>
                      <p className="text-xs text-amber-700">
                        {rascunho.pendencias.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!rascunho.pronto || processando || !sessaoAtiva}
                    aria-busy={processando}
                    onClick={() => setConfirmacao([rascunho.id])}
                  >
                    Publicar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <PaginacaoAdmin
        pagina={paginacao.pagina}
        totalPaginas={paginacao.totalPaginas}
        total={paginacao.total}
        limite={paginacao.limite}
        opcoesLimite={OPCOES_LIMITE_FORNECEDORES}
        montarHref={montarHrefPagina}
        rotuloItens="produtos prontos"
      />

      <Dialog
        open={confirmacao.length > 0}
        onOpenChange={(aberto) => !aberto && setConfirmacao([])}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar publicação</DialogTitle>
            <DialogDescription>
              Você está prestes a publicar {confirmacao.length} produto(s) no
              catálogo da loja. Eles poderão aparecer no site. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />A publicação
            cria produtos reais e uma variante técnica padrão para compra.
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmacao([])}
              disabled={processando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={publicarConfirmados}
              disabled={processando}
            >
              {processando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publicando…
                </>
              ) : (
                `Publicar ${confirmacao.length} produto${confirmacao.length === 1 ? "" : "s"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
