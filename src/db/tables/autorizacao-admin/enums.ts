import { pgEnum } from "drizzle-orm/pg-core";

/** Estados utilizáveis do vínculo que concede acesso ao painel global. */
export const administradorStatusEnum = pgEnum("administrador_status", [
  "ativo",
  "desativado",
]);

/** Funções desativadas deixam de contribuir para a autorização efetiva. */
export const funcaoAdministrativaStatusEnum = pgEnum(
  "funcao_administrativa_status",
  ["ativa", "desativada"],
);

/** Uma permissão desativada nunca deve autorizar uma operação futura. */
export const permissaoAdministrativaStatusEnum = pgEnum(
  "permissao_administrativa_status",
  ["ativa", "desativada"],
);

/** O override explícito tem precedência sobre permissões herdadas de funções. */
export const efeitoPermissaoAdministradorEnum = pgEnum(
  "efeito_permissao_administrador",
  ["permitir", "negar"],
);

/** O convite possui ciclo de vida próprio e não equivale a acesso ativo. */
export const conviteAdministrativoStatusEnum = pgEnum(
  "convite_administrativo_status",
  ["pendente", "aceito", "expirado", "revogado"],
);

/** Resultado mínimo e estável para eventos futuros de segurança. */
export const auditoriaAdministrativaResultadoEnum = pgEnum(
  "auditoria_administrativa_resultado",
  ["sucesso", "negado", "falha"],
);
