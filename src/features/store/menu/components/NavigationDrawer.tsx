"use client";

import { ArrowLeft, ChevronRight, Folder, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { useMenuCategories } from "../hooks/useMenuCategories";
import type { MenuCategory } from "../services/menuService";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ListaCategoriasProps {
  categories: MenuCategory[];
  depth?: number;
  onNavigate: () => void;
}

function ListaCategoriasDesktop({
  categories,
  depth = 0,
  onNavigate,
}: ListaCategoriasProps) {
  const [itensExpandidos, setItensExpandidos] = useState<Set<string>>(
    new Set(),
  );
  const categoriasOrdenadas = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
  );

  const alternarCategoria = (id: string) => {
    setItensExpandidos((atuais) => {
      const proximos = new Set(atuais);
      if (proximos.has(id)) proximos.delete(id);
      else proximos.add(id);
      return proximos;
    });
  };

  return (
    <ul className="space-y-1">
      {categoriasOrdenadas.map((categoria) => {
        const temFilhos = Boolean(categoria.children?.length);
        const expandida = itensExpandidos.has(categoria.id);
        const classesItem = cn(
          "flex min-h-11 w-full items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-700 transition-colors hover:bg-slate-100",
          depth === 0 && "font-medium",
        );

        return (
          <li key={categoria.id}>
            <div className={classesItem}>
              <Link
                href={`/category/${categoria.slug}`}
                onClick={onNavigate}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1.5 focus-visible:ring-2 focus-visible:ring-[#0C447C] focus-visible:outline-none"
              >
                {temFilhos ? (
                  <Folder className="size-4 shrink-0 text-amber-500" />
                ) : (
                  <Tag className="size-4 shrink-0 text-slate-400" />
                )}
                <span className="min-w-0 flex-1 truncate">
                  {categoria.name}
                </span>
              </Link>

              {temFilhos ? (
                <button
                  type="button"
                  onClick={() => alternarCategoria(categoria.id)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-[#0C447C] focus-visible:outline-none"
                  aria-expanded={expandida}
                  aria-label={`${expandida ? "Recolher" : "Expandir"} ${categoria.name}`}
                >
                  <ChevronRight
                    className={cn(
                      "size-4 transition-transform",
                      expandida && "rotate-90",
                    )}
                  />
                </button>
              ) : null}
            </div>

            {temFilhos && expandida ? (
              <div className="mt-1 border-l border-slate-200 pl-3">
                <ListaCategoriasDesktop
                  categories={categoria.children ?? []}
                  depth={depth + 1}
                  onNavigate={onNavigate}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function EsqueletoMenu() {
  return (
    <div className="space-y-3 p-4" aria-label="Carregando categorias">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="h-11 w-full animate-pulse rounded-lg bg-slate-100"
        />
      ))}
    </div>
  );
}

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const { data: categories, isLoading, error } = useMenuCategories();
  const [caminho, setCaminho] = useState<MenuCategory[]>([]);
  const categoriaAtual = caminho.at(-1);
  const categoriasVisiveis = categoriaAtual?.children ?? categories ?? [];

  useEffect(() => {
    if (!isOpen) setCaminho([]);
  }, [isOpen]);

  const aoAlterarAbertura = (aberto: boolean) => {
    if (!aberto) onClose();
  };

  const conteudoVazioOuErro = error ? (
    <p className="p-5 text-center text-sm text-red-600">
      Erro ao carregar categorias. Tente novamente.
    </p>
  ) : !categories?.length ? (
    <p className="p-5 text-center text-sm text-slate-500">
      Nenhuma categoria encontrada.
    </p>
  ) : null;

  return (
    <Sheet open={isOpen} onOpenChange={aoAlterarAbertura}>
      <SheetContent
        id="menu-categorias-loja"
        side="left"
        className="w-[min(88vw,320px)] gap-0 overflow-hidden border-slate-200 p-0 sm:max-w-[320px]"
      >
        <SheetHeader className="min-h-16 justify-center border-b border-slate-200 px-4 py-3 pr-12 text-left">
          <div className="flex min-w-0 items-center gap-2">
            {categoriaAtual ? (
              <button
                type="button"
                onClick={() => setCaminho((atual) => atual.slice(0, -1))}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-blue-50 hover:text-[#0C447C] focus-visible:ring-2 focus-visible:ring-[#0C447C] focus-visible:outline-none md:hidden"
                aria-label="Voltar para o nível anterior"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : null}
            <SheetTitle className="truncate text-base font-semibold text-slate-900">
              {categoriaAtual?.name ?? "Categorias"}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {isLoading ? (
            <EsqueletoMenu />
          ) : conteudoVazioOuErro ? (
            conteudoVazioOuErro
          ) : (
            <>
              {/* Mobile usa navegação por telas: raiz agrupadora abre os filhos. */}
              <ul className="space-y-1 md:hidden">
                {[...categoriasVisiveis]
                  .sort((a, b) =>
                    a.name.localeCompare(b.name, "pt-BR", {
                      sensitivity: "base",
                    }),
                  )
                  .map((categoria) => {
                    const temFilhos = Boolean(categoria.children?.length);

                    return (
                      <li key={categoria.id}>
                        <div className="flex min-h-12 w-full items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-700 transition-colors hover:bg-slate-100">
                          <Link
                            href={`/category/${categoria.slug}`}
                            onClick={onClose}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-2 focus-visible:ring-2 focus-visible:ring-[#0C447C] focus-visible:outline-none"
                          >
                            {temFilhos ? (
                              <Folder className="size-4 shrink-0 text-amber-500" />
                            ) : (
                              <Tag className="size-4 shrink-0 text-slate-400" />
                            )}
                            <span className="min-w-0 flex-1 truncate">
                              {categoria.name}
                            </span>
                          </Link>

                          {temFilhos ? (
                            <button
                              type="button"
                              onClick={() =>
                                setCaminho((atual) => [...atual, categoria])
                              }
                              className="flex size-10 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-[#0C447C] focus-visible:outline-none"
                              aria-label={`Abrir subcategorias de ${categoria.name}`}
                            >
                              <ChevronRight className="size-4 shrink-0 text-slate-400" />
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
              </ul>

              <div className="hidden md:block">
                <ListaCategoriasDesktop
                  categories={categories ?? []}
                  onNavigate={onClose}
                />
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
