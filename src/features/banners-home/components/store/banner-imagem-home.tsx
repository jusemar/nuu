import Image from "next/image";

import {
  obterPosicaoObjetoImagemBannerHome,
  obterTamanhoObjetoImagemBannerHome,
} from "../../lib/estilos-imagem-banner-home";
import type { BannerHomeDados } from "../../types/banners-home.types";

type BannerImagemHomeProps = {
  banner: BannerHomeDados;
  className: string;
  prioridade?: boolean;
  sizes: string;
};

export function BannerImagemHome({
  banner,
  className,
  prioridade = false,
  sizes,
}: BannerImagemHomeProps) {
  if (!banner.imagemUrl) return null;
  const titulo = banner.titulo ?? "Banner da Home";

  const imagem = (
    <Image
      src={banner.imagemUrl}
      alt={banner.imagemAlt ?? titulo}
      fill
      priority={prioridade}
      loading={prioridade ? undefined : "lazy"}
      sizes={sizes}
      className="h-full w-full"
      style={{
        objectFit: obterTamanhoObjetoImagemBannerHome(banner.tamanhoImagem),
        objectPosition: obterPosicaoObjetoImagemBannerHome(banner.focoImagem),
      }}
    />
  );

  if (!banner.linkBotao) {
    return (
      <div className={className}>
        {imagem}
        <span className="sr-only">{titulo}</span>
      </div>
    );
  }

  return (
    <a href={banner.linkBotao} className={className} aria-label={titulo}>
      {imagem}
    </a>
  );
}
