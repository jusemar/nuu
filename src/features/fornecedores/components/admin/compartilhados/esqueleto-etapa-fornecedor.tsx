import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

type EsqueletoEtapaFornecedorProps = {
  /** O que está acontecendo. Ex.: "Abrindo importação". */
  titulo: string;
  /** Uma linha explicando o que está sendo carregado. */
  descricao: string;
  /** Quantas linhas de tabela simular. Padrão 6. */
  linhas?: number;
};

/**
 * Estado de carregamento das etapas do fluxo de fornecedores.
 *
 * É o vocabulário visual único das duas origens: importação por arquivo e
 * integração por API usam este mesmo componente, mudando apenas o texto
 * ("Abrindo importação" × "Buscando dados do fornecedor"). Assim, melhorar o
 * carregamento em um lugar melhora nos dois — que era exatamente o que não
 * acontecia enquanto a API tinha progresso e o arquivo não tinha nada.
 *
 * O desenho imita a página real (cabeçalho, resumo e tabela) em vez de um
 * spinner solto no meio da tela: o gestor reconhece para onde está indo e a
 * troca para o conteúdo real não desloca o layout.
 */
export function EsqueletoEtapaFornecedor({
  titulo,
  descricao,
  linhas = 6,
}: EsqueletoEtapaFornecedorProps) {
  return (
    <div className="space-y-6 p-4 sm:p-6" aria-busy="true" role="status">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {titulo}
        </p>
        <p className="text-sm text-slate-500">{descricao}</p>
      </div>

      {/* Faixa de indicadores: mesma altura dos cards de resumo da tela real. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <Skeleton key={indice} className="h-20 rounded-xl" />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <Skeleton className="h-11 rounded-none" />
        <div className="divide-y divide-slate-100">
          {Array.from({ length: linhas }).map((_, indice) => (
            <div key={indice} className="flex items-center gap-3 p-4">
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
              <Skeleton className="hidden h-4 w-20 md:block" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">{descricao}</span>
    </div>
  );
}
