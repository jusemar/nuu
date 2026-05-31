import type { BannerHome } from "@/db/schema";

export type PosicaoBannerHome = "principal_esquerdo" | "secundario_direito";
export type TipoBannerHome = "svg" | "imagem";
export type TipoDestaqueBannerHome =
  | "promocao"
  | "oferta"
  | "lancamento"
  | "institucional";
export type ModeloSvgBannerHome =
  | "ondas_comerciais"
  | "formas_promocionais"
  | "linhas_institucionais";
export type VariacaoVisualBannerHome = "azul_ambar" | "verde" | "grafite";
export type FocoImagemBannerHome =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right";
export type TamanhoImagemBannerHome = "cover" | "contain";

export type MetadataImagemBannerHome = {
  largura: number;
  altura: number;
  proporcao: number;
  tamanhoBytes: number;
  tipoArquivo: string;
  nomeArquivo: string;
};

export type BannerHomeDados = BannerHome;

export type BannersHomeAtivos = {
  principalEsquerdo: BannerHomeDados[];
  secundarioDireito: BannerHomeDados | null;
};
