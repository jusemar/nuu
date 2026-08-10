import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Barra de paginação do admin.
 *
 * Existe porque o projeto não tinha nenhuma: o shadcn `Pagination` nunca foi
 * instalado e o mesmo markup estava reescrito à mão em sete telas, cada uma com
 * um conjunto diferente de opções (4/8/12, 10/20/50, 25/50/100…). Pior: a
 * Vinculação paginava no servidor mas só imprimia "Página 1 de 28" como texto,
 * sem nenhum botão — o gestor nunca conseguiu sair dos 25 primeiros de 685.
 *
 * Server component: navega por `<Link>`, sem estado nem efeito. Quem usa
 * controla os endereços por `montarHref`, o que garante que TODOS os filtros
 * ativos sobrevivam à troca de página.
 */

type PaginacaoAdminProps = {
  pagina: number;
  totalPaginas: number;
  total: number;
  limite: number;
  opcoesLimite: readonly number[];
  /**
   * Monta o endereço preservando os filtros atuais.
   *
   * Trocar o limite volta para a página 1 de propósito: manter a página 12 ao
   * sair de 25 para 100 por página levaria o gestor para um trecho da lista que
   * ele não pediu.
   */
  montarHref: (mudancas: { pagina?: number; limite?: number }) => string;
  /** Plural do que está sendo listado. Ex.: "produtos", "itens". */
  rotuloItens?: string;
};

export function PaginacaoAdmin({
  pagina,
  totalPaginas,
  total,
  limite,
  opcoesLimite,
  montarHref,
  rotuloItens = "itens",
}: PaginacaoAdminProps) {
  const temAnterior = pagina > 1;
  const temProxima = pagina < totalPaginas;
  const primeiroDaPagina = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const ultimoDaPagina = Math.min(pagina * limite, total);

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
    >
      <p className="text-sm text-slate-600">
        {total === 0 ? (
          `Nenhum ${rotuloItens.replace(/s$/, "")} encontrado`
        ) : (
          <>
            <span className="font-medium text-slate-900">
              {primeiroDaPagina}–{ultimoDaPagina}
            </span>{" "}
            de <span className="font-medium text-slate-900">{total}</span>{" "}
            {rotuloItens}
          </>
        )}
      </p>

      <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
        <div className="flex items-center gap-1.5">
          {/* O rótulo some no celular; o seletor sozinho já se explica. */}
          <span className="hidden text-sm text-slate-600 sm:inline">
            Por página
          </span>
          <div className="flex overflow-hidden rounded-md border border-slate-200">
            {opcoesLimite.map((opcao) => (
              <Link
                key={opcao}
                href={montarHref({ limite: opcao, pagina: 1 })}
                aria-current={opcao === limite ? "true" : undefined}
                className={`px-2.5 py-1 text-sm transition ${
                  opcao === limite
                    ? "bg-slate-900 font-medium text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opcao}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/*
            Sem barra de números: com 28 páginas ela estoura a largura no
            celular. Anterior/Próxima e a posição atual bastam, e o
            `min-w-[92px]` impede o texto de pular quando o número muda.
          */}
          {temAnterior ? (
            <Button asChild variant="outline" size="sm" className="h-9 px-2.5">
              <Link
                href={montarHref({ pagina: pagina - 1 })}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:ml-1 sm:inline">Anterior</span>
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              disabled
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:ml-1 sm:inline">Anterior</span>
            </Button>
          )}

          <span className="min-w-[92px] text-center text-sm text-slate-600">
            Página <span className="font-medium text-slate-900">{pagina}</span>{" "}
            de {totalPaginas}
          </span>

          {temProxima ? (
            <Button asChild variant="outline" size="sm" className="h-9 px-2.5">
              <Link
                href={montarHref({ pagina: pagina + 1 })}
                aria-label="Próxima página"
              >
                <span className="hidden sm:mr-1 sm:inline">Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              disabled
              aria-label="Próxima página"
            >
              <span className="hidden sm:mr-1 sm:inline">Próxima</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
