import type { ModoDisponibilidadeEntregaPropria } from "@/db/table/logistics/entrega-propria/modo-disponibilidade-entrega-propria";

/** Textos de apoio das opções Herdar / Ativado / Desativado da Entrega Própria. */
export const DESCRICOES_MODO_ENTREGA_PROPRIA: Record<
  ModoDisponibilidadeEntregaPropria,
  string
> = {
  herdar: "Usa a configuração superior",
  ativado: "Oferece conforme preços e agenda",
  desativado: "Não oferece Entrega Própria",
};
