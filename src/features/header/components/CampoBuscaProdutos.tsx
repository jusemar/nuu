"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, LayoutGrid, Search } from "lucide-react";

type Produto = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
};

const categoriasMockadas = [
  "Todas as categorias",
  "Eletrônicos",
  "Celulares",
  "Informática",
  "Casa e Cozinha",
  "Moda",
  "Esporte",
  "Beleza",
];

const produtosMockados: Produto[] = [
  {
    id: 1,
    name: "Smartphone Galaxy S24 Ultra 256GB",
    category: "Celulares",
    price: 6499.9,
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&h=120&fit=crop",
  },
  {
    id: 2,
    name: "iPhone 15 Pro Max 512GB Titânio",
    category: "Celulares",
    price: 9899.0,
    image:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=120&h=120&fit=crop",
  },
  {
    id: 3,
    name: "Notebook Dell Inspiron 15 i7 16GB",
    category: "Informática",
    price: 4299.0,
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=120&h=120&fit=crop",
  },
  {
    id: 4,
    name: "Fone Bluetooth JBL Tune 720BT",
    category: "Eletrônicos",
    price: 349.9,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&h=120&fit=crop",
  },
  {
    id: 5,
    name: 'Smart TV LG 55" 4K OLED',
    category: "Eletrônicos",
    price: 4599.0,
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=120&h=120&fit=crop",
  },
  {
    id: 6,
    name: "Air Fryer Mondial 5L Digital",
    category: "Casa e Cozinha",
    price: 429.9,
    image:
      "https://images.unsplash.com/photo-1585515320310-259814833e62?w=120&h=120&fit=crop",
  },
  {
    id: 7,
    name: "Tênis Nike Air Max 270",
    category: "Esporte",
    price: 799.9,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop",
  },
  {
    id: 8,
    name: "Perfume Importado 100ml",
    category: "Beleza",
    price: 459.0,
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=120&h=120&fit=crop",
  },
];

const sugestoesPopulares = [
  "iphone 15",
  "smart tv 55",
  "air fryer",
  "fone bluetooth",
  "notebook gamer",
];

const marca = {
  navy: "#1e2a78",
  navyStrong: "#151d5c",
  yellow: "#facc15",
  yellowStrong: "#eab308",
};

const formatarPreco = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CampoBuscaProdutos() {
  const [consulta, setConsulta] = useState("");
  const [categoria, setCategoria] = useState(categoriasMockadas[0]);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const raizRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const aoClicar = (evento: MouseEvent) => {
      if (!raizRef.current?.contains(evento.target as Node)) {
        setDropdownAberto(false);
        setSugestoesAbertas(false);
      }
    };
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = consulta.trim().toLowerCase();
    if (!termo) return [];
    return produtosMockados
      .filter((produto) => {
        const correspondeCategoria =
          categoria === categoriasMockadas[0] || produto.category === categoria;
        const correspondeConsulta =
          produto.name.toLowerCase().includes(termo) ||
          produto.category.toLowerCase().includes(termo);
        return correspondeCategoria && correspondeConsulta;
      })
      .slice(0, 5);
  }, [consulta, categoria]);

  const termosSugeridos = useMemo(() => {
    const termo = consulta.trim().toLowerCase();
    if (!termo) return [];
    return sugestoesPopulares
      .filter((sugestao) => sugestao.includes(termo))
      .slice(0, 4);
  }, [consulta]);

  return (
    <form
      ref={raizRef}
      onSubmit={(evento) => {
        evento.preventDefault();
        setSugestoesAbertas(false);
      }}
      className="relative mx-auto w-full max-w-3xl"
    >
      <div
        className="flex overflow-hidden rounded-xl border bg-white shadow-sm"
        style={{ borderColor: `${marca.navy}1a` }}
      >
        {/* Categorias */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setDropdownAberto((valor) => !valor);
              setSugestoesAbertas(false);
            }}
            className="inline-flex h-full items-center gap-2 border-r bg-slate-50 px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-100 focus:outline-none"
            style={{ color: marca.navy, borderColor: `${marca.navy}1a` }}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="max-w-[140px] truncate">{categoria}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${dropdownAberto ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownAberto && (
            <div
              className="absolute top-full left-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border bg-white shadow-xl"
              style={{ borderColor: `${marca.navy}1a` }}
            >
              <ul className="p-1.5 text-sm">
                {categoriasMockadas.map((itemCategoria) => {
                  const ativo = itemCategoria === categoria;
                  return (
                    <li key={itemCategoria}>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoria(itemCategoria);
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
                        <span>{itemCategoria}</span>
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
        <div className="relative flex-1">
          <input
            type="search"
            value={consulta}
            onChange={(evento) => {
              setConsulta(evento.target.value);
              setSugestoesAbertas(true);
            }}
            onFocus={() => consulta && setSugestoesAbertas(true)}
            placeholder="Buscar produtos..."
            className="h-full w-full bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Botão buscar */}
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors focus:outline-none"
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
          className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-xl border bg-white shadow-2xl"
          style={{ borderColor: `${marca.navy}1a` }}
        >
          {termosSugeridos.length > 0 && (
            <div className="px-4 pt-3 pb-2">
              <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Sugestões
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {termosSugeridos.map((termo) => (
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

          {produtosFiltrados.length > 0 ? (
            <div className="border-t border-slate-100">
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Produtos
              </p>
              <ul className="pb-2">
                {produtosFiltrados.map((produto) => (
                  <li key={produto.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                    >
                      <img
                        src={produto.image}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {produto.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {produto.category}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-sm font-semibold"
                        style={{ color: marca.navy }}
                      >
                        {formatarPreco(produto.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="border-t border-slate-100 px-4 py-6 text-center text-sm text-slate-500">
              Nenhum produto encontrado para{" "}
              <span className="font-medium text-slate-700">"{consulta}"</span>
              {categoria !== categoriasMockadas[0] && (
                <>
                  {" "}
                  em{" "}
                  <span className="font-medium text-slate-700">
                    {categoria}
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
            Ver todos os resultados para "{consulta}"
            {categoria !== categoriasMockadas[0] && <> em {categoria}</>}
          </button>
        </div>
      )}
    </form>
  );
}
