import { Gift } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { BannerHomeDados } from "../../types/banners-home.types";
import { BannerImagemHome } from "./banner-imagem-home";

type PropriedadesBannerInstitucionalProduto = {
  banner: BannerHomeDados;
};

/** Renderiza na PDP a mesma configuração persistida no gestor de banners. */
export function BannerInstitucionalProduto({
  banner,
}: PropriedadesBannerInstitucionalProduto) {
  if (banner.tipoBanner === "imagem" && banner.imagemUrl) {
    return (
      <BannerImagemHome
        banner={banner}
        sizes="(min-width: 1280px) 1216px, calc(100vw - 48px)"
        className="relative mt-10 block min-h-48 overflow-hidden rounded-2xl bg-slate-100 md:mt-14"
      />
    );
  }

  const estilo = {
    backgroundColor: banner.corFundo ?? undefined,
    color: banner.corTexto ?? undefined,
  };

  return (
    <section
      data-secao="banner-institucional-produto"
      className="bg-primary text-primary-foreground relative mt-10 overflow-hidden rounded-2xl p-6 md:mt-14 md:p-8"
      style={estilo}
    >
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
        <span
          className="bg-accent-brand text-foreground flex size-14 shrink-0 items-center justify-center rounded-2xl md:size-16"
          style={{ backgroundColor: banner.corDestaque ?? undefined }}
        >
          <Gift className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          {banner.subtitulo && (
            <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-70">
              {banner.subtitulo}
            </p>
          )}
          <h2 className="mt-1 text-xl font-bold tracking-tight text-balance md:text-2xl">
            {banner.titulo}
          </h2>
          {banner.textoApoio && (
            <p className="mt-1.5 max-w-2xl text-sm opacity-80">
              {banner.textoApoio}
            </p>
          )}
        </div>
        {banner.textoBotao && (
          <Button type="button" variant="outline" asChild>
            <a href={banner.linkBotao ?? "#"}>{banner.textoBotao}</a>
          </Button>
        )}
      </div>
    </section>
  );
}
