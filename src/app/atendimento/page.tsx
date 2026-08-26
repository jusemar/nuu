import type { Metadata } from "next";

import { Footer } from "@/components/common/footer";
import { PaginaAtendimento } from "@/features/atendimento-ia";
import { DADOS_EMPRESA } from "@/features/configuracoes-loja/constants/dados-empresa";

export const metadata: Metadata = {
  title: "Atendente IA",
  description: `Converse com o Atendente IA da ${DADOS_EMPRESA.marca}.`,
};

export default function AtendimentoPage() {
  return <PaginaAtendimento rodape={<Footer />} />;
}
