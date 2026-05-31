import { pgEnum } from "drizzle-orm/pg-core";

export const bannerHomePosicaoEnum = pgEnum("banner_home_posicao", [
  "principal_esquerdo",
  "secundario_direito",
]);

export const bannerHomeTipoEnum = pgEnum("banner_home_tipo", ["svg", "imagem"]);

export const bannerHomeDestaqueEnum = pgEnum("banner_home_destaque", [
  "promocao",
  "oferta",
  "lancamento",
  "institucional",
]);
