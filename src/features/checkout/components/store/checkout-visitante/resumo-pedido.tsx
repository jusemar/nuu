import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, Check } from "lucide-react";
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
  const totalComDescontoPix = formaPagamento === "pix"
    ? Math.round(totais.totalEmCentavos * 0.95)
    : null;

  return (
    <aside className="lg:col-span-5">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="border-b border-border p-6">
            <h2 className="text-base font-semibold">Resumo do pedido</h2>
          </div>

          <div className="space-y-5 p-6">
            {itens.map((item) => (
              <div className="flex items-center gap-4" key={item.id}>
                <div className="relative flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Image
                    fill
                    alt={item.nome}
                    className="object-contain p-1.5"
                    sizes="56px"
                    src={item.imagemUrl || "/produto-sem-foto.webp"}
                  />
                  <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                    {item.quantidade}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.variante || "Modalidade principal"}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatarPrecoCarrinho(item.precoEmCentavos * item.quantidade)}
                </span>
              </div>
            ))}

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-300">
              <strong className="block text-sm">Prazo de entrega</strong>
              O prazo final soma o prazo da modalidade de preço escolhida com o prazo da transportadora.
            </div>

            <div className="flex gap-2 pt-2">
              <Input
                type="text"
                placeholder="Cupom de desconto"
                className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 uppercase"
                value={cupom}
                onChange={(e) => onCupomChange(e.target.value)}
              />
              <button
                type="button"
                className="h-10 rounded-lg bg-secondary px-4 text-xs font-bold tracking-wider text-secondary-foreground transition-colors hover:bg-muted"
                onClick={onAplicarCupom}
              >
                APLICAR
              </button>
            </div>
            {mensagemCupom ? (
              <p className="text-xs text-muted-foreground">{mensagemCupom}</p>
            ) : null}

            <div className="space-y-2.5 border-t border-border pt-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatarPrecoCarrinho(totais.subtotalEmCentavos)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-medium">
                  {totais.freteEmCentavos === 0 ? "Grátis" : formatarPrecoCarrinho(totais.freteEmCentavos)}
                </span>
              </div>
              {totais.descontoEmCentavos > 0 ? (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Desconto</span>
                  <span className="font-medium">
                    -{formatarPrecoCarrinho(totais.descontoEmCentavos)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="font-medium text-right">
                  {formaPagamento === "pix" ? "PIX" : `${parcelasCartao}x no cartão`}
                </span>
              </div>
              <div className="flex items-end justify-between pt-3">
                <span className="text-base font-semibold">Total</span>
                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight">
                    {formatarPrecoCarrinho(totais.totalEmCentavos)}
                  </p>
                  {formaPagamento === "pix" && totalComDescontoPix && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Com PIX: {formatarPrecoCarrinho(totalComDescontoPix)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || carregandoPagamento || itens.length === 0}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-bold tracking-wide text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="size-4" />
              {carregandoPagamento ? "Processando..." : "FINALIZAR PEDIDO COM SEGURANÇA"}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Compra 100% segura · Dados protegidos por SSL
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-card">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Seus dados são protegidos por criptografia SSL de 256 bits e processados em
              ambiente <strong className="text-foreground">PCI-DSS Compliant</strong>.
              Não armazenamos dados do seu cartão.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
            <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background py-2 text-center">
              <span className="text-emerald-600">
                <Lock className="size-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                SSL 256-bit
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background py-2 text-center">
              <span className="text-emerald-600">
                <ShieldCheck className="size-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                PCI-DSS
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background py-2 text-center">
              <span className="text-emerald-600">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Antifraude
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Lock className="size-3" />
          <span>SSL · PCI Compliant · Ambiente seguro</span>
        </div>
      </div>
    </aside>
  );
}
