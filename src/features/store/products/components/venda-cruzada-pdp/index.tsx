"use client";

import { Check, ExternalLink, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { NovoItemCarrinho } from "@/features/carrinho";
import { useCarrinho } from "@/features/carrinho";

import {
  alternarSelecaoVendaCruzada,
  calcularResumoVendaCruzada,
  montarTextoUnidadesVendaCruzada,
  podeAdicionarVendaCruzada,
} from "../../lib/calcular-resumo-venda-cruzada";
import type { ProdutoVendaCruzadaPdp } from "../../queries/venda-cruzada/buscar-venda-cruzada-pdp";

function formatarReais(valor: number | null) {
  if (valor === null) return "Selecione a variante do produto principal";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor / 100);
}

export function VendaCruzadaPdp({
  produtos,
  itemPrincipal,
  precoPrincipalEmCentavos,
  quantidadePrincipal,
  freteEscolhido,
}: {
  produtos: ProdutoVendaCruzadaPdp[];
  itemPrincipal: NovoItemCarrinho | null;
  precoPrincipalEmCentavos: number | null;
  quantidadePrincipal: number;
  freteEscolhido: NovoItemCarrinho["freteEscolhido"] | null;
}) {
  const { adicionarItens } = useCarrinho();
  const [idsSelecionados, setIdsSelecionados] = useState<Set<string>>(
    new Set(),
  );
  const [mensagemConfirmacao, setMensagemConfirmacao] = useState<string | null>(
    null,
  );
  const inclusaoEmCursoRef = useRef(false);
  const resumo = useMemo(
    () =>
      calcularResumoVendaCruzada({
        precoPrincipalEmCentavos,
        quantidadePrincipal,
        produtos,
        idsSelecionados,
      }),
    [idsSelecionados, precoPrincipalEmCentavos, produtos, quantidadePrincipal],
  );
  const podeAdicionarSelecionados = podeAdicionarVendaCruzada(
    itemPrincipal !== null,
    resumo.quantidadeAdicionais,
  );

  if (produtos.length === 0) return null;

  function alternarProduto(produto: ProdutoVendaCruzadaPdp) {
    setIdsSelecionados((atuais) =>
      alternarSelecaoVendaCruzada(
        atuais,
        produto.id,
        produto.itemCarrinho !== null,
      ),
    );
  }

  function adicionarSelecionados() {
    if (
      inclusaoEmCursoRef.current ||
      !itemPrincipal ||
      !freteEscolhido ||
      !podeAdicionarSelecionados
    )
      return;

    inclusaoEmCursoRef.current = true;
    const itensSelecionados: NovoItemCarrinho[] = [];
    for (const produto of produtos) {
      if (!idsSelecionados.has(produto.id) || !produto.itemCarrinho) continue;
      itensSelecionados.push({
        produtoId: produto.id,
        produtoVarianteId: produto.itemCarrinho.produtoVarianteId,
        produtoSlug: produto.slug,
        produtoUrl: `/product/${produto.slug}`,
        nome: produto.nome,
        sku: produto.itemCarrinho.sku,
        modalidadeTipo: produto.itemCarrinho.modalidadeTipo,
        modalidadeTitulo: produto.itemCarrinho.modalidadeTipo,
        variante: produto.itemCarrinho.modalidadeTipo,
        imagemUrl: produto.imagemUrl || "/produto-sem-foto.webp",
        precoEmCentavos: produto.precoEmCentavos,
        estoqueDisponivel: produto.itemCarrinho.estoqueDisponivel,
        freteEscolhido,
        quantidade: 1,
      });
    }
    adicionarItens([...itensSelecionados, itemPrincipal]);
    setIdsSelecionados(new Set());
    setMensagemConfirmacao(
      `${itensSelecionados.length + 1} produtos adicionados ao carrinho.`,
    );
    window.setTimeout(() => {
      inclusaoEmCursoRef.current = false;
    }, 600);
  }

  return (
    <section
      aria-labelledby="titulo-venda-cruzada"
      className="border-border bg-card mt-10 rounded-2xl border p-4 sm:p-5 md:mt-14 md:p-6"
    >
      <div className="mb-5">
        <h2
          id="titulo-venda-cruzada"
          className="text-foreground text-xl font-bold md:text-2xl"
        >
          Aproveite e leve também
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Uma seleção especial para acrescentar ao seu pedido.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {produtos.map((produto) => {
          const selecionado = idsSelecionados.has(produto.id);
          const exigeVariante = produto.itemCarrinho === null;
          const idCheckbox = `venda-cruzada-${produto.id}`;
          return (
            <article
              key={produto.id}
              className={`relative min-w-0 rounded-xl border p-3 transition-[border-color,background-color,box-shadow] ${
                exigeVariante
                  ? "border-border bg-muted/40 text-muted-foreground"
                  : selecionado
                    ? "border-primary bg-primary/10 ring-primary/25 ring-2"
                    : "border-foreground/30 bg-background hover:border-primary/70 hover:bg-primary/[0.03]"
              }`}
            >
              <label
                htmlFor={idCheckbox}
                aria-label={`Selecionar ${produto.nome}`}
                className={`absolute inset-0 z-10 rounded-xl ${
                  exigeVariante ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              />
              <input
                id={idCheckbox}
                type="checkbox"
                checked={selecionado}
                disabled={exigeVariante}
                onChange={() => alternarProduto(produto)}
                aria-label={`Selecionar ${produto.nome}`}
                className="peer border-foreground/60 bg-background checked:border-primary checked:bg-primary focus-visible:ring-ring disabled:border-muted-foreground/30 disabled:bg-muted absolute top-3 left-3 z-20 size-5 cursor-pointer appearance-none rounded-[5px] border-2 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span
                aria-hidden="true"
                className="text-primary-foreground pointer-events-none absolute top-3 left-3 z-30 flex size-5 items-center justify-center opacity-0 peer-checked:opacity-100"
              >
                <Check className="size-4 stroke-[3]" />
              </span>
              <div className="pointer-events-none relative flex min-w-0 gap-3 pl-8">
                <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg border">
                  <Image
                    src={produto.imagemUrl || "/produto-sem-foto.webp"}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">
                    {produto.nome}
                  </p>
                  <p className="text-primary mt-1 font-bold">
                    {formatarReais(produto.precoEmCentavos)}
                  </p>
                  {exigeVariante ? (
                    <Link
                      href={`/product/${produto.slug}`}
                      prefetch={false}
                      className="text-primary focus-visible:ring-ring pointer-events-auto relative z-30 mt-1 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:outline-none"
                    >
                      Escolher variante <ExternalLink className="size-3" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="border-border mt-5 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div aria-live="polite">
          <p className="text-muted-foreground text-sm">
            {resumo.quantidadeProdutos}{" "}
            {resumo.quantidadeProdutos === 1
              ? "produto selecionado"
              : "produtos selecionados"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Total à vista no PIX
          </p>
          <p className="text-primary text-2xl font-extrabold">
            {formatarReais(resumo.totalEmCentavos)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {montarTextoUnidadesVendaCruzada(
              quantidadePrincipal,
              resumo.quantidadeAdicionais,
            )}
          </p>
        </div>
        <Button
          type="button"
          disabled={!podeAdicionarSelecionados || !freteEscolhido}
          onClick={adicionarSelecionados}
          className="min-h-11 sm:min-w-64"
        >
          <ShoppingCart className="size-4" />
          Adicionar selecionados ao carrinho
        </Button>
      </div>
      {mensagemConfirmacao ? (
        <p
          className="mt-3 text-sm font-semibold text-emerald-700"
          role="status"
        >
          {mensagemConfirmacao}
        </p>
      ) : !freteEscolhido && resumo.quantidadeAdicionais > 0 ? (
        <p className="mt-3 text-sm text-amber-700" role="status">
          Selecione uma forma de entrega na caixa de compra para continuar.
        </p>
      ) : null}
    </section>
  );
}
