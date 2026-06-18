"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type MarcaItem = {
  id: string;
  nome: string;
};

type MarcaPopoverSelectorProps = {
  value?: string | null;
  brands: MarcaItem[];
  placeholder?: string;
  onChange: (brandId: string, brandName: string) => void;
  onCreateBrand?: (nome: string) => Promise<MarcaItem | null>;
};

export function MarcaPopoverSelector({
  value,
  brands,
  placeholder = "Selecione uma marca",
  onChange,
  onCreateBrand,
}: MarcaPopoverSelectorProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [novoNome, setNovoNome] = useState("");

  const marcaSelecionada = brands.find((marca) => marca.id === value);

  const marcasFiltradas = useMemo(
    () =>
      brands.filter((marca) =>
        marca.nome.toLowerCase().includes(busca.toLowerCase()),
      ),
    [brands, busca],
  );

  async function criarMarca() {
    const nome = novoNome.trim();
    if (!onCreateBrand || !nome) return;

    const criada = await onCreateBrand(nome);
    if (criada) {
      onChange(criada.id, criada.nome);
      setNovoNome("");
      setBusca("");
    }
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between text-sm"
        >
          <span className="truncate">{marcaSelecionada?.nome || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-2" align="start">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar marca..."
          className="mb-2 h-9"
        />
        <div className="max-h-56 overflow-y-auto">
          {marcasFiltradas.length === 0 ? (
            <p className="px-2 py-2 text-sm text-slate-500">
              Nenhuma marca encontrada.
            </p>
          ) : (
            marcasFiltradas.map((marca) => (
              <button
                key={marca.id}
                type="button"
                onClick={() => {
                  onChange(marca.id, marca.nome);
                  setAberto(false);
                  setBusca("");
                }}
                className="w-full rounded px-2 py-2 text-left text-sm hover:bg-slate-100"
              >
                {marca.nome}
              </button>
            ))
          )}
        </div>
        {onCreateBrand ? (
          <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
            <Input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Criar nova marca..."
              className="h-9"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              onClick={criarMarca}
              disabled={!novoNome.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar marca
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
