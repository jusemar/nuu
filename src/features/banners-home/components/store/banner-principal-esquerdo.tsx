import type { BannerHomeDados } from "../../types/banners-home.types";
import {
  classesVariacaoPrincipal,
  FundoSvgBannerHome,
  normalizarVariacaoVisualBannerHome,
} from "../../lib/modelos-banners-home";
import { BannerImagemHome } from "./banner-imagem-home";

type BannerPrincipalEsquerdoProps = {
  banner: BannerHomeDados;
  prioridadeImagem?: boolean;
};

function separarItensApoio(textoApoio: string | null) {
  return (textoApoio ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function BannerPrincipalEsquerdo({
  banner,
  prioridadeImagem = false,
}: BannerPrincipalEsquerdoProps) {
  const variacao = normalizarVariacaoVisualBannerHome(banner.variacaoVisual);
  const classes = classesVariacaoPrincipal[variacao];
  const itensApoio = separarItensApoio(banner.textoApoio);
  const titulo = banner.titulo ?? "";

  if (banner.tipoBanner === "imagem" && banner.imagemUrl) {
    return (
      <BannerImagemHome
        banner={banner}
        prioridade={prioridadeImagem}
        sizes="(min-width: 1024px) calc(100vw - 348px), calc(100vw - 24px)"
        className="relative block h-full min-h-[220px] overflow-hidden rounded-xl bg-slate-100"
      />
    );
  }

  return (
    <div
      className={`relative h-full min-h-[220px] overflow-hidden rounded-xl ${classes.fundo}`}
    >
      <div className="pointer-events-none absolute inset-0 text-white">
        <FundoSvgBannerHome modelo={banner.modeloSvg} />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-center px-5 py-4 md:px-8">
        {banner.subtitulo && (
          <div
            className={`mb-2 inline-flex w-fit items-center rounded px-2.5 py-1 text-[10px] font-extrabold tracking-[0.1em] uppercase ${classes.selo}`}
          >
            {banner.subtitulo}
          </div>
        )}

        <h2
          className={`font-sora mb-1 text-2xl leading-tight font-black md:text-[28px] ${classes.titulo}`}
        >
          {titulo}
        </h2>

        {banner.precoChamada && (
          <div className="mb-2 flex items-end gap-2">
            <span
              className={`font-sora text-2xl leading-none font-black md:text-3xl ${classes.preco}`}
            >
              {banner.precoChamada}
            </span>
          </div>
        )}

        {itensApoio.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {itensApoio.map((item) => (
              <span
                key={item}
                className={`rounded border px-2 py-1 text-[10px] font-bold ${classes.detalhe}`}
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {banner.textoBotao && (
          <a
            href={banner.linkBotao ?? "#"}
            className={`inline-flex w-fit items-center rounded-md px-4 py-2 text-sm font-bold transition-opacity hover:opacity-90 ${classes.botao}`}
          >
            {banner.textoBotao}
          </a>
        )}
      </div>
    </div>
  );
}
