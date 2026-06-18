import { PreviaProdutosLaquilaMock } from "@/features/fornecedores/integracoes/laquila/components/admin/previa-produtos-laquila-mock";
import {
  buscarConfiguracaoLaquilaAdmin,
  listarProdutosApiStagingLaquilaCatalogo,
} from "@/features/fornecedores/integracoes/laquila/queries";

export default async function Page() {
  const configuracao = await buscarConfiguracaoLaquilaAdmin();
  const produtos = await listarProdutosApiStagingLaquilaCatalogo(
    configuracao?.id,
  );

  return <PreviaProdutosLaquilaMock produtos={produtos} />;
}
