import { PaginaVinculosLaquilaAdmin } from "@/features/fornecedores/integracoes/laquila/components/admin";
import { buscarSessaoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";
import {
  listarRascunhosConciliacaoLaquila,
  listarVinculosProdutosLaquila,
} from "@/features/fornecedores/integracoes/laquila/queries";

export default async function Page() {
  const [rascunhos, vinculos, sessao] = await Promise.all([
    listarRascunhosConciliacaoLaquila(),
    listarVinculosProdutosLaquila(),
    buscarSessaoFornecedoresAdmin(),
  ]);

  return (
    <PaginaVinculosLaquilaAdmin
      rascunhosIniciais={rascunhos}
      fornecedorId={vinculos.fornecedorId}
      vinculosIniciais={vinculos.vinculos}
      sessaoAtiva={Boolean(sessao?.user)}
    />
  );
}
