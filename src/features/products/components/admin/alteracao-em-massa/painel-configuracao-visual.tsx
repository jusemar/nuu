"use client";

import { Info, Layers3, LockKeyhole } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { SECOES_LOJA } from "../../../constants/secoes-loja";
import type {
  CategoriaAlteracaoEmMassa,
  DadosAlteracaoEmMassa,
} from "../../../types/alteracao-em-massa.types";

type CampoVisual = "status" | "categoria" | "marca" | "secoes";

const CAMPOS: Array<{ id: CampoVisual; rotulo: string; dica: string }> = [
  {
    id: "status",
    rotulo: "Ativo/inativo",
    dica: "Preparará a ativação ou desativação dos produtos selecionados.",
  },
  {
    id: "categoria",
    rotulo: "Categoria",
    dica: "Preparará a definição de uma categoria real do catálogo.",
  },
  {
    id: "marca",
    rotulo: "Marca",
    dica: "Preparará a definição de uma marca ativa.",
  },
  {
    id: "secoes",
    rotulo: "Seções da Loja",
    dica: "Preparará a substituição das flags reais de exibição na loja.",
  },
];

type PainelConfiguracaoVisualProps = {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  quantidadeSelecionada: number;
  dados: DadosAlteracaoEmMassa;
};

function ordenarCategoriasEmArvore(
  categorias: CategoriaAlteracaoEmMassa[],
  parentId: string | null = null,
  nivelVisual = 0,
): Array<CategoriaAlteracaoEmMassa & { nivelVisual: number }> {
  return categorias
    .filter((categoria) => categoria.parentId === parentId)
    .toSorted(
      (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"),
    )
    .flatMap((categoria) => [
      { ...categoria, nivelVisual },
      ...ordenarCategoriasEmArvore(categorias, categoria.id, nivelVisual + 1),
    ]);
}

export function PainelConfiguracaoVisual({
  aberto,
  onOpenChange,
  quantidadeSelecionada,
  dados,
}: PainelConfiguracaoVisualProps) {
  const [camposSelecionados, setCamposSelecionados] = useState<
    Set<CampoVisual>
  >(new Set());
  const [secoesSelecionadas, setSecoesSelecionadas] = useState<Set<string>>(
    new Set(),
  );

  function alternarCampo(campo: CampoVisual) {
    setCamposSelecionados((atuais) => {
      const proximos = new Set(atuais);
      if (proximos.has(campo)) proximos.delete(campo);
      else proximos.add(campo);
      return proximos;
    });
  }

  function alternarSecao(secaoId: string) {
    setSecoesSelecionadas((atuais) => {
      const proximos = new Set(atuais);
      if (proximos.has(secaoId)) proximos.delete(secaoId);
      else proximos.add(secaoId);
      return proximos;
    });
  }

  const categoriasOrdenadas = ordenarCategoriasEmArvore(
    dados.categorias.filter((categoria) => categoria.ativa),
  );

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        <SheetHeader className="border-b px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <Layers3 className="size-5" />
            </div>
            <div>
              <SheetTitle>Configurar alterações</SheetTitle>
              <SheetDescription className="mt-1">
                Estrutura visual para {quantidadeSelecionada} produto(s)
                selecionado(s).
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 p-5">
            <div
              className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-blue-950"
              role="note"
            >
              <LockKeyhole className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  Modo de demonstração seguro
                </p>
                <p className="mt-1 text-sm">
                  Nenhuma configuração desta tela será salva ou aplicada nesta
                  fase.
                </p>
              </div>
            </div>

            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">Escolha os campos</h3>
                <p className="text-muted-foreground text-sm">
                  Marque somente o que pretende configurar. Nenhum campo é
                  obrigatório.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {CAMPOS.map((campo) => (
                  <label
                    key={campo.id}
                    htmlFor={`campo-${campo.id}`}
                    className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-[[data-state=checked]]:border-blue-300 has-[[data-state=checked]]:bg-blue-50/60"
                  >
                    <Checkbox
                      id={`campo-${campo.id}`}
                      checked={camposSelecionados.has(campo.id)}
                      onCheckedChange={() => alternarCampo(campo.id)}
                    />
                    <span className="flex-1 text-sm font-medium">
                      {campo.rotulo}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Ajuda sobre ${campo.rotulo}`}
                          className="text-muted-foreground rounded-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                          onClick={(evento) => evento.preventDefault()}
                        >
                          <Info className="size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64">
                        {campo.dica}
                      </TooltipContent>
                    </Tooltip>
                  </label>
                ))}
              </div>
            </section>

            {camposSelecionados.has("status") && (
              <section className="space-y-2 rounded-xl border p-4">
                <Label htmlFor="novo-status">Ativo/inativo</Label>
                <Select>
                  <SelectTrigger id="novo-status" className="w-full">
                    <SelectValue placeholder="Escolha o novo status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativar</SelectItem>
                    <SelectItem value="inativo">Desativar</SelectItem>
                  </SelectContent>
                </Select>
              </section>
            )}

            {camposSelecionados.has("categoria") && (
              <section className="space-y-2 rounded-xl border p-4">
                <Label htmlFor="nova-categoria">Categoria</Label>
                <Select>
                  <SelectTrigger id="nova-categoria" className="w-full">
                    <SelectValue placeholder="Escolha uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasOrdenadas.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {`${"— ".repeat(categoria.nivelVisual)}${categoria.nome}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </section>
            )}

            {camposSelecionados.has("marca") && (
              <section className="space-y-2 rounded-xl border p-4">
                <Label htmlFor="nova-marca">Marca</Label>
                <Select>
                  <SelectTrigger id="nova-marca" className="w-full">
                    <SelectValue placeholder="Escolha uma marca ativa" />
                  </SelectTrigger>
                  <SelectContent>
                    {dados.marcas
                      .filter((marca) => marca.ativa)
                      .map((marca) => (
                        <SelectItem key={marca.id} value={marca.id}>
                          {marca.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </section>
            )}

            {camposSelecionados.has("secoes") && (
              <fieldset className="space-y-2 rounded-xl border p-4">
                <legend className="px-1 text-sm font-medium">
                  Seções da Loja
                </legend>
                <p className="text-muted-foreground text-xs">
                  Selecione as seções reais que futuramente substituirão a
                  configuração atual.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SECOES_LOJA.map((secao) => (
                    <label
                      key={secao.id}
                      htmlFor={`painel-secao-${secao.id}`}
                      className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm"
                    >
                      <Checkbox
                        id={`painel-secao-${secao.id}`}
                        checked={secoesSelecionadas.has(secao.id)}
                        onCheckedChange={() => alternarSecao(secao.id)}
                      />
                      <span>{secao.icone}</span>
                      {secao.rotulo}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="border-t bg-slate-50/80">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button disabled className="w-full sm:w-auto">
                    Aplicar alterações
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Disponível em uma próxima fase.</TooltipContent>
            </Tooltip>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
