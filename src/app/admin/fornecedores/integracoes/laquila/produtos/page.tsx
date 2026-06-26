import { PreviaProdutosLaquilaMock } from "@/features/fornecedores/integracoes/laquila/components/admin/previa-produtos-laquila-mock";
import { listarProdutosRecebidosApiLaquila } from "@/features/fornecedores/integracoes/laquila/queries";

export default async function Page() {
  const resultado = await listarProdutosRecebidosApiLaquila();

  return (
    <PreviaProdutosLaquilaMock
      produtos={resultado.produtos}
      erroRecebidos={resultado.erro}
      totalRetornadoApi={resultado.totalRetornadoApi}
      totalAposRecorte={resultado.totalAposRecorte}
      cacheUsado={resultado.cacheUsado}
      cacheExpiraEm={resultado.cacheExpiraEm}
    />
  );
}
