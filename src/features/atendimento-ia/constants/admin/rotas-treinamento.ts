/**
 * Rotas administrativas identificadas por nomes estáveis. Este módulo não é
 * client nem server-only para poder ser compartilhado sem atravessar uma
 * fronteira React Server Components.
 */
export const ROTAS_TREINAMENTO_ADMIN_POR_ID = {
  conhecimentos: "/admin/atendente-ia/treinamento/conhecimentos",
  metricas: "/admin/atendente-ia/treinamento/metricas",
  revisoes: "/admin/atendente-ia/treinamento/revisoes",
  testes: "/admin/atendente-ia/treinamento/testes",
  visaoGeral: "/admin/atendente-ia/treinamento",
} as const;

export const ROTAS_TREINAMENTO_ADMIN = [
  {
    href: ROTAS_TREINAMENTO_ADMIN_POR_ID.visaoGeral,
    id: "visaoGeral",
    rotulo: "Visão geral",
  },
  {
    href: ROTAS_TREINAMENTO_ADMIN_POR_ID.conhecimentos,
    id: "conhecimentos",
    rotulo: "Conhecimentos",
  },
  {
    href: ROTAS_TREINAMENTO_ADMIN_POR_ID.revisoes,
    id: "revisoes",
    rotulo: "Revisões",
  },
  {
    href: ROTAS_TREINAMENTO_ADMIN_POR_ID.testes,
    id: "testes",
    rotulo: "Testes",
  },
  {
    href: ROTAS_TREINAMENTO_ADMIN_POR_ID.metricas,
    id: "metricas",
    rotulo: "Métricas",
  },
] as const;

export type IdRotaTreinamentoAdmin =
  (typeof ROTAS_TREINAMENTO_ADMIN)[number]["id"];
