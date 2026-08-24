import { pgEnum } from "drizzle-orm/pg-core";

export const paginaDinamicaStatusEnum = pgEnum("pagina_dinamica_status", [
  "rascunho",
  "publicada",
  "arquivada",
]);

export const grupoNavegacaoLocalEnum = pgEnum("grupo_navegacao_local", [
  "rodape",
]);
