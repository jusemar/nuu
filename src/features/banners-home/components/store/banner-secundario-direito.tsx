import { cn } from "@/lib/utils";

import {
  classesVariacaoSecundaria,
  FundoSvgBannerHome,
  normalizarVariacaoVisualBannerHome,
} from "../../lib/modelos-banners-home";
import type { BannerHomeDados } from "../../types/banners-home.types";
import { BannerImagemHome } from "./banner-imagem-home";

type BannerSecundarioDireitoProps = {
  banner: BannerHomeDados;
  className?: string;
  sizes?: string;
};

function separarLinhasApoio(textoApoio: string | null) {
  return (textoApoio ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function BannerSecundarioDireito({
  banner,
  className,
  sizes = "(min-width: 1024px) 300px, calc(100vw - 24px)",
}: BannerSecundarioDireitoProps) {
  const variacao = normalizarVariacaoVisualBannerHome(banner.variacaoVisual);
  const classes = classesVariacaoSecundaria[variacao];
  const linhasApoio = separarLinhasApoio(banner.textoApoio);
  const titulo = banner.titulo ?? "";

  if (banner.tipoBanner === "imagem" && banner.imagemUrl) {
    return (
      <BannerImagemHome
        banner={banner}
        sizes={sizes}
        className={cn(
          "relative block h-full min-h-[220px] overflow-hidden rounded-xl bg-slate-100",
          className,
        )}
      />
    );
  }

  return (
    <aside
      className={cn(
        "relative h-full min-h-[220px] overflow-hidden rounded-xl p-5",
        classes.fundo,
        className,
      )}
      style={{
        background: banner.corFundo ?? undefined,
        color: banner.corTexto ?? undefined,
      }}
    >
      <div className={`pointer-events-none absolute inset-0 ${classes.titulo}`}>
        <FundoSvgBannerHome modelo={banner.modeloSvg} compacto />
      </div>

      <div className="relative z-10">
        {banner.subtitulo && (
          <div
            className={`mb-2 inline-flex w-fit items-center rounded px-2.5 py-1 text-[10px] font-extrabold tracking-[0.1em] uppercase ${classes.selo}`}
            style={{
              backgroundColor: banner.corDestaque ?? undefined,
              color: banner.corTexto ?? undefined,
            }}
          >
            {banner.subtitulo}
          </div>
        )}

        <h3
          className={`font-sora mb-2 text-lg leading-tight font-black whitespace-pre-line ${classes.titulo}`}
          style={{ color: banner.corTexto ?? undefined }}
        >
          {titulo}
        </h3>

        {linhasApoio.length > 0 && (
          <div
            className={`space-y-1.5 text-[11px] ${classes.apoio}`}
            style={{ color: banner.corTexto ?? undefined }}
          >
            {linhasApoio.map((linha) => (
              <p key={linha}>{linha}</p>
            ))}
          </div>
        )}

        {banner.textoBotao && (
          <a
            href={banner.linkBotao ?? "#"}
            className={`mt-4 inline-flex w-fit items-center rounded-md px-3.5 py-2 text-xs font-bold transition-opacity hover:opacity-90 ${classes.botao}`}
            style={{ backgroundColor: banner.corDestaque ?? undefined }}
          >
            {banner.textoBotao}
          </a>
        )}
      </div>
    </aside>
  );
}
