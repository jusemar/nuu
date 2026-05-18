import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PaginaCompletarCadastro } from "@/features/autenticacao/components/store/completar-cadastro/pagina-completar-cadastro";
import { protegerFluxoCadastroCliente } from "@/features/autenticacao/queries/cadastro/proteger-fluxo-cadastro-cliente";

export const metadata: Metadata = {
  title: "Completar cadastro",
  description:
    "Complete seus dados cadastrais para compras, entregas e acompanhamento da loja.",
};

export default async function CompletarCadastroPage() {
  const { sessao, cadastro } = await protegerFluxoCadastroCliente({
    permitirCadastroIncompleto: true,
  });

  if (cadastro.completo) {
    redirect("/minha-conta");
  }

  return <PaginaCompletarCadastro sessao={sessao} cadastro={cadastro} />;
}
