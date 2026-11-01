import { notFound } from "next/navigation";

import { PrevisualizacaoJaaa } from "@/features/fornecedores/components/admin/jaaa/previsualizacao-jaaa";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Revisão visual — Atendimento Jaaa",
  robots: { index: false, follow: false },
};
/** Prévia fictícia acessível somente no desenvolvimento local; nunca em produção. */
export default function Pagina() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.NOOO_BANCO !== "local"
  )
    notFound();
  return <PrevisualizacaoJaaa />;
}
