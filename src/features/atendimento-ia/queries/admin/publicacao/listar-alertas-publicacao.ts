import "server-only";

import { buscarElegibilidadePublicacaoAdmin } from "./buscar-elegibilidade-publicacao";
export async function listarAlertasPublicacaoAdmin(entrada: unknown) {
  return (await buscarElegibilidadePublicacaoAdmin(entrada)).alertas;
}
