import { pgEnum } from "drizzle-orm/pg-core";

export const precificacaoTipoRegraPromocionalEnum = pgEnum(
  "precificacao_tipo_regra_promocional",
  ["percentual_desconto", "valor_fixo_desconto", "preco_fixo"],
);

export const precificacaoAlvoRegraPromocionalEnum = pgEnum(
  "precificacao_alvo_regra_promocional",
  ["global", "produto", "categoria"],
);
