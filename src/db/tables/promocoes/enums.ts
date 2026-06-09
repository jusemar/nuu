import { pgEnum } from "drizzle-orm/pg-core";

export const promocaoTipoDescontoEnum = pgEnum("promocao_tipo_desconto", [
  "percentual",
  "valor_fixo",
]);

export const promocaoStatusEnum = pgEnum("promocao_status", [
  "ativa",
  "inativa",
  "agendada",
  "encerrada",
]);

export const promocaoTipoCampanhaEnum = pgEnum("promocao_tipo_campanha", [
  "normal",
  "relampago",
]);

export const promocaoTipoBeneficioEnum = pgEnum("promocao_tipo_beneficio", [
  "desconto",
  "frete_gratis",
]);
