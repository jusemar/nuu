import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import { mapearSessaoCliente } from "../../lib/mapear-sessao-cliente";

export async function buscarSessaoCliente() {
  const sessao = await auth.api.getSession({
    headers: await headers(),
  });

  return mapearSessaoCliente(sessao);
}
