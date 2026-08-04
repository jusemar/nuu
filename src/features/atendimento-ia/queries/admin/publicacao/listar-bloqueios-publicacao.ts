import "server-only";

import { buscarElegibilidadePublicacaoAdmin } from "./buscar-elegibilidade-publicacao";
export async function listarBloqueiosPublicacaoAdmin(entrada: unknown) {
  return (await buscarElegibilidadePublicacaoAdmin(entrada)).bloqueios;
}
