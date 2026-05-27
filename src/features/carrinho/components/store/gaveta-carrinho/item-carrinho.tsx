import { Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { formatarPrecoCarrinho } from "../../../lib/formatar-preco-carrinho";
import type { ItemCarrinho as ItemCarrinhoTipo } from "../../../types/carrinho.types";
import { ControleQuantidadeCarrinho } from "./controle-quantidade-carrinho";

type ItemCarrinhoProps = {
  item: ItemCarrinhoTipo;
  atualizando?: boolean;
  onAumentar: () => void;
  onDiminuir: () => void;
  onRemover: () => void;
};

const tituloModalidadePorTipo: Record<string, string> = {
  stock: "Estoque Próprio",
  pre_sale: "Pré-venda",
  preSale: "Pré-venda",
  dropshipping: "Dropshipping",
  order_basis: "Sob Encomenda",
  orderBasis: "Sob Encomenda",
};

function textoParecePrazo(texto?: string) {
  if (!texto) return false;

  return /(\d+\s*(dia|dias|hora|horas)|consulte prazo|entrega|úteis|uteis)/i.test(
    texto,
  );
}

export function ItemCarrinho({
  item,
  atualizando,
  onAumentar,
  onDiminuir,
  onRemover,
}: ItemCarrinhoProps) {
  const urlProduto =
    item.produtoUrl || (item.produtoSlug ? `/product/${item.produtoSlug}` : "");
  const tituloModalidade =
    (item.modalidadeTitulo && !textoParecePrazo(item.modalidadeTitulo)
      ? item.modalidadeTitulo
      : "") ||
    (item.modalidadeTipo ? tituloModalidadePorTipo[item.modalidadeTipo] : "") ||
    (!textoParecePrazo(item.variante) ? item.variante : "");
  const atributosVariante = Object.entries(item.atributosVariante || {}).filter(
    ([nome, valor]) => nome.trim() && valor.trim(),
  );
  const exibirTituloModalidade =
    tituloModalidade && atributosVariante.length === 0;
  const conteudoImagem = (
    <Image
      fill
      alt={item.nome}
      className="object-contain p-2"
      sizes="84px"
      src={item.imagemUrl || "/produto-sem-foto.webp"}
    />
  );
  const conteudoTitulo = (
    <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-zinc-950 transition-colors dark:text-zinc-50">
      {item.nome}
    </h3>
  );

  return (
    <article
      className={cn(
        "grid grid-cols-[84px_1fr] gap-4 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/70",
        atualizando && "opacity-70",
      )}
    >
      {urlProduto ? (
        <Link
          href={urlProduto}
          className="relative aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
        >
          {conteudoImagem}
        </Link>
      ) : (
        <div className="relative aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          {conteudoImagem}
        </div>
      )}

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {urlProduto ? (
              <Link href={urlProduto} className="hover:underline">
                {conteudoTitulo}
              </Link>
            ) : (
              conteudoTitulo
            )}

            {exibirTituloModalidade ? (
              <span className="mt-1 inline-flex max-w-full rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <span className="truncate">{tituloModalidade}</span>
              </span>
            ) : null}
            {atributosVariante.length > 0 ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                {atributosVariante
                  .map(([nome, valor]) => `${nome}: ${valor}`)
                  .join(" • ")}
              </p>
            ) : null}
            {item.sku ? (
              <p className="mt-1 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
                SKU: {item.sku}
              </p>
            ) : null}
          </div>

          <Button
            aria-label="Remover item"
            className="size-8 shrink-0 rounded-md text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
            disabled={atualizando}
            size="icon"
            type="button"
            variant="ghost"
            onClick={onRemover}
          >
            {atualizando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <ControleQuantidadeCarrinho
            desabilitado={atualizando}
            quantidade={item.quantidade}
            onAumentar={onAumentar}
            onDiminuir={onDiminuir}
          />

          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {formatarPrecoCarrinho(item.precoEmCentavos * item.quantidade)}
          </p>
        </div>
      </div>
    </article>
  );
}
