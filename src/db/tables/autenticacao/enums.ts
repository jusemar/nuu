import { pgEnum } from "drizzle-orm/pg-core";

export const clienteTipoPessoaEnum = pgEnum("cliente_tipo_pessoa", [
  "fisica",
  "juridica",
]);
