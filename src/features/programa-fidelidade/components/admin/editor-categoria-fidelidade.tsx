import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type {
  CategoriaFidelidade,
  RegraCategoriaFidelidade,
} from "../../types/programa-fidelidade.types";

type Props = {
  categoria: CategoriaFidelidade | null;
  regra: RegraCategoriaFidelidade | null;
  pontosPadrao: number;
  aberto: boolean;
  aoAlterarAbertura: (aberto: boolean) => void;
  aoSalvar: (id: string, mudanca: Partial<RegraCategoriaFidelidade>) => void;
};

export function EditorCategoriaFidelidade({
  categoria,
  regra,
  pontosPadrao,
  aberto,
  aoAlterarAbertura,
  aoSalvar,
}: Props) {
  const [personalizada, setPersonalizada] = useState(false);
  const [pontos, setPontos] = useState(pontosPadrao);
  const [ativa, setAtiva] = useState(true);
  useEffect(() => {
    if (regra) {
      setPersonalizada(regra.personalizada);
      setPontos(regra.personalizada ? regra.pontosPorReal : pontosPadrao);
      setAtiva(regra.ativa);
    }
  }, [regra, pontosPadrao]);
  if (!categoria || !regra) return null;
  const efetiva = personalizada ? pontos : pontosPadrao;
  return (
    <Sheet open={aberto} onOpenChange={aoAlterarAbertura}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-lg">{categoria.nome}</SheetTitle>
          <SheetDescription>
            {categoria.grupo} · {categoria.produtos} produtos
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 overflow-y-auto px-6 py-6">
          <div className="bg-muted/50 flex items-center justify-between gap-4 rounded-xl px-4 py-3">
            <div>
              <Label htmlFor="categoria-ativa">Acúmulo ativo</Label>
              <p className="text-muted-foreground mt-1 text-xs">
                Desative para não gerar pontos nesta categoria.
              </p>
            </div>
            <Switch
              id="categoria-ativa"
              checked={ativa}
              onCheckedChange={setAtiva}
            />
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs tracking-wide uppercase">
              Regra de acúmulo
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  valor: false,
                  titulo: "Padrão",
                  detalhe: `R$ 1 = ${pontosPadrao} pt`,
                },
                {
                  valor: true,
                  titulo: "Personalizada",
                  detalhe: "Definir taxa",
                },
              ].map((opcao) => (
                <button
                  key={String(opcao.valor)}
                  type="button"
                  onClick={() => setPersonalizada(opcao.valor)}
                  aria-pressed={personalizada === opcao.valor}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-all",
                    personalizada === opcao.valor
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "bg-card hover:bg-muted/50",
                  )}
                >
                  <div className="text-sm font-medium">{opcao.titulo}</div>
                  <div className="text-muted-foreground text-xs tabular-nums">
                    {opcao.detalhe}
                  </div>
                </button>
              ))}
            </div>
          </div>
          {personalizada && (
            <div className="space-y-3 rounded-xl border p-4">
              <Label htmlFor="pontos-categoria">Pontos por R$ 1 gasto</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="pontos-categoria"
                  type="number"
                  min="0"
                  step="0.25"
                  value={pontos}
                  onChange={(e) => setPontos(Number(e.target.value))}
                  className="h-11 w-28 tabular-nums"
                />
                {[0.5, 1.5, 2, 3].map((valor) => (
                  <Button
                    key={valor}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPontos(valor)}
                  >
                    {valor}x
                  </Button>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Altera apenas a velocidade de ganho. A conversão em crédito
                continua global.
              </p>
            </div>
          )}
          <Separator />
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
              <Sparkles className="text-primary size-3.5" />
              Efeito
            </div>
            <p className="text-sm">
              Uma compra de{" "}
              <span className="font-medium tabular-nums">R$ 200,00</span> nesta
              categoria gera{" "}
              <span className="font-semibold tabular-nums">
                {ativa ? (200 * efetiva).toLocaleString("pt-BR") : 0}
              </span>{" "}
              pontos.
            </p>
          </div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
          <Button variant="ghost" onClick={() => aoAlterarAbertura(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              aoSalvar(categoria.id, {
                personalizada,
                pontosPorReal: personalizada ? pontos : pontosPadrao,
                ativa,
              });
              aoAlterarAbertura(false);
            }}
          >
            Aplicar alteração
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
