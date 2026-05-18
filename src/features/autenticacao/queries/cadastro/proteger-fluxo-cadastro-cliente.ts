import "server-only";

import { redirect } from "next/navigation";

import { buscarCadastroClientePorUsuarioId } from "./buscar-cadastro-cliente";
import { buscarSessaoCliente } from "../sessao/buscar-sessao-cliente";

type ProtegerFluxoCadastroClienteOptions = {
  destinoLogin?: string;
  permitirCadastroIncompleto?: boolean;
};

export async function protegerFluxoCadastroCliente({
  destinoLogin = "/?login=necessario",
  permitirCadastroIncompleto = false,
}: ProtegerFluxoCadastroClienteOptions = {}) {
  const sessao = await buscarSessaoCliente();

  if (!sessao) {
    redirect(destinoLogin);
  }

  const cadastro = await buscarCadastroClientePorUsuarioId(sessao.usuario.id);

  if (!permitirCadastroIncompleto && !cadastro.completo) {
    redirect("/completar-cadastro");
  }

  return {
    sessao,
    cadastro,
  };
}
