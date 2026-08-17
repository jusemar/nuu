"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { montarPaginasCompactas } from "../../lib/formatar-fidelidade-cliente";

type Props = {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: 10 | 20 | 30 | 50;
};

export function PaginacaoHistoricoFidelidade({
  pagina,
  totalPaginas,
  total,
  porPagina,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);

  function urlPagina(novaPagina: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pagina", String(novaPagina));
    params.set("porPagina", String(porPagina));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <footer className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-xs text-slate-500 sm:text-left">
        Mostrando {inicio}–{fim} de {total} movimentações
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Select
          value={String(porPagina)}
          onValueChange={(valor) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("pagina", "1");
            params.set("porPagina", valor);
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <SelectTrigger
            className="h-9 w-32"
            aria-label="Movimentações por página"
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
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          asChild={pagina > 1}
          disabled={pagina <= 1}
        >
          {pagina > 1 ? (
            <Link href={urlPagina(pagina - 1)} aria-label="Página anterior">
              <ChevronLeft />
            </Link>
          ) : (
            <span aria-label="Página anterior">
              <ChevronLeft />
            </span>
          )}
        </Button>
        <div className="hidden items-center gap-1 sm:flex">
          {montarPaginasCompactas(pagina, totalPaginas).map(
            (numero, indice, paginas) => (
              <span key={numero} className="contents">
                {indice > 0 && numero - paginas[indice - 1]! > 1 && (
                  <span className="px-1 text-slate-400">…</span>
                )}
                <Button
                  variant={numero === pagina ? "default" : "outline"}
                  size="icon"
                  className="size-9"
                  asChild={numero !== pagina}
                >
                  {numero === pagina ? (
                    <span>{numero}</span>
                  ) : (
                    <Link href={urlPagina(numero)}>{numero}</Link>
                  )}
                </Button>
              </span>
            ),
          )}
        </div>
        <span className="min-w-14 text-center text-xs text-slate-600 sm:hidden">
          {pagina} de {totalPaginas}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          asChild={pagina < totalPaginas}
          disabled={pagina >= totalPaginas}
        >
          {pagina < totalPaginas ? (
            <Link href={urlPagina(pagina + 1)} aria-label="Próxima página">
              <ChevronRight />
            </Link>
          ) : (
            <span aria-label="Próxima página">
              <ChevronRight />
            </span>
          )}
        </Button>
      </div>
    </footer>
  );
}
