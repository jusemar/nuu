import { Filter, Layers, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  CategoriaFidelidade,
  RegraCategoriaFidelidade,
} from "../../types/programa-fidelidade.types";
import { EditorCategoriaFidelidade } from "./editor-categoria-fidelidade";
import { ListaCategoriasFidelidade } from "./lista-categorias-fidelidade";
import { PaginacaoCategoriasFidelidade } from "./paginacao-categorias-fidelidade";

type Props = {
  categorias: CategoriaFidelidade[];
  regras: RegraCategoriaFidelidade[];
  pontosPadrao: number;
  atualizar: (id: string, mudanca: Partial<RegraCategoriaFidelidade>) => void;
};

export function PainelCategoriasFidelidade({
  categorias,
  regras,
  pontosPadrao,
  atualizar,
}: Props) {
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [filtroRegra, setFiltroRegra] = useState("todas");
  const [editando, setEditando] = useState<CategoriaFidelidade | null>(null);
  const [aberto, setAberto] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(20);
  const grupos = useMemo(
    () => [...new Set(categorias.map((c) => c.grupo))],
    [categorias],
  );
  const filtradas = useMemo(
    () =>
      categorias.filter((categoria) => {
        const regra = regras.find((r) => r.categoriaId === categoria.id);
        return (
          categoria.nome.toLowerCase().includes(busca.trim().toLowerCase()) &&
          (grupo === "todos" || categoria.grupo === grupo) &&
          (filtroRegra === "todas" ||
            (filtroRegra === "personalizadas" && regra?.personalizada) ||
            (filtroRegra === "padrao" && !regra?.personalizada) ||
            (filtroRegra === "desativadas" && !regra?.ativa))
        );
      }),
    [categorias, regras, busca, grupo, filtroRegra],
  );
  const regraEditando =
    regras.find((r) => r.categoriaId === editando?.id) ?? null;
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaValida = Math.min(pagina, totalPaginas);
  const categoriasDaPagina = filtradas.slice(
    (paginaValida - 1) * porPagina,
    paginaValida * porPagina,
  );
  const temFiltros =
    Boolean(busca) || grupo !== "todos" || filtroRegra !== "todas";
  function editar(categoria: CategoriaFidelidade) {
    setEditando(categoria);
    setAberto(true);
  }

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1);
  }, [pagina, totalPaginas]);

  function limparFiltros() {
    setBusca("");
    setGrupo("todos");
    setFiltroRegra("todas");
    setPagina(1);
  }
  return (
    <section className="bg-card overflow-hidden rounded-xl border shadow-sm">
      <header className="flex flex-col gap-4 border-b p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-semibold">Regras por categoria</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {categorias.length} categorias ·{" "}
            {regras.filter((r) => r.personalizada).length} com regra
            personalizada
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-56">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar categoria"
              aria-label="Buscar categoria"
              className="h-10 pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={grupo}
              onValueChange={(valor) => {
                setGrupo(valor);
                setPagina(1);
              }}
            >
              <SelectTrigger
                className="h-10 min-w-36 flex-1"
                aria-label="Filtrar por grupo"
              >
                <Layers className="text-muted-foreground size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os grupos</SelectItem>
                {grupos.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filtroRegra}
              onValueChange={(valor) => {
                setFiltroRegra(valor);
                setPagina(1);
              }}
            >
              <SelectTrigger
                className="h-10 min-w-36 flex-1"
                aria-label="Filtrar por regra"
              >
                <Filter className="text-muted-foreground size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as regras</SelectItem>
                <SelectItem value="personalizadas">Personalizadas</SelectItem>
                <SelectItem value="padrao">Regra padrão</SelectItem>
                <SelectItem value="desativadas">Desativadas</SelectItem>
              </SelectContent>
            </Select>
            {temFiltros && (
              <Button
                variant="ghost"
                size="icon"
                className="size-10 shrink-0"
                aria-label="Limpar filtros"
                onClick={limparFiltros}
              >
                <X />
              </Button>
            )}
          </div>
        </div>
      </header>
      <ListaCategoriasFidelidade
        categorias={categoriasDaPagina}
        regras={regras}
        pontosPadrao={pontosPadrao}
        editar={editar}
        atualizar={atualizar}
      />
      {!filtradas.length && (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <SlidersHorizontal className="text-muted-foreground size-5" />
          <p className="text-sm font-medium">Nenhuma categoria encontrada</p>
          <p className="text-muted-foreground text-sm">
            Ajuste a busca ou limpe os filtros.
          </p>
        </div>
      )}
      <PaginacaoCategoriasFidelidade
        pagina={paginaValida}
        totalPaginas={totalPaginas}
        total={filtradas.length}
        porPagina={porPagina}
        aoMudarPagina={setPagina}
        aoMudarPorPagina={(quantidade) => {
          setPorPagina(quantidade);
          setPagina(1);
        }}
      />
      <EditorCategoriaFidelidade
        categoria={editando}
        regra={regraEditando}
        pontosPadrao={pontosPadrao}
        aberto={aberto}
        aoAlterarAbertura={setAberto}
        aoSalvar={atualizar}
      />
    </section>
  );
}
