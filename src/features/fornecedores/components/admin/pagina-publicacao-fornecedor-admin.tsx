"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

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

type PaginaPublicacaoFornecedorAdminProps = {
  titulo: string;
  subtitulo: string;
  hrefVoltar: string;
  rascunhosIniciais: RascunhoPublicacaoFornecedor[];
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
  rascunhosIniciais,
  sessaoAtiva,
  acaoPublicar,
}: PaginaPublicacaoFornecedorAdminProps) {
  const [rascunhos, setRascunhos] = useState(rascunhosIniciais);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [confirmacao, setConfirmacao] = useState<string[]>([]);
  const [processando, iniciarTransicao] = useTransition();
  const prontos = useMemo(
    () => rascunhos.filter((rascunho) => rascunho.pronto),
    [rascunhos],
  );
  const selecionadosProntos = selecionados.filter((id) =>
    prontos.some((rascunho) => rascunho.id === id),
  );
  const todosProntosSelecionados =
    prontos.length > 0 && selecionadosProntos.length === prontos.length;

  function alternarSelecionado(id: string, marcado: boolean) {
    setSelecionados((atuais) =>
      marcado
        ? Array.from(new Set([...atuais, id]))
        : atuais.filter((atual) => atual !== id),
    );
  }

  function publicarConfirmados() {
    const ids = [...confirmacao];
    if (ids.length === 0) return;

    iniciarTransicao(async () => {
      const resultado = await acaoPublicar({ rascunhoIds: ids });
      const publicadosIds = resultado.publicados.map((item) => item.rascunhoId);

      if (publicadosIds.length > 0) {
        setRascunhos((atuais) =>
          atuais.filter((rascunho) => !publicadosIds.includes(rascunho.id)),
        );
        setSelecionados((atuais) =>
          atuais.filter((id) => !publicadosIds.includes(id)),
        );
      }

      if (resultado.sucesso) {
        toast.success(resultado.mensagem ?? "Produtos publicados com sucesso.");
      } else {
        toast.error(
          resultado.erro ?? "Não foi possível concluir a publicação.",
        );
      }
      setConfirmacao([]);
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
              >
                <PackageCheck className="mr-2 h-4 w-4" />
                Publicar selecionados
              </Button>
            </div>
          ) : null}

          <div className="hidden grid-cols-[40px_minmax(260px,1fr)_150px_170px_150px] items-center gap-4 border-b bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500 uppercase md:grid">
            <Checkbox
              checked={todosProntosSelecionados}
              onCheckedChange={(marcado) =>
                setSelecionados(
                  marcado === true ? prontos.map((item) => item.id) : [],
                )
              }
              aria-label="Selecionar todos os produtos prontos"
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
                <Checkbox
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
              {processando ? "Publicando..." : "Confirmar publicação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
