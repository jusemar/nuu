"use client";

import { PaginaPublicacaoFornecedorAdmin } from "@/features/fornecedores/components/admin/pagina-publicacao-fornecedor-admin";
import { publicarProdutosLaquila } from "@/features/fornecedores/integracoes/laquila/actions";
import type { RascunhoPublicacaoLaquila } from "@/features/fornecedores/integracoes/laquila/queries";

type PaginaPublicacaoLaquilaAdminProps = {
  rascunhosIniciais: RascunhoPublicacaoLaquila[];
  sessaoAtiva: boolean;
};

export function PaginaPublicacaoLaquilaAdmin({
  rascunhosIniciais,
  sessaoAtiva,
}: PaginaPublicacaoLaquilaAdminProps) {
  return (
    <PaginaPublicacaoFornecedorAdmin
      titulo="Publicação — Laquila"
      subtitulo="Revise e confirme os produtos que entrarão no catálogo da loja."
      hrefVoltar="/admin/fornecedores/integracoes/laquila/conciliacao"
      rascunhosIniciais={rascunhosIniciais}
      sessaoAtiva={sessaoAtiva}
      acaoPublicar={publicarProdutosLaquila}
    />
  );
}
