import type { Metadata } from "next";

import { DADOS_EMPRESA } from "@/features/configuracoes-loja/constants/dados-empresa";
import { PaginaContato } from "@/features/contato/components/store/pagina-contato";
import { montarUrlAbsoluta } from "@/lib/seo/url-site";

const titulo = "Fale conosco";
const tituloCompleto = `${titulo} | ${DADOS_EMPRESA.marca}`;
const descricao =
  "Fale com a Nooo pelo Atendente IA, WhatsApp ou e-mail e encontre ajuda para pedidos, entregas e produtos.";

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  alternates: { canonical: montarUrlAbsoluta("/contato") },
  openGraph: {
    type: "website",
    title: tituloCompleto,
    description: descricao,
    url: montarUrlAbsoluta("/contato"),
  },
};

export default function ContatoPage() {
  return <PaginaContato />;
}
