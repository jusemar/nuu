import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatarPrecoCarrinho, type ItemCarrinho } from "@/features/carrinho";

import type { TotaisCheckout } from "../../../types/checkout.types";

type ResumoPedidoProps = {
  itens: ItemCarrinho[];
  totais: TotaisCheckout;
  prazoFrete: string;
  formaPagamento: "pix" | "cartao";
  parcelasCartao?: number;
  carregandoPagamento: boolean;
  cupom: string;
  mensagemCupom: string | null;
  onCupomChange: (value: string) => void;
  onAplicarCupom: () => Promise<void>;
  isFormValid: boolean;
};

export function ResumoPedido({
  itens,
  totais,
  prazoFrete,
  formaPagamento,
  parcelasCartao = 1,
  carregandoPagamento,
  cupom,
  mensagemCupom,
  onCupomChange,
  onAplicarCupom,
  isFormValid,
}: ResumoPedidoProps) {
  return (
    <aside className="lg:sticky lg:top-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          Resumo do pedido
        </h2>

        <div className="mt-5 space-y-4">
          {itens.map((item) => (
            <div className="flex gap-3" key={item.id}>
              <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <Image
                  fill
                  alt={item.nome}
                  className="object-contain p-1.5"
                  sizes="56px"
                  src={item.imagemUrl || "/produto-sem-foto.webp"}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {item.nome}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {item.quantidade} x{" "}
                  {formatarPrecoCarrinho(item.precoEmCentavos)}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {item.variante || "Modalidade principal"} ·{" "}
                  {item.prazoModalidade || "Consulte prazo"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <strong className="block text-sm">Prazo de entrega</strong> O prazo
          final soma o prazo da modalidade de preço escolhida com o prazo da
          transportadora. Exemplo: modalidade em 2 dias + frete em 3 a 7 dias
          úteis = entrega estimada em 5 a 9 dias úteis.
        </div>

        <div className="mt-5 space-y-2">
          <Label htmlFor="cupom">Cupom</Label>
          <div className="flex gap-2">
            <Input
              id="cupom"
              placeholder="PRIMEIRA10"
              className="uppercase"
              value={cupom}
              onChange={(e) => onCupomChange(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-md"
              onClick={onAplicarCupom}
            >
              Aplicar
            </Button>
          </div>
          {mensagemCupom ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {mensagemCupom}
            </p>
          ) : null}
        </div>

        <Separator className="my-5" />

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
            <strong>{formatarPrecoCarrinho(totais.subtotalEmCentavos)}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Frete</span>
            <strong>{formatarPrecoCarrinho(totais.freteEmCentavos)}</strong>
          </div>

          {totais.descontoEmCentavos > 0 ? (
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <span>Cupom no subtotal</span>
              <strong>
                -{formatarPrecoCarrinho(totais.descontoEmCentavos)}
              </strong>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">
              Prazo do frete
            </span>
            <strong className="text-right">{prazoFrete}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Pagamento</span>
            <strong className="text-right">
              {formaPagamento === "pix"
                ? "Pix"
                : `Cartão em ${parcelasCartao}x`}
            </strong>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            Total
          </span>
          <strong className="text-xl text-zinc-950 dark:text-zinc-50">
            {formatarPrecoCarrinho(totais.totalEmCentavos)}
          </strong>
        </div>

        <Button
          className="mt-5 h-11 w-full rounded-md"
          disabled={!isFormValid || carregandoPagamento || itens.length === 0}
          type="submit"
        >
          {carregandoPagamento ? "Criando pedido..." : "Pagar agora"}
        </Button>
      </div>
    </aside>
  );
}
