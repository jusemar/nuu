import type {
  ModeloSvgBannerHome,
  PosicaoBannerHome,
  TipoBannerHome,
  TipoDestaqueBannerHome,
  VariacaoVisualBannerHome,
} from "../types/banners-home.types";

export const POSICOES_BANNER_HOME: Array<{
  valor: PosicaoBannerHome;
  rotulo: string;
  descricao: string;
}> = [
  {
    valor: "principal_esquerdo",
    rotulo: "Banner principal",
    descricao:
      "Maior área de destaque da Home, ideal para campanhas principais.",
  },
  {
    valor: "secundario_direito",
    rotulo: "Banner complementar superior",
    descricao:
      "Área menor, ideal para ofertas rápidas, cupons ou chamadas complementares.",
  },
  {
    valor: "novidades_secundario_esquerdo",
    rotulo: "Banner secundário esquerdo",
    descricao: "Primeiro banner menor, ao lado da seção Novidades.",
  },
  {
    valor: "novidades_secundario_direito",
    rotulo: "Banner secundário direito",
    descricao: "Segundo banner menor, ao lado da seção Novidades.",
  },
  {
    valor: "produto_institucional",
    rotulo: "Banner institucional PDP",
    descricao: "Campanha institucional exibida na página de produto.",
  },
];

export const TIPOS_DESTAQUE_BANNER_HOME: Array<{
  valor: TipoDestaqueBannerHome;
  rotulo: string;
}> = [
  { valor: "promocao", rotulo: "Promoção" },
  { valor: "oferta", rotulo: "Oferta" },
  { valor: "lancamento", rotulo: "Lançamento" },
  { valor: "institucional", rotulo: "Institucional" },
  { valor: "informativo", rotulo: "Informativo" },
  { valor: "minimalista", rotulo: "Minimalista" },
];

export const TIPOS_BANNER_HOME: Array<{
  valor: TipoBannerHome;
  rotulo: string;
  descricao: string;
}> = [
  {
    valor: "svg",
    rotulo: "SVG editável",
    descricao: "Ideal para campanhas com textos, botões e variações visuais.",
  },
  {
    valor: "imagem",
    rotulo: "Imagem enviada",
    descricao: "Ideal para artes prontas de campanhas promocionais.",
  },
];

export const MODELOS_SVG_BANNER_HOME: Array<{
  valor: ModeloSvgBannerHome;
  rotulo: string;
}> = [
  { valor: "ondas_comerciais", rotulo: "Ondas comerciais" },
  { valor: "formas_promocionais", rotulo: "Formas promocionais" },
  { valor: "linhas_institucionais", rotulo: "Linhas institucionais" },
];

export const VARIACOES_VISUAIS_BANNER_HOME: Array<{
  valor: VariacaoVisualBannerHome;
  rotulo: string;
}> = [
  { valor: "azul_ambar", rotulo: "Azul e âmbar" },
  { valor: "verde", rotulo: "Verde" },
  { valor: "grafite", rotulo: "Grafite" },
];

export const ROTULOS_POSICAO_BANNER_HOME = Object.fromEntries(
  POSICOES_BANNER_HOME.map((posicao) => [posicao.valor, posicao.rotulo]),
) as Record<PosicaoBannerHome, string>;

export const ROTULOS_TIPO_DESTAQUE_BANNER_HOME = Object.fromEntries(
  TIPOS_DESTAQUE_BANNER_HOME.map((tipo) => [tipo.valor, tipo.rotulo]),
) as Record<TipoDestaqueBannerHome, string>;

export const REGRAS_IMAGEM_BANNER_HOME = {
  formatos: ["image/jpeg", "image/png", "image/webp"],
  extensoes: [".jpg", ".jpeg", ".png", ".webp"],
  tamanhoMaximoBytes: 5 * 1024 * 1024,
  posicoes: {
    principal_esquerdo: {
      larguraRecomendada: 1600,
      alturaRecomendada: 520,
      larguraMinima: 760,
      alturaMinima: 220,
      proporcaoRecomendadaMinima: 2.2,
      proporcaoRecomendadaMaxima: 5.8,
      texto:
        "Use uma imagem horizontal com pelo menos 760px de largura e 220px de altura. Banners widescreen funcionam melhor.",
    },
    secundario_direito: {
      larguraRecomendada: 900,
      alturaRecomendada: 520,
      larguraMinima: 300,
      alturaMinima: 220,
      proporcaoRecomendadaMinima: 1.1,
      proporcaoRecomendadaMaxima: 3.4,
      texto:
        "Use uma imagem horizontal com pelo menos 300px de largura e 220px de altura.",
    },
    novidades_secundario_esquerdo: {
      larguraRecomendada: 900,
      alturaRecomendada: 420,
      larguraMinima: 300,
      alturaMinima: 150,
      proporcaoRecomendadaMinima: 1.1,
      proporcaoRecomendadaMaxima: 4,
      texto:
        "Use uma imagem horizontal com pelo menos 300px de largura e 150px de altura.",
    },
    novidades_secundario_direito: {
      larguraRecomendada: 900,
      alturaRecomendada: 420,
      larguraMinima: 300,
      alturaMinima: 150,
      proporcaoRecomendadaMinima: 1.1,
      proporcaoRecomendadaMaxima: 4,
      texto:
        "Use uma imagem horizontal com pelo menos 300px de largura e 150px de altura.",
    },
    produto_institucional: {
      larguraRecomendada: 1400,
      alturaRecomendada: 360,
      larguraMinima: 640,
      alturaMinima: 180,
      proporcaoRecomendadaMinima: 2.2,
      proporcaoRecomendadaMaxima: 6,
      texto:
        "Use uma imagem horizontal com pelo menos 640px de largura e 180px de altura.",
    },
  },
} as const;
