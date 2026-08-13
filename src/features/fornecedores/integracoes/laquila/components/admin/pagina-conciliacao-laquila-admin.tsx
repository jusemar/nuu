import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AbaConciliacaoImportacaoFornecedor } from "@/features/fornecedores/components/admin/aba-conciliacao-importacao-fornecedor";
import { PassosFluxoFornecedor } from "@/features/fornecedores/components/admin/compartilhados/passos-fluxo-fornecedor";
import type { OpcaoValorPadraoLoja } from "@/features/fornecedores/components/admin/tabela-mapeamento-campos-fornecedor";
import type { PaginacaoFornecedores } from "@/features/fornecedores/lib/paginacao-fornecedores";
import type {
  FiltroConciliacaoFornecedor,
  RascunhoImportacaoFornecedor,
  ResumoConciliacaoFornecedor,
} from "@/features/fornecedores/queries/listar-rascunhos-importacao-fornecedor";

type PaginaConciliacaoLaquilaAdminProps = {
  importacaoId: string;
  fornecedor: string;
  rascunhos: RascunhoImportacaoFornecedor[];
  sessaoAtiva: boolean;
  categoriasLoja: OpcaoValorPadraoLoja[];
  marcasLoja: Array<{ id: string; nome: string }>;
  paginacao: PaginacaoFornecedores;
  busca: string;
  filtro: FiltroConciliacaoFornecedor;
  resumo: ResumoConciliacaoFornecedor;
};

/**
 * Conciliação da API — a MESMA da importação por arquivo.
 *
 * Antes existia aqui uma conversão própria de rascunho para item de
 * conciliação, paralela à do arquivo: só ela explicava por que a API não
 * mostrava "Fornecedor × Loja atual × A publicar" para produto já vinculado.
 * Depois da aquisição as duas origens são o mesmo processo, então esta tela
 * agora só acrescenta o contexto da Laquila (stepper e navegação) em volta da
 * aba compartilhada.
 */
export function PaginaConciliacaoLaquilaAdmin({
  importacaoId,
  fornecedor,
  rascunhos,
  sessaoAtiva,
  categoriasLoja,
  marcasLoja,
  paginacao,
  busca,
  filtro,
  resumo,
}: PaginaConciliacaoLaquilaAdminProps) {
  const hrefVinculos = `/admin/fornecedores/integracoes/laquila/importacoes/${importacaoId}/vinculos`;

  return (
    <main className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 px-px py-4 sm:p-6">
      <PassosFluxoFornecedor
        passoAtual="Conciliação"
        origem={{ tipo: "api", provedor: "Laquila" }}
        rotuloAquisicao="Buscar dados"
        fornecedor={fornecedor}
      />

      {!sessaoAtiva ? (
        <section className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Sessão administrativa inativa
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Entre novamente para ajustar os itens desta importação.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="bg-white">
            <Link
              href={`/admin/login?redirect=/admin/fornecedores/integracoes/laquila/importacoes/${importacaoId}/conciliacao&erro=sessao_expirada`}
            >
              Entrar novamente
            </Link>
          </Button>
        </section>
      ) : null}

      {resumo.todos === 0 ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="mt-0.5 h-fit rounded-md bg-amber-100 p-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-amber-950">
                  Nada pendente na conciliação desta importação.
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-amber-800">
                  Itens publicados e ignorados saem da fila e continuam no
                  histórico. Volte para a Vinculação para trazer mais produtos
                  desta execução.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" className="bg-white">
              <Link href={hrefVinculos}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Vinculação
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <AbaConciliacaoImportacaoFornecedor
          importacaoId={importacaoId}
          fornecedor={fornecedor}
          rascunhos={rascunhos}
          categoriasLoja={categoriasLoja}
          marcasLoja={marcasLoja}
          tipoOrigem="api"
          paginacao={paginacao}
          resumo={resumo}
          filtro={filtro}
          busca={busca}
          navegacaoFiltros={{
            hrefAtual: `/admin/fornecedores/integracoes/laquila/importacoes/${importacaoId}/conciliacao?${new URLSearchParams(
              {
                pagina: String(paginacao.pagina),
                limite: String(paginacao.limite),
                ...(busca ? { busca } : {}),
                ...(filtro !== "todos" ? { filtro } : {}),
              },
            ).toString()}`,
            parametroPagina: "pagina",
            parametroBusca: "busca",
            parametroFiltro: "filtro",
          }}
          montarHrefPagina={(mudancas) => {
            const parametros = new URLSearchParams();
            parametros.set(
              "pagina",
              String(mudancas.pagina ?? paginacao.pagina),
            );
            parametros.set(
              "limite",
              String(mudancas.limite ?? paginacao.limite),
            );
            if (busca) parametros.set("busca", busca);
            if (filtro !== "todos") parametros.set("filtro", filtro);
            return `/admin/fornecedores/integracoes/laquila/importacoes/${importacaoId}/conciliacao?${parametros.toString()}`;
          }}
          hrefVoltar={hrefVinculos}
          hrefProximaEtapa={`/admin/fornecedores/integracoes/laquila/importacoes/${importacaoId}/publicacao`}
        />
      )}
    </main>
  );
}
