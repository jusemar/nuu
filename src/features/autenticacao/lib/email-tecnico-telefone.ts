import { createHmac } from "node:crypto";

import { DOMINIO_EMAIL_TECNICO_TELEFONE } from "./email-tecnico-telefone-compartilhado";

export function criarEmailTecnicoTelefone(telefone: string, segredo: string) {
  const identificador = createHmac("sha256", segredo)
    .update(`email-tecnico:${telefone}`)
    .digest("hex");
  return `conta-${identificador}@${DOMINIO_EMAIL_TECNICO_TELEFONE}`;
}

export { emailEhTecnicoTelefone } from "./email-tecnico-telefone-compartilhado";
