import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PaginaCompletarCadastro } from "@/features/autenticacao/components/store/completar-cadastro/pagina-completar-cadastro";
import { protegerFluxoCadastroCliente } from "@/features/autenticacao/queries/cadastro/proteger-fluxo-cadastro-cliente";

export const metadata: Metadata = {
  title: "Completar cadastro",
  description:
    "Complete seus dados cadastrais para compras, entregas e acompanhamento da loja.",
};

export default async function CompletarCadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  const { destino } = await searchParams;
  const { sessao, cadastro } = await protegerFluxoCadastroCliente({
    permitirCadastroIncompleto: true,
  });

  if (cadastro.completo) {
    const { normalizarDestinoAutenticacao } = await import(
      "@/features/autenticacao/lib/destino-autenticacao-cliente"
    );
    redirect(normalizarDestinoAutenticacao(destino));
  }

  return (
    <PaginaCompletarCadastro
      sessao={sessao}
      cadastro={cadastro}
      destino={destino}
    />
  );
}
