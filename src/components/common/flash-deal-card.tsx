"use client";

import { Check, Clock3, Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useCarrinho } from "@/features/carrinho";
import { formatCentsToBRL } from "@/helpers/money";
import { useCountdown } from "@/hooks/use-countdown";

interface ProdutoOfertaRelampago {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  cardShortText?: string | null;
  description: string | null;
  galleryImages: Array<{
    imageUrl: string;
    isPrimary: boolean | null;
  }>;
  pricing: Array<{
    id?: string;
    type?: string | null;
    pricingModalDescription?: string | null;
    price: number | null;
    promoPrice?: number | null;
    hasPromo?: boolean | null;
    promoType?: "normal" | "flash" | string | null;
    promoEndDate?: Date | string | null;
    mainCardPrice: boolean | null;
  }>;
}

interface CartaoOfertaRelampagoProps {
  produtos: ProdutoOfertaRelampago[];
  dataFinalFallback?: string;
}

const unidadesRestantes = [7, 12, 3];
const fundosImagem = ["bg-[#f5f0e8]", "bg-[#e8f0f5]", "bg-[#f0ede8]"];

export const CartaoOfertaRelampago = ({
  produtos,
  dataFinalFallback,
}: CartaoOfertaRelampagoProps) => {
  const [indiceProduto, setIndiceProduto] = useState(0);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [produtoAdicionadoId, setProdutoAdicionadoId] = useState<string | null>(
    null,
  );
  const { adicionarItem } = useCarrinho();
  const produtoAtual = produtos[indiceProduto] ?? produtos[0];
  const dataFinalAtual =
    produtoAtual?.pricing?.[0]?.promoEndDate ?? dataFinalFallback;
  const tempoRestante = useCountdown(
    dataFinalAtual
      ? new Date(dataFinalAtual).toISOString()
      : new Date().toISOString(),
  );

  useEffect(() => {
    if (produtos.length < 2) return;

    const intervalo = window.setInterval(() => {
      setIndiceProduto((indiceAtual) => (indiceAtual + 1) % produtos.length);
    }, 12000);

    return () => window.clearInterval(intervalo);
  }, [produtos.length]);

  if (produtos.length === 0) return null;

  const produto = produtoAtual!;
  const imagemPrincipal =
    produto.galleryImages?.find((imagem) => imagem.isPrimary) ??
    produto.galleryImages?.[0];
  const precoPrincipal =
    produto.pricing?.find((preco) => preco.mainCardPrice) ??
    produto.pricing?.[0];
  const precoOriginal = precoPrincipal?.price ?? 0;
  const precoAtual =
    precoPrincipal?.hasPromo && precoPrincipal.promoPrice
      ? precoPrincipal.promoPrice
      : precoOriginal;
  const desconto =
    precoOriginal > precoAtual
      ? Math.round(((precoOriginal - precoAtual) / precoOriginal) * 100)
      : 0;
  const estoque = unidadesRestantes[indiceProduto % unidadesRestantes.length];
  const percentualVendido = 100 - Math.min(24, estoque * 2);
  const horas = tempoRestante.days * 24 + tempoRestante.hours;
  const segundosRestantes =
    horas * 3600 + tempoRestante.minutes * 60 + tempoRestante.seconds;
  const percentualTempo = Math.min(
    100,
    Math.max(0, (segundosRestantes / (3 * 3600)) * 100),
  );
  const urgente = segundosRestantes < 3600;
  const favorito = favoritos.includes(produto.id);
  const produtoAdicionado = produtoAdicionadoId === produto.id;

  const alternarFavorito = () => {
    setFavoritos((atuais) =>
      atuais.includes(produto.id)
        ? atuais.filter((id) => id !== produto.id)
        : [...atuais, produto.id],
    );
  };

  const adicionarAoCarrinho = () => {
    adicionarItem({
      produtoId: produto.id,
      produtoSlug: produto.slug,
      nome: produto.name,
      variante: precoPrincipal?.pricingModalDescription || "Preço principal",
      prazoModalidade: "Consulte prazo",
      imagemUrl: imagemPrincipal?.imageUrl ?? "/produto-sem-foto.webp",
      precoEmCentavos: precoAtual,
      quantidade: 1,
    });
    setProdutoAdicionadoId(produto.id);
    window.setTimeout(() => setProdutoAdicionadoId(null), 2000);
  };

  return (
    <section className="flex h-full min-w-0 flex-col py-2 font-sans">
      <h2 className="sr-only">
        Seção de ofertas relâmpago com contagem regressiva
      </h2>

      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 rounded bg-[#1a1a1a] px-3.5 py-1.5 text-[13px] font-bold tracking-[0.08em] text-white uppercase">
          <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-[#ff3b3b]" />
          Oferta relâmpago
        </div>
        <p className="shrink-0 text-[13px] text-gray-500">
          produto{" "}
          <span className="font-medium text-gray-900">{indiceProduto + 1}</span>{" "}
          de{" "}
          <span className="font-medium text-gray-900">{produtos.length}</span>
        </p>
      </header>

      <article
        key={produto.id}
        className="animate-in fade-in grid min-h-[390px] flex-1 grid-cols-1 overflow-hidden rounded-xl border border-gray-200 bg-white duration-300 sm:grid-cols-2"
      >
        <Link
          href={`/product/${produto.slug}`}
          className={`relative flex min-h-[250px] items-center justify-center overflow-hidden sm:min-h-[390px] ${fundosImagem[indiceProduto % fundosImagem.length]}`}
          aria-label={`Ver ${produto.name}`}
        >
          {desconto > 0 && (
            <span className="absolute top-4 left-4 z-10 rounded bg-[#ff3b3b] px-3 py-1.5 text-lg leading-none font-extrabold text-white">
              -{desconto}%
            </span>
          )}
          <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-3 py-1.5 text-xs font-extrabold tracking-[0.08em] text-white uppercase shadow-lg shadow-red-500/30">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Relâmpago
          </span>
          {imagemPrincipal?.imageUrl ? (
            <Image
              src={imagemPrincipal.imageUrl}
              alt={produto.name}
              fill
              className="object-contain p-10 transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 27vw, 300px"
            />
          ) : (
            <span className="text-sm text-gray-500">Imagem não disponível</span>
          )}
          <span className="absolute bottom-4 left-4 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500">
            apenas <strong className="text-[#ff3b3b]">{estoque}</strong>{" "}
            restantes
          </span>
        </Link>

        <div className="flex flex-col justify-between px-5 py-6 sm:px-6 sm:py-7">
          <div>
            <p className="mb-1.5 text-[11px] font-medium tracking-[0.1em] text-gray-500 uppercase">
              {produto.brand || "Oferta especial"}
            </p>
            <Link href={`/product/${produto.slug}`}>
              <h3 className="mb-2 line-clamp-2 text-[22px] leading-[1.2] font-extrabold text-gray-900">
                {produto.name}
              </h3>
            </Link>
            <p className="mb-4 line-clamp-2 text-[13px] leading-[1.6] text-gray-500">
              {produto.cardShortText || produto.description}
            </p>

            <div className="mb-4 flex items-baseline gap-2.5">
              <span className="text-[30px] leading-none font-extrabold text-gray-900">
                {precoAtual ? formatCentsToBRL(precoAtual) : "Consulte"}
              </span>
              {desconto > 0 && (
                <span className="text-base text-gray-500 line-through">
                  {formatCentsToBRL(precoOriginal)}
                </span>
              )}
            </div>

            <div className="mb-4 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#ff3b3b]"
                  style={{ width: `${percentualVendido}%` }}
                />
              </div>
              <span className="text-xs whitespace-nowrap text-gray-500">
                <strong className="text-[#ff3b3b]">{percentualVendido}%</strong>{" "}
                vendido
              </span>
            </div>

            <p className="mb-2 flex items-center gap-1 text-[11px] font-medium tracking-[0.08em] text-gray-500 uppercase">
              <Clock3 className="h-3 w-3" />
              termina em
            </p>
            <div className="mb-4 flex items-center gap-1.5">
              <BlocoTempo valor={horas} rotulo="horas" urgente={urgente} />
              <SeparadorTempo />
              <BlocoTempo
                valor={tempoRestante.minutes}
                rotulo="min"
                urgente={urgente}
              />
              <SeparadorTempo />
              <BlocoTempo
                valor={tempoRestante.seconds}
                rotulo="seg"
                urgente={urgente}
              />
            </div>
            <div className="mb-5 h-[3px] overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#ff3b3b] transition-[width] duration-1000"
                style={{ width: `${percentualTempo}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-85 ${produtoAdicionado ? "bg-[#1a7a4a]" : "bg-[#1a1a1a]"}`}
              onClick={adicionarAoCarrinho}
              type="button"
            >
              {produtoAdicionado ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
              {produtoAdicionado ? "Adicionado!" : "Adicionar ao carrinho"}
            </button>
            <button
              aria-label={
                favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"
              }
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-white transition-colors hover:border-[#ff3b3b] hover:text-[#ff3b3b] ${favorito ? "border-[#ff3b3b] text-[#ff3b3b]" : "border-gray-200 text-gray-500"}`}
              onClick={alternarFavorito}
              type="button"
            >
              <Heart
                className={`h-[18px] w-[18px] ${favorito ? "fill-current" : ""}`}
              />
            </button>
          </div>
        </div>
      </article>

      {produtos.length > 1 && (
        <nav
          className="mt-5 flex items-center justify-center gap-2"
          aria-label="Ofertas"
        >
          {produtos.map((item, indice) => (
            <button
              key={item.id}
              aria-label={`Ver produto ${indice + 1}`}
              className={`h-1.5 w-1.5 rounded-full transition-transform ${indice === indiceProduto ? "scale-150 bg-[#1a1a1a]" : "bg-gray-300"}`}
              onClick={() => setIndiceProduto(indice)}
              type="button"
            />
          ))}
        </nav>
      )}
    </section>
  );
};

const BlocoTempo = ({
  valor,
  rotulo,
  urgente,
}: {
  valor: number;
  rotulo: string;
  urgente: boolean;
}) => (
  <div className="flex min-w-[46px] flex-col items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-2">
    <span
      className={`text-[21px] leading-none font-bold tabular-nums ${urgente ? "text-[#ff3b3b]" : "text-gray-900"}`}
    >
      {String(valor).padStart(2, "0")}
    </span>
    <span className="mt-1 text-[9px] font-medium tracking-[0.08em] text-gray-500 uppercase">
      {rotulo}
    </span>
  </div>
);

const SeparadorTempo = () => (
  <span className="mb-3 text-lg font-bold text-gray-400">:</span>
);

// Mantem consumidores antigos funcionando enquanto a home usa a nova lista rotativa.
export const FlashDealCard = ({
  product,
  endDate,
}: {
  product: any;
  endDate: string;
}) => (
  <CartaoOfertaRelampago produtos={[product]} dataFinalFallback={endDate} />
);
