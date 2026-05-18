import { redirect } from "next/navigation";

import { PaginaMinhaConta } from "@/features/autenticacao/components/store/minha-conta/pagina-minha-conta";
import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";

export default async function MinhaContaPage() {
  const sessao = await buscarSessaoCliente();

  if (!sessao) {
    redirect("/?login=necessario");
  }

  return <PaginaMinhaConta sessao={sessao} />;
}
