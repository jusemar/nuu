import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ItemPaginacao = number | "reticencias-inicio" | "reticencias-fim";

function montarPaginasVisiveis(
  pagina: number,
  totalPaginas: number,
): ItemPaginacao[] {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, indice) => indice + 1);
  }

  const paginas = new Set([1, totalPaginas, pagina - 1, pagina, pagina + 1]);
  const ordenadas = [...paginas]
    .filter((item) => item >= 1 && item <= totalPaginas)
    .sort((a, b) => a - b);
  const resultado: ItemPaginacao[] = [];

  ordenadas.forEach((item, indice) => {
    const anterior = ordenadas[indice - 1];
    if (anterior && item - anterior > 1) {
      resultado.push(indice === 1 ? "reticencias-inicio" : "reticencias-fim");
    }
    resultado.push(item);
  });

  return resultado;
}

type Props = {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  aoMudarPagina: (pagina: number) => void;
  aoMudarPorPagina: (quantidade: number) => void;
};

export function PaginacaoCategoriasFidelidade({
  pagina,
  totalPaginas,
  total,
  porPagina,
  aoMudarPagina,
  aoMudarPorPagina,
}: Props) {
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);
  const paginas = montarPaginasVisiveis(pagina, totalPaginas);

  return (
    <footer className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-muted-foreground text-sm" aria-live="polite">
        Mostrando{" "}
        <span className="text-foreground font-medium">
          {inicio}–{fim}
        </span>{" "}
        de <span className="text-foreground font-medium">{total}</span>{" "}
        categorias
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
        <Select
          value={String(porPagina)}
          onValueChange={(valor) => aoMudarPorPagina(Number(valor))}
        >
          <SelectTrigger
            className="h-9 w-32"
            aria-label="Categorias por página"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 50].map((quantidade) => (
              <SelectItem key={quantidade} value={String(quantidade)}>
                {quantidade} por página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <nav
          aria-label="Paginação das categorias"
          className="flex items-center gap-1"
        >
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            disabled={pagina <= 1}
            onClick={() => aoMudarPagina(pagina - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </Button>

          <span className="text-muted-foreground min-w-20 text-center text-sm md:hidden">
            {pagina} de {totalPaginas}
          </span>

          <div className="hidden items-center gap-1 md:flex">
            {paginas.map((item) =>
              typeof item === "number" ? (
                <Button
                  key={item}
                  variant={item === pagina ? "default" : "outline"}
                  size="icon"
                  className="size-9"
                  onClick={() => aoMudarPagina(item)}
                  aria-label={`Página ${item}`}
                  aria-current={item === pagina ? "page" : undefined}
                >
                  {item}
                </Button>
              ) : (
                <span
                  key={item}
                  className="text-muted-foreground flex size-9 items-center justify-center"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="size-4" />
                </span>
              ),
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="size-9"
            disabled={pagina >= totalPaginas}
            onClick={() => aoMudarPagina(pagina + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight />
          </Button>
        </nav>
      </div>
    </footer>
  );
}
