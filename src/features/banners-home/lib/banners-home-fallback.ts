import type { BannerHomeDados } from "../types/banners-home.types";

const dataFallback = new Date(0);

export const bannerHomePrincipalFallback: BannerHomeDados = {
  id: "fallback-principal-home",
  posicao: "principal_esquerdo",
  tipoBanner: "svg",
  modeloSvg: "ondas_comerciais",
  variacaoVisual: "azul_ambar",
  titulo: "Nome do produto aqui",
  subtitulo: "Oferta especial",
  textoApoio: "Frete gratis|12x sem juros|Entrega hoje",
  precoChamada: "R$ 399,00",
  textoBotao: "Comprar agora",
  linkBotao: "#",
  imagemUrl: null,
  imagemAlt: null,
  imagemMobileUrl: null,
  focoImagem: "center",
  tamanhoImagem: "cover",
  metadataImagem: null,
  tipoDestaque: "oferta",
  ativo: true,
  ordem: 0,
  createdAt: dataFallback,
  updatedAt: dataFallback,
};

export const bannerHomeSecundarioFallback: BannerHomeDados = {
  id: "fallback-secundario-home",
  posicao: "secundario_direito",
  tipoBanner: "svg",
  modeloSvg: "formas_promocionais",
  variacaoVisual: "verde",
  titulo: "Como participar\ndo sorteio",
  subtitulo: "Participe",
  textoApoio:
    "1. Faça uma compra acima de R$ 150|2. Cadastre seu cupom no site|3. Aguarde o sorteio dia 30/08",
  precoChamada: null,
  textoBotao: "Saiba mais",
  linkBotao: "#",
  imagemUrl: null,
  imagemAlt: null,
  imagemMobileUrl: null,
  focoImagem: "center",
  tamanhoImagem: "cover",
  metadataImagem: null,
  tipoDestaque: "institucional",
  ativo: true,
  ordem: 0,
  createdAt: dataFallback,
  updatedAt: dataFallback,
};
