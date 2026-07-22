"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import { buscarCepEnderecoCliente } from "../queries/contexto-cep/buscar-cep-endereco-cliente";

export async function buscarCepEnderecoClienteLogado() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user.id) return null;

  return buscarCepEnderecoCliente(sessao.user.id);
}
