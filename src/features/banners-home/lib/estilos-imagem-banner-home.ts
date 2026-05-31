import type {
  FocoImagemBannerHome,
  TamanhoImagemBannerHome,
} from "../types/banners-home.types";

export function obterPosicaoObjetoImagemBannerHome(
  focoImagem: string | null,
): FocoImagemBannerHome {
  const focosValidos: FocoImagemBannerHome[] = [
    "center",
    "top",
    "bottom",
    "left",
    "right",
  ];

  if (focosValidos.includes(focoImagem as FocoImagemBannerHome)) {
    return focoImagem as FocoImagemBannerHome;
  }

  return "center";
}

export function obterTamanhoObjetoImagemBannerHome(
  tamanhoImagem: string | null,
): TamanhoImagemBannerHome {
  return tamanhoImagem === "contain" ? "contain" : "cover";
}
