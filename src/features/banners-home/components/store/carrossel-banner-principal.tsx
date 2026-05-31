"use client";

import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

import type { BannerHomeDados } from "../../types/banners-home.types";
import { BannerPrincipalEsquerdo } from "./banner-principal-esquerdo";

type CarrosselBannerPrincipalProps = {
  banners: BannerHomeDados[];
};

export function CarrosselBannerPrincipal({
  banners,
}: CarrosselBannerPrincipalProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [total, setTotal] = useState(0);
  const temporizadorRetomadaRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const autoplay = useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    }),
  );

  const pausarAutoplay = () => {
    autoplay.current.stop();
  };

  const retomarAutoplayComAtraso = (delayMs = 5000) => {
    if (temporizadorRetomadaRef.current) {
      clearTimeout(temporizadorRetomadaRef.current);
    }

    temporizadorRetomadaRef.current = setTimeout(() => {
      autoplay.current.play();
    }, delayMs);
  };

  useEffect(() => {
    if (!api) return;

    setTotal(api.scrollSnapList().length);
    setIndiceAtual(api.selectedScrollSnap());

    const atualizarIndice = () => {
      setIndiceAtual(api.selectedScrollSnap());
    };

    api.on("select", atualizarIndice);
    api.on("reInit", atualizarIndice);

    const pausarPorInteracao = () => pausarAutoplay();
    const retomarPosInteracao = () => retomarAutoplayComAtraso(5000);

    api.on("pointerDown", pausarPorInteracao);
    api.on("pointerUp", retomarPosInteracao);

    return () => {
      api.off("select", atualizarIndice);
      api.off("reInit", atualizarIndice);
      api.off("pointerDown", pausarPorInteracao);
      api.off("pointerUp", retomarPosInteracao);

      if (temporizadorRetomadaRef.current) {
        clearTimeout(temporizadorRetomadaRef.current);
      }
    };
  }, [api]);

  if (banners.length === 1) {
    return <BannerPrincipalEsquerdo banner={banners[0]} prioridadeImagem />;
  }

  return (
    <Carousel
      setApi={setApi}
      plugins={[autoplay.current]}
      opts={{ align: "start", loop: true }}
      className="group/banner-home-principal relative h-full"
      aria-label="Carrossel de banners principais"
      onMouseEnter={pausarAutoplay}
      onMouseLeave={() => retomarAutoplayComAtraso(300)}
    >
      <CarouselContent className="ml-0 h-full">
        {banners.map((banner, indice) => (
          <CarouselItem key={banner.id} className="h-full pl-0">
            <BannerPrincipalEsquerdo
              banner={banner}
              prioridadeImagem={indice === 0}
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="left-3 h-8 w-8 border-white/60 bg-white/80 text-slate-700 opacity-0 shadow-sm backdrop-blur transition group-hover/banner-home-principal:opacity-100 hover:bg-white disabled:hidden" />
      <CarouselNext className="right-3 h-8 w-8 border-white/60 bg-white/80 text-slate-700 opacity-0 shadow-sm backdrop-blur transition group-hover/banner-home-principal:opacity-100 hover:bg-white disabled:hidden" />

      {total > 1 && (
        <div className="absolute right-4 bottom-3 z-20 flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, indice) => (
            <button
              key={indice}
              type="button"
              aria-label={`Ir para o banner ${indice + 1}`}
              onClick={() => {
                api?.scrollTo(indice);
                retomarAutoplayComAtraso(5000);
              }}
              className={cn(
                "h-1.5 rounded-full bg-white/70 shadow-sm transition-all hover:bg-white",
                indice === indiceAtual ? "w-6" : "w-1.5",
              )}
            />
          ))}
        </div>
      )}
    </Carousel>
  );
}
