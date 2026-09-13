"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  criarChaveDestinoEntregaPropria,
  type DestinoPesquisavelEntregaPropria,
  filtrarDestinosEntregaPropria,
  formatarDestinoEntregaPropria,
} from "../../lib/pesquisar-destinos-entrega-propria";

type SeletorDestinoEntregaPropriaProps = {
  id: string;
  destinos: DestinoPesquisavelEntregaPropria[];
  value: string;
  onValueChange: (value: string) => void;
};

export function SeletorDestinoEntregaPropria({
  id,
  destinos,
  value,
  onValueChange,
}: SeletorDestinoEntregaPropriaProps) {
  const listaId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [indiceAtivo, setIndiceAtivo] = useState(-1);

  const destinoSelecionado = useMemo(
    () =>
      destinos.find(
        (destino) => criarChaveDestinoEntregaPropria(destino) === value,
      ),
    [destinos, value],
  );

  const destinosFiltrados = useMemo(
    () => filtrarDestinosEntregaPropria(destinos, pesquisa),
    [destinos, pesquisa],
  );

  useEffect(() => {
    setPesquisa(
      destinoSelecionado
        ? formatarDestinoEntregaPropria(destinoSelecionado)
        : "",
    );
  }, [destinoSelecionado]);

  useEffect(() => {
    if (!aberto || indiceAtivo < 0) return;

    const lista = listaRef.current;
    const itemAtivo = lista?.querySelector<HTMLElement>(
      `[data-indice-opcao="${indiceAtivo}"]`,
    );
    if (!lista || !itemAtivo) return;

    const limitesLista = lista.getBoundingClientRect();
    const limitesItem = itemAtivo.getBoundingClientRect();

    if (limitesItem.top < limitesLista.top) {
      lista.scrollTop -= limitesLista.top - limitesItem.top;
    } else if (limitesItem.bottom > limitesLista.bottom) {
      lista.scrollTop += limitesItem.bottom - limitesLista.bottom;
    }
  }, [aberto, destinosFiltrados, indiceAtivo]);

  function selecionarDestino(destino: DestinoPesquisavelEntregaPropria) {
    onValueChange(criarChaveDestinoEntregaPropria(destino));
    setPesquisa(formatarDestinoEntregaPropria(destino));
    setIndiceAtivo(-1);
    setAberto(false);
    inputRef.current?.focus();
  }

  function limparSelecao() {
    onValueChange("");
    setPesquisa("");
    setIndiceAtivo(-1);
    setAberto(true);
    inputRef.current?.focus();
  }

  function alterarAbertura(novoEstado: boolean) {
    setAberto(novoEstado);
    if (!novoEstado) {
      setPesquisa(
        destinoSelecionado
          ? formatarDestinoEntregaPropria(destinoSelecionado)
          : "",
      );
      setIndiceAtivo(-1);
    }
  }

  function moverDestaque(direcao: 1 | -1) {
    if (destinosFiltrados.length === 0) return;

    setIndiceAtivo((atual) => {
      if (atual < 0) {
        return direcao === 1 ? 0 : destinosFiltrados.length - 1;
      }

      return (
        (atual + direcao + destinosFiltrados.length) % destinosFiltrados.length
      );
    });
  }

  return (
    <Popover open={aberto} onOpenChange={alterarAbertura}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listaId}
            aria-expanded={aberto}
            aria-activedescendant={
              indiceAtivo >= 0 ? `${listaId}-opcao-${indiceAtivo}` : undefined
            }
            autoComplete="off"
            value={pesquisa}
            onFocus={() => setAberto(true)}
            onClick={() => setAberto(true)}
            onChange={(event) => {
              if (value) onValueChange("");
              setPesquisa(event.target.value);
              setIndiceAtivo(0);
              setAberto(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setAberto(true);
                moverDestaque(1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setAberto(true);
                moverDestaque(-1);
              } else if (event.key === "Enter" && aberto) {
                const destino = destinosFiltrados[indiceAtivo];
                if (destino) {
                  event.preventDefault();
                  selecionarDestino(destino);
                }
              } else if (event.key === "Escape") {
                event.preventDefault();
                alterarAbertura(false);
              }
            }}
            placeholder="Digite cidade, região, bairro ou CEP"
            className="pr-16"
          />

          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Limpar destino selecionado"
              className="absolute top-1/2 right-7 h-8 w-8 -translate-y-1/2"
              onClick={limparSelecao}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}

          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-gray-500"
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-1"
      >
        <div
          ref={listaRef}
          id={listaId}
          role="listbox"
          aria-label="Destinos cadastrados"
          className="max-h-64 overflow-y-auto overscroll-contain"
        >
          {destinosFiltrados.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-500">
              Nenhum destino encontrado.
            </p>
          ) : (
            destinosFiltrados.map((destino, index) => {
              const chave = criarChaveDestinoEntregaPropria(destino);
              const selecionado = chave === value;

              return (
                <button
                  key={chave}
                  id={`${listaId}-opcao-${index}`}
                  data-indice-opcao={index}
                  type="button"
                  role="option"
                  aria-selected={selecionado}
                  onMouseEnter={() => setIndiceAtivo(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selecionarDestino(destino)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-sm px-3 py-2 text-left text-sm outline-none",
                    "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:ring-2",
                    indiceAtivo === index && "bg-accent text-accent-foreground",
                  )}
                >
                  <Check
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      selecionado ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span>{formatarDestinoEntregaPropria(destino)}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
