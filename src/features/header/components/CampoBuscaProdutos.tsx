"use client";

import { Check, ChevronDown, LayoutGrid, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { BadgePromocional } from "@/features/promocoes/components/store/badge-promocional";

import {
  buscarCategoriasPrincipais,
  buscarProdutosParaAutocomplete,
  type CategoriaPrincipalBusca,
  type ProdutoAutocomplete,
} from "../queries/busca-produtos";

const marca = {
  navy: "#1e2a78",
  navyStrong: "#151d5c",
  yellow: "#facc15",
  yellowStrong: "#eab308",
};

const formatarPreco = (valor: number) =>
  (valor / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export function CampoBuscaProdutos() {
  const [consulta, setConsulta] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<CategoriaPrincipalBusca | null>(null);
  const [categoriasPrincipais, setCategoriasPrincipais] = useState<
    CategoriaPrincipalBusca[]
  >([]);
  const [produtosEncontrados, setProdutosEncontrados] = useState<
    ProdutoAutocomplete[]
  >([]);
  const [sugestoesEncontradas, setSugestoesEncontradas] = useState<string[]>(
    [],
  );
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const raizRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let componenteMontado = true;

    buscarCategoriasPrincipais().then((categorias) => {
      if (componenteMontado) setCategoriasPrincipais(categorias);
    });

    return () => {
      componenteMontado = false;
    };
  }, []);

  useEffect(() => {
    const aoInteragirFora = (evento: PointerEvent) => {
      if (!raizRef.current?.contains(evento.target as Node)) {
        setDropdownAberto(false);
        setSugestoesAbertas(false);
      }
    };
    const aoPressionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setDropdownAberto(false);
        setSugestoesAbertas(false);
      }
    };

    document.addEventListener("pointerdown", aoInteragirFora);
    document.addEventListener("keydown", aoPressionarTecla);

    return () => {
      document.removeEventListener("pointerdown", aoInteragirFora);
      document.removeEventListener("keydown", aoPressionarTecla);
    };
  }, []);

  useEffect(() => {
    const termoBusca = consulta.trim();

    if (!termoBusca) {
      setProdutosEncontrados([]);
      setSugestoesEncontradas([]);
      return;
    }

    let buscaCancelada = false;
    const debounceBusca = window.setTimeout(async () => {
      const resultado = await buscarProdutosParaAutocomplete({
        termoBusca,
        categoriaId: categoriaSelecionada?.id ?? null,
      });

      if (buscaCancelada) return;

      setProdutosEncontrados(resultado.produtosEncontrados);
      setSugestoesEncontradas(resultado.sugestoesEncontradas);
    }, 250);

    return () => {
      buscaCancelada = true;
      window.clearTimeout(debounceBusca);
    };
  }, [consulta, categoriaSelecionada]);

  return (
    <form
      ref={raizRef}
      onSubmit={(evento) => {
        evento.preventDefault();
        setSugestoesAbertas(false);
      }}
      role="search"
      className="relative z-[60] mx-auto w-full max-w-3xl min-w-0"
    >
      <div
        className="flex min-w-0 overflow-visible rounded-xl border bg-white shadow-sm"
        style={{ borderColor: `${marca.navy}1a` }}
      >
        {/* Categorias */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setDropdownAberto((valor) => !valor);
              setSugestoesAbertas(false);
            }}
            className="inline-flex h-full min-h-11 items-center gap-2 rounded-l-xl border-r bg-slate-50 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e2a78] focus-visible:ring-inset sm:px-4 sm:py-3"
            style={{ color: marca.navy, borderColor: `${marca.navy}1a` }}
            aria-label={`Filtrar busca por categoria: ${categoriaSelecionada?.nome ?? "todas"}`}
            aria-expanded={dropdownAberto}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden max-w-[140px] truncate sm:inline">
              {categoriaSelecionada?.nome ?? "Categorias"}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${dropdownAberto ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownAberto && (
            <div
              className="absolute top-full left-0 z-[70] mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border bg-white shadow-xl"
              style={{ borderColor: `${marca.navy}1a` }}
            >
              <ul className="max-h-72 overflow-y-auto p-1.5 text-sm">
                <li key="todas-categorias">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoriaSelecionada(null);
                      setDropdownAberto(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors"
                    style={
                      categoriaSelecionada === null
                        ? { backgroundColor: marca.navy, color: "#fff" }
                        : { color: "#334155" }
                    }
                    onMouseEnter={(evento) => {
                      if (categoriaSelecionada !== null)
                        evento.currentTarget.style.backgroundColor = "#f1f5f9";
                    }}
                    onMouseLeave={(evento) => {
                      if (categoriaSelecionada !== null)
                        evento.currentTarget.style.backgroundColor =
                          "transparent";
                    }}
                  >
                    <span>Categorias</span>
                    {categoriaSelecionada === null && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                </li>
                {categoriasPrincipais.map((itemCategoria) => {
                  const ativo = itemCategoria.id === categoriaSelecionada?.id;
                  return (
                    <li key={itemCategoria.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoriaSelecionada(itemCategoria);
                          setDropdownAberto(false);
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors"
                        style={
                          ativo
                            ? { backgroundColor: marca.navy, color: "#fff" }
                            : { color: "#334155" }
                        }
                        onMouseEnter={(evento) => {
                          if (!ativo)
                            evento.currentTarget.style.backgroundColor =
                              "#f1f5f9";
                        }}
                        onMouseLeave={(evento) => {
                          if (!ativo)
                            evento.currentTarget.style.backgroundColor =
                              "transparent";
                        }}
                      >
                        <span>{itemCategoria.nome}</span>
                        {ativo && <Check className="h-4 w-4" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="relative min-w-0 flex-1">
          <input
            type="search"
            value={consulta}
            onChange={(evento) => {
              setConsulta(evento.target.value);
              setSugestoesAbertas(true);
            }}
            onFocus={() => consulta && setSugestoesAbertas(true)}
            placeholder="Buscar produtos..."
            aria-label="Buscar produtos por nome ou SKU"
            className="h-full min-h-11 w-full min-w-0 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none sm:px-4 sm:py-3"
          />
        </div>

        {/* Botão buscar */}
        <button
          type="submit"
          aria-label="Buscar"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-r-xl px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e2a78] focus-visible:ring-inset sm:px-5 sm:py-3"
          style={{ color: marca.navy, backgroundColor: marca.yellow }}
          onMouseEnter={(evento) =>
            (evento.currentTarget.style.backgroundColor = marca.yellowStrong)
          }
          onMouseLeave={(evento) =>
            (evento.currentTarget.style.backgroundColor = marca.yellow)
          }
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </div>

      {/* Autocomplete */}
      {sugestoesAbertas && consulta.trim() && (
        <div
          className="absolute top-full right-0 left-0 z-[65] mt-2 max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain rounded-xl border bg-white shadow-2xl"
          style={{ borderColor: `${marca.navy}1a` }}
        >
          {sugestoesEncontradas.length > 0 && (
            <div className="px-4 pt-3 pb-2">
              <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Sugestões
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {sugestoesEncontradas.map((termo) => (
                  <li key={termo}>
                    <button
                      type="button"
                      onClick={() => setConsulta(termo)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      <Search className="h-3 w-3" />
                      {termo}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {produtosEncontrados.length > 0 ? (
            <div className="border-t border-slate-100">
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Produtos
              </p>
              <ul className="pb-2">
                {produtosEncontrados.map((produto) => (
                  <li key={produto.id}>
                    {produto.slug ? (
                      <Link
                        href={`/product/${produto.slug}`}
                        prefetch={false}
                        onClick={() => {
                          setSugestoesAbertas(false);
                          setDropdownAberto(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                      >
                        <Image
                          src={produto.imagemUrl ?? "/produto-sem-foto.webp"}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {produto.nome}
                            </p>
                            {produto.destaque ? (
                              <span className="bg-primary text-primary-foreground shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase">
                                Destaque
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500">
                            {produto.categoriaNome ?? "Sem categoria"}
                          </p>
                          {produto.badgePromocional && produto.percentualOff ? (
                            <div className="mt-1">
                              <BadgePromocional
                                tipo={produto.badgePromocional}
                                percentualOff={produto.percentualOff}
                              />
                            </div>
                          ) : null}
                        </div>
                        {produto.precoEmCentavos !== null && (
                          <span
                            className="shrink-0 text-sm font-semibold"
                            style={{ color: marca.navy }}
                          >
                            {formatarPreco(produto.precoEmCentavos)}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <div className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
                        <Image
                          src={produto.imagemUrl ?? "/produto-sem-foto.webp"}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {produto.nome}
                            </p>
                            {produto.destaque ? (
                              <span className="bg-primary text-primary-foreground shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase">
                                Destaque
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500">
                            {produto.categoriaNome ?? "Sem categoria"}
                          </p>
                          {produto.badgePromocional && produto.percentualOff ? (
                            <div className="mt-1">
                              <BadgePromocional
                                tipo={produto.badgePromocional}
                                percentualOff={produto.percentualOff}
                              />
                            </div>
                          ) : null}
                        </div>
                        {produto.precoEmCentavos !== null && (
                          <span
                            className="shrink-0 text-sm font-semibold"
                            style={{ color: marca.navy }}
                          >
                            {formatarPreco(produto.precoEmCentavos)}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="border-t border-slate-100 px-4 py-6 text-center text-sm text-slate-500">
              Nenhum produto encontrado para{" "}
              <span className="font-medium text-slate-700">
                &ldquo;{consulta}&rdquo;
              </span>
              {categoriaSelecionada && (
                <>
                  {" "}
                  em{" "}
                  <span className="font-medium text-slate-700">
                    {categoriaSelecionada.nome}
                  </span>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: marca.navy }}
            onMouseEnter={(evento) =>
              (evento.currentTarget.style.backgroundColor = marca.navyStrong)
            }
            onMouseLeave={(evento) =>
              (evento.currentTarget.style.backgroundColor = marca.navy)
            }
          >
            <Search className="h-4 w-4" />
            Ver todos os resultados para &ldquo;{consulta}&rdquo;
            {categoriaSelecionada && <> em {categoriaSelecionada.nome}</>}
          </button>
        </div>
      )}
    </form>
  );
}
