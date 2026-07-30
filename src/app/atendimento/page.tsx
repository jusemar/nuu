import type { Metadata } from "next";

import { PaginaAtendimento } from "@/features/atendimento-ia";

export const metadata: Metadata = {
  title: "Atendente IA",
  description: "Converse com o Atendente IA da Do Rocha.",
};

export default function AtendimentoPage() {
  return <PaginaAtendimento />;
}
