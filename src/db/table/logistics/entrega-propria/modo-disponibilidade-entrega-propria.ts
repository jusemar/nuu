import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Disponibilidade da Entrega Própria em Produto e Categoria.
 *
 * - `herdar`: usa a categoria mais específica configurada; sem configuração,
 *   vale o padrão da loja (Entrega Própria desativada);
 * - `ativado`: o produto/categoria pode oferecer Entrega Própria — as
 *   condições comerciais (preços por destino) e a Agenda Geográfica decidem;
 * - `desativado`: não oferece Entrega Própria.
 *
 * No Produto, `null` significa "registro anterior à herança": o valor é
 * derivado do antigo `allows_own_delivery` (ligado → ativado; desligado →
 * desativado). Assim nada muda sozinho durante o rollout.
 */
export const modoDisponibilidadeEntregaPropriaEnum = pgEnum(
  "modo_disponibilidade_entrega_propria",
  ["herdar", "ativado", "desativado"],
);

export type ModoDisponibilidadeEntregaPropria =
  (typeof modoDisponibilidadeEntregaPropriaEnum.enumValues)[number];
