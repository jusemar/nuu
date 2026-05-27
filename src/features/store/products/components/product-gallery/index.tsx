"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  imagens: string[];
  isLancamento?: boolean;
}

export function ProductGallery({
  imagens,
  isLancamento = true,
}: ProductGalleryProps) {
  const [imgAtiva, setImgAtiva] = useState(0);

  useEffect(() => {
    setImgAtiva(0);
  }, [imagens[0]]);

  const proximaImagem = () => {
    setImgAtiva((atual) => (atual + 1) % imagens.length);
  };

  const imagemAnterior = () => {
    setImgAtiva((atual) => (atual - 1 + imagens.length) % imagens.length);
  };

  return (
    <div className="sticky top-[70px] flex flex-col-reverse items-start gap-3 md:flex-row">
      {/* Miniaturas */}
      <div className="flex flex-row gap-2 overflow-x-auto md:flex-col md:overflow-x-visible">
        {imagens.map((img, index) => (
          <button
            key={index}
            onClick={() => setImgAtiva(index)}
            className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all md:h-16 md:w-16 ${
              index === imgAtiva
                ? "border-primary opacity-100"
                : "border-transparent opacity-50 hover:opacity-80"
            } `}
          >
            <Image
              src={img}
              alt={`Vista ${index + 1}`}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Imagem Principal */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
          <Image
            src={imagens[imgAtiva]}
            alt="Produto"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority
          />

          {/* Badge LANÇAMENTO */}
          {isLancamento && (
            <span
              className="absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wider text-white shadow-md"
              style={{ backgroundColor: "#EF9F27" }}
            >
              LANÇAMENTO
            </span>
          )}

          {/* Navegação */}
          <button
            onClick={imagemAnterior}
            className="absolute top-1/2 left-2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
          >
            ‹
          </button>
          <button
            onClick={proximaImagem}
            className="absolute top-1/2 right-2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
          >
            ›
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {imagens.map((_, index) => (
              <button
                key={index}
                onClick={() => setImgAtiva(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === imgAtiva ? "bg-primary w-4" : "w-1.5 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Banner Frete Grátis - ESTILO LIMPO SEM GRADIENTE */}
        <div className="bg-primary relative flex min-h-[80px] items-center gap-3 rounded-xl p-6 pr-4 text-white">
          <div className="relative z-10 flex-shrink-0 text-2xl">🏃</div>
          <div className="relative z-10 flex-1">
            <div className="mb-0.5 text-[11px] font-extrabold tracking-wider">
              FRETE GRÁTIS
            </div>
            <div className="text-[11px] leading-relaxed text-white/75">
              Compras acima de R$ 299,00.
            </div>
          </div>
          <button className="relative z-10 !mr-4 rounded-lg bg-white/20 px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-colors hover:bg-white/30">
            Ver condições
          </button>

          <div className="pointer-events-none absolute -top-5 -right-5 h-24 w-24 rounded-full bg-white/5" />
        </div>
      </div>
    </div>
  );
}
