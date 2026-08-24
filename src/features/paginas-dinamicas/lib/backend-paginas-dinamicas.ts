import "server-only";

import { buscarSessaoAdmin } from "@/features/autenticacao/queries/sessao/buscar-sessao-admin";

export async function exigirAdministradorPaginasDinamicas() {
  const resultado = await buscarSessaoAdmin();
  if (!resultado.autorizado || !resultado.sessao)
    throw new Error("NAO_AUTORIZADO");
  return resultado.sessao;
}

export function ehViolacaoUnicidade(erro: unknown) {
  return (
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro &&
    erro.code === "23505"
  );
}
