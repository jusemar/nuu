import { PreviaProdutosLaquilaMock } from "@/features/fornecedores/integracoes/laquila/components/admin/previa-produtos-laquila-mock";
import { listarProdutosRecebidosApiLaquila } from "@/features/fornecedores/integracoes/laquila/queries";

type ProdutosLaquilaPageProps = {
  searchParams?: Promise<{
    atualizar?: string | string[];
  }>;
};

function obterParametroUnico(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function Page({ searchParams }: ProdutosLaquilaPageProps) {
  const parametros = await searchParams;
  const atualizacaoForcada = obterParametroUnico(parametros?.atualizar) === "1";
  const resultado = await listarProdutosRecebidosApiLaquila({
    ignorarCache: atualizacaoForcada,
  });

  return (
    <PreviaProdutosLaquilaMock
      produtos={resultado.produtos}
      erroRecebidos={resultado.erro}
      tipoErroRecebidos={resultado.tipoErro}
      totalRetornadoApi={resultado.totalRetornadoApi}
      totalAposRecorte={resultado.totalAposRecorte}
      cacheUsado={resultado.cacheUsado}
      cacheExpiraEm={resultado.cacheExpiraEm}
      consultadoEm={resultado.consultadoEm}
      origemDados={resultado.origemDados}
      avisoRecebidos={resultado.avisoRecebidos}
      atualizacaoForcada={atualizacaoForcada}
    />
  );
}
