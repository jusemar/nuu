import { ArrowRight, Coins, Info, Timer } from "lucide-react";
import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { ConfiguracaoFidelidade } from "../../types/programa-fidelidade.types";
import { GraficoPontosDemonstracao } from "./grafico-pontos-demonstracao";

type Props = {
  valor: ConfiguracaoFidelidade;
  alterar: (mudanca: Partial<ConfiguracaoFidelidade>) => void;
};

function Campo({
  rotulo,
  dica,
  children,
}: {
  rotulo: string;
  dica: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {rotulo}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Sobre ${rotulo}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-56">{dica}</TooltipContent>
        </Tooltip>
      </div>
      {children}
    </div>
  );
}

export function ConfiguracoesProgramaFidelidade({ valor, alterar }: Props) {
  const simulacao = useMemo(() => {
    const pontos = 250 * valor.pontosPorReal;
    const credito =
      valor.pontosConversao > 0
        ? (pontos * valor.valorCredito) / valor.pontosConversao
        : 0;
    return { pontos, credito };
  }, [valor]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="bg-card rounded-xl border p-5 shadow-sm sm:p-6">
        <header className="mb-5">
          <h2 className="font-semibold">Regras globais</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Valem para toda a loja, exceto onde houver regra por categoria.
          </p>
        </header>
        <Campo
          rotulo="Nome público do programa"
          dica="Nome que será exibido ao cliente quando o programa for integrado à loja."
        >
          <Input
            value={valor.nomePublico}
            onChange={(e) => alterar({ nomePublico: e.target.value })}
            className="h-11"
          />
        </Campo>
        <Separator className="my-6" />
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Coins className="text-primary size-4" />
            Acúmulo padrão
          </div>
          <div className="bg-muted/50 flex flex-wrap items-center gap-3 rounded-xl p-4">
            <span className="text-muted-foreground text-sm">A cada R$</span>
            <Input
              value="1,00"
              readOnly
              tabIndex={-1}
              className="h-10 w-20 tabular-nums"
            />
            <span className="text-muted-foreground text-sm">
              gastos, o cliente ganha
            </span>
            <Input
              type="number"
              min="0"
              step="0.25"
              value={valor.pontosPorReal}
              onChange={(e) =>
                alterar({ pontosPorReal: Number(e.target.value) })
              }
              className="h-10 w-24 tabular-nums"
              aria-label="Pontos por real"
            />
            <span className="text-muted-foreground text-sm">ponto(s)</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <ArrowRight className="text-primary size-4" />
            Conversão em crédito
          </div>
          <div className="bg-muted/50 flex flex-wrap items-center gap-3 rounded-xl p-4">
            <Input
              type="number"
              min="1"
              value={valor.pontosConversao}
              onChange={(e) =>
                alterar({ pontosConversao: Number(e.target.value) })
              }
              className="h-10 w-28 tabular-nums"
              aria-label="Pontos necessários"
            />
            <span className="text-muted-foreground text-sm">
              pontos equivalem a R$
            </span>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={valor.valorCredito}
              onChange={(e) =>
                alterar({ valorCredito: Number(e.target.value) })
              }
              className="h-10 w-24 tabular-nums"
              aria-label="Valor em crédito"
            />
            <span className="text-muted-foreground text-sm">de crédito</span>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo
            rotulo="Mínimo para resgate"
            dica="Saldo mínimo necessário para o futuro resgate."
          >
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="50"
                value={valor.minimoResgate}
                onChange={(e) =>
                  alterar({ minimoResgate: Number(e.target.value) })
                }
                className="h-11 pr-16 tabular-nums"
              />
              <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs">
                pontos
              </span>
            </div>
          </Campo>
          <Campo
            rotulo="Validade dos pontos"
            dica="Tempo contado a partir de cada acúmulo; não executa expiração nesta demonstração."
          >
            <Select
              value={String(valor.mesesValidade)}
              onValueChange={(v) => alterar({ mesesValidade: Number(v) })}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Não expiram</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
                <SelectItem value="24">24 meses</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
        </div>
      </section>
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <section className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <div className="bg-muted/50 border-b px-5 py-3">
            <h3 className="text-sm font-semibold">Simulação</h3>
          </div>
          <div className="space-y-4 p-5">
            <p className="text-muted-foreground text-sm">
              Compra de{" "}
              <span className="text-foreground font-medium">R$ 250,00</span> em
              uma categoria com regra padrão:
            </p>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex-1 rounded-xl px-4 py-3">
                <div className="text-2xl font-semibold tabular-nums">
                  {simulacao.pontos.toLocaleString("pt-BR")}
                </div>
                <div className="text-muted-foreground text-xs">
                  pontos gerados
                </div>
              </div>
              <ArrowRight className="text-muted-foreground size-4 shrink-0" />
              <div className="bg-muted flex-1 rounded-xl px-4 py-3">
                <div className="text-xl font-semibold whitespace-nowrap tabular-nums sm:text-2xl">
                  R$ {simulacao.credito.toFixed(2).replace(".", ",")}
                </div>
                <div className="text-muted-foreground text-xs">em crédito</div>
              </div>
            </div>
            <div className="bg-muted/50 text-muted-foreground flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs">
              <Timer className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Resgate a partir de{" "}
                {valor.minimoResgate.toLocaleString("pt-BR")} pontos ·{" "}
                {valor.mesesValidade
                  ? `expiram em ${valor.mesesValidade} meses`
                  : "sem expiração"}
                .
              </span>
            </div>
          </div>
        </section>
        <GraficoPontosDemonstracao />
      </aside>
    </div>
  );
}
