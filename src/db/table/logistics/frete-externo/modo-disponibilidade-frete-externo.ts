import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Disponibilidade do Frete Externo (Frenet/transportadoras) em Produto e
 * Categoria. Três estados, e não um boolean, para representar a herança:
 *
 * - `herdar`: usa a categoria mais específica configurada e depois o padrão
 *   da loja (Frete Externo ativado);
 * - `ativado`: o Frete Externo pode participar e segue as regras logísticas
 *   existentes (produto, classificação, categoria, catálogo e limites);
 * - `desativado`: o Frete Externo normal da loja não participa.
 *
 * Precedência: Produto > Categoria mais específica > ancestrais > padrão.
 */
export const modoDisponibilidadeFreteExternoEnum = pgEnum(
  "modo_disponibilidade_frete_externo",
  ["herdar", "ativado", "desativado"],
);

export type ModoDisponibilidadeFreteExterno =
  (typeof modoDisponibilidadeFreteExternoEnum.enumValues)[number];
