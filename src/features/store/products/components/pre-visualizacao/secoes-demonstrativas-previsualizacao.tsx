"use client";

import { Equal, Flame, Gift, Headset, Plus } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

type Props = {
  nomeProduto: string;
};

/**
 * Blocos demonstrativos isolados da pré-visualização. Não calculam preços,
 * persistem dados ou disparam ações do carrinho.
 */
export function CardAssistenteVirtualPrevisualizacao({
  nomeProduto,
  modoPreVisualizacao = true,
}: Props & { modoPreVisualizacao?: boolean }) {
  return (
    <section
      aria-labelledby="titulo-assistente-virtual-pdp"
      className="border-border border-l-primary bg-card rounded-xl border border-l-4 p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="bg-primary-light text-primary border-primary/15 flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-xs">
          <Headset className="size-5" aria-hidden="true" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2
              id="titulo-assistente-virtual-pdp"
              className="text-foreground text-sm font-bold"
            >
              Assistente Do Rocha
            </h2>
            <span className="text-primary inline-flex items-center gap-1 text-[11px] font-semibold">
              <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
              IA disponível agora
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            IA consultiva da loja para ajudar você a escolher a opção ideal
            para sua compra.
          </p>
        </div>
      </div>

      {/* Prova social mock temporária, restrita ao laboratório de pré-visualização. */}
      <p className="border-accent-brand/30 bg-accent-brand-light text-accent-brand-dark mt-3 flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-[11px] font-medium">
        <Flame className="text-accent-brand size-3.5" aria-hidden="true" />
        247 pessoas compraram com minha ajuda.
      </p>

      <Button
        type="button"
        className="mt-3 min-h-11 w-full"
        aria-label={`Conversar com o assistente virtual sobre ${nomeProduto}`}
        disabled={!modoPreVisualizacao}
      >
        {modoPreVisualizacao ? "Conversar com o assistente" : "Falar com o assistente — em breve"}
      </Button>
    </section>
  );
}

/** Pausa institucional entre complemento imediato e descoberta. */
export function BannerInstitucionalPrevisualizacao() {
  return (
    <section
      data-secao-preview="banner-institucional"
      aria-labelledby="titulo-banner-institucional"
      className="bg-primary text-primary-foreground relative mt-10 overflow-hidden rounded-2xl p-6 md:mt-14 md:p-8"
    >
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
        <span className="bg-accent-brand text-foreground flex size-14 shrink-0 items-center justify-center rounded-2xl md:size-16">
          <Gift className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-primary-foreground/70 text-xs font-bold tracking-[0.2em] uppercase">
            Conteúdo demonstrativo
          </p>
          <h2
            id="titulo-banner-institucional"
            className="mt-1 text-xl font-bold tracking-tight text-balance md:text-2xl"
          >
            Espaço para uma campanha institucional da loja
          </h2>
          <p className="text-primary-foreground/80 mt-1.5 max-w-2xl text-sm">
            Este banner será conectado somente quando houver uma campanha real e
            ativa.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled
          className="border-primary-foreground/30 text-primary-foreground bg-transparent"
        >
          Ver regras
        </Button>
      </div>
    </section>
  );
}

/** Complementos ficam próximos à PDP para avaliar aumento de cesta. */
export function SecaoCompreJuntoPrevisualizacao({
  nomeProduto,
  imagemProduto,
}: Props & { imagemProduto?: string }) {
  const inicialProduto = nomeProduto.trim().charAt(0).toUpperCase() || "P";

  return (
    <section
      data-secao-preview="compre-junto"
      aria-labelledby="titulo-compre-junto"
      className="bg-secondary/60 border-border mt-10 rounded-2xl border p-5 md:mt-14 md:p-6"
    >
      <div className="mb-4">
        <p className="text-primary text-[11px] font-bold tracking-[0.18em] uppercase">
          Compre junto
        </p>
        <h2
          id="titulo-compre-junto"
          className="text-foreground mt-1 text-xl font-bold tracking-tight md:text-2xl"
        >
          Leve o combo com 10% off
        </h2>
      </div>

      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <ProdutoDemonstrativo
            inicial={inicialProduto}
            imagem={imagemProduto}
            nome={nomeProduto}
            preco="R$ 793,99"
          />
          <Plus className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          <ProdutoDemonstrativo
            inicial="+"
            nome="Item complementar"
            preco="R$ 305,01"
          />
          <Equal
            className="text-muted-foreground hidden size-4 shrink-0 sm:block"
            aria-hidden="true"
          />
        </div>

        <aside className="border-border bg-card rounded-xl border p-4 lg:w-60">
          <p className="text-muted-foreground text-xs">Total do combo</p>
          <p className="text-muted-foreground mt-1 text-sm">
            De <span className="line-through">R$ 1.099,00</span>
          </p>
          <p className="text-primary mt-0.5 text-2xl font-extrabold tracking-tight">
            R$ 989,10
          </p>
          <p className="text-success mt-0.5 text-xs font-semibold">
            Economia de R$ 109,90
          </p>
          <Button type="button" className="mt-3 min-h-11 w-full" onClick={() => {}}>
            Aproveitar o combo
          </Button>
        </aside>
      </div>
    </section>
  );
}

function ProdutoDemonstrativo({
  inicial,
  imagem,
  nome,
  preco,
}: {
  inicial: string;
  imagem?: string;
  nome: string;
  preco: string;
}) {
  return (
    <div className="flex w-24 min-w-0 shrink-0 flex-col items-center gap-1.5 text-center sm:w-28">
      <div className="border-border bg-card relative flex size-20 items-center justify-center overflow-hidden rounded-xl border sm:size-24">
        {imagem ? (
          <Image
            src={imagem}
            alt=""
            fill
            sizes="(max-width: 640px) 80px, 96px"
            className="object-cover"
          />
        ) : (
          <span className="text-primary text-2xl font-bold">{inicial}</span>
        )}
      </div>
      <p className="line-clamp-2 text-[11px] font-medium text-foreground/80">
        {nome}
      </p>
      <p className="text-xs font-bold text-foreground">{preco}</p>
    </div>
  );
}
