import { notFound } from "next/navigation";

import { PreviaProdutosLaquilaMock } from "@/features/fornecedores/integracoes/laquila/components/admin/previa-produtos-laquila-mock";
import {
  buscarImportacaoApiLaquila,
  enriquecerTriagemProdutosLaquila,
  listarProdutosImportacaoApiLaquilaPaginado,
} from "@/features/fornecedores/integracoes/laquila/queries";

type ProdutosImportacaoLaquilaPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : "";
}

function numeroMonetario(valor: string) {
  if (!valor.trim()) return null;
  const numero = Number(valor.replace(",", "."));
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

function opcaoPermitida<T extends string>(
  valor: string,
  opcoes: readonly T[],
  fallback: T,
): T {
  return opcoes.includes(valor as T) ? (valor as T) : fallback;
}

/**
 * Produtos recebidos por UMA execução da API.
 *
 * Nenhuma chamada à Laquila acontece aqui: a página lê o staging que a
 * sincronização gravou. É isto que faz a retomada — reabrir amanhã mostra o
 * mesmo retrato e as mesmas decisões, sem recontatar o fornecedor.
 */
export default async function Page({
  params,
  searchParams,
}: ProdutosImportacaoLaquilaPageProps) {
  const { id } = await params;
  const parametros = await searchParams;
  const importacao = await buscarImportacaoApiLaquila(id);

  if (!importacao) notFound();

  const filtros = {
    busca: texto(parametros.busca),
    estoque: opcaoPermitida(
      texto(parametros.estoque),
      ["todos", "com", "sem"] as const,
      "todos",
    ),
    precoMinimo: numeroMonetario(texto(parametros.precoMinimo)),
    precoMaximo: numeroMonetario(texto(parametros.precoMaximo)),
    grupo: texto(parametros.grupo),
    subgrupo: texto(parametros.subgrupo),
    marca: texto(parametros.marca),
    situacao: opcaoPermitida(
      texto(parametros.situacao),
      ["", "novo", "vinculado", "atencao", "ignorado"] as const,
      "",
    ),
    ordem: opcaoPermitida(
      texto(parametros.ordem),
      [
        "recentes",
        "antigos",
        "preco-asc",
        "preco-desc",
        "estoque-asc",
        "estoque-desc",
        "nome-asc",
        "nome-desc",
      ] as const,
      "recentes",
    ),
    pagina: texto(parametros.pagina),
    limite: texto(parametros.limite),
  };
  const resultado = await listarProdutosImportacaoApiLaquilaPaginado(
    importacao,
    filtros,
  );
  const produtosComTriagem = await enriquecerTriagemProdutosLaquila(
    resultado.produtos,
  );

  return (
    <PreviaProdutosLaquilaMock
      importacaoId={importacao.id}
      produtos={produtosComTriagem}
      totalRetornadoApi={importacao.totalLinhas}
      totalAposRecorte={resultado.paginacao.total}
      consultadoEm={produtosComTriagem[0]?.recebidoEm?.toISOString()}
      filtrosServidor={filtros}
      opcoesFiltros={resultado.opcoes}
      paginacaoServidor={resultado.paginacao}
    />
  );
}
