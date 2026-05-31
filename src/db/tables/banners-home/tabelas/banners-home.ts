import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import {
  bannerHomeDestaqueEnum,
  bannerHomePosicaoEnum,
  bannerHomeTipoEnum,
} from "../enums";

export const bannersHomeTable = pgTable(
  "banners_home",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    posicao: bannerHomePosicaoEnum("posicao").notNull(),
    tipoBanner: bannerHomeTipoEnum("tipo_banner").notNull().default("svg"),
    modeloSvg: text("modelo_svg").notNull(),
    variacaoVisual: text("variacao_visual").notNull().default("azul_ambar"),
    titulo: text("titulo"),
    subtitulo: text("subtitulo"),
    textoApoio: text("texto_apoio"),
    precoChamada: text("preco_chamada"),
    textoBotao: text("texto_botao"),
    linkBotao: text("link_botao"),
    imagemUrl: text("imagem_url"),
    imagemAlt: text("imagem_alt"),
    imagemMobileUrl: text("imagem_mobile_url"),
    focoImagem: text("foco_imagem").notNull().default("center"),
    tamanhoImagem: text("tamanho_imagem").notNull().default("cover"),
    metadataImagem: jsonb("metadata_imagem"),
    tipoDestaque: bannerHomeDestaqueEnum("tipo_destaque")
      .notNull()
      .default("oferta"),
    ativo: boolean("ativo").notNull().default(false),
    ordem: integer("ordem").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("banners_home_posicao_idx").on(table.posicao),
    index("banners_home_ativo_idx").on(table.ativo),
    index("banners_home_ordem_idx").on(table.ordem),
    uniqueIndex("banners_home_um_secundario_ativo_idx")
      .on(table.posicao)
      .where(
        sql`${table.ativo} = true and ${table.posicao} = 'secundario_direito'`,
      ),
  ],
);

export type BannerHome = typeof bannersHomeTable.$inferSelect;
export type NovoBannerHome = typeof bannersHomeTable.$inferInsert;
