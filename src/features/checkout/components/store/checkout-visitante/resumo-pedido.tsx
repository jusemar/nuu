import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, Check } from "lucide-react";
import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { formatarPrecoCarrinho } from "@/features/carrinho";

import type { CheckoutVisitanteSchema } from "../../../schemas/checkout.schema";
import type { ResumoCheckoutCalculado } from "../../../types/checkout.types";
import { OpcoesPagamento } from "./opcoes-pagamento";

type ResumoPedidoProps = {
  resumoCheckout: ResumoCheckoutCalculado | null;
  formaPagamento: "pix" | "cartao";
  parcelasCartao?: number;
  carregandoPagamento: boolean;
  cupom: string;
  register: UseFormRegister<CheckoutVisitanteSchema>;
  setValue: UseFormSetValue<CheckoutVisitanteSchema>;
  mensagemCupom: string | null;
  onCupomChange: (value: string) => void;
  onAplicarCupom: () => Promise<void>;
  isFormValid: boolean;
};

export function ResumoPedido({
  resumoCheckout,
  formaPagamento,
  parcelasCartao = 1,
  carregandoPagamento,
  cupom,
  register,
  setValue,
  mensagemCupom,
  onCupomChange,
  onAplicarCupom,
  isFormValid,
}: ResumoPedidoProps) {
  const totais = resumoCheckout?.totaisPorFormaPagamento[formaPagamento];
  const parcelamentoCartao =
    resumoCheckout?.pagamentos.cartao.parcelamentos.find(
      (parcela) => parcela.parcelas === parcelasCartao,
    ) ?? resumoCheckout?.pagamentos.cartao.parcelamentos[0];
  const totalAtual =
    formaPagamento === "cartao" && parcelamentoCartao
      ? parcelamentoCartao.totalEmCentavos
      : (totais?.totalEmCentavos ?? 0);
  const pagamentoDisponivel =
    formaPagamento === "pix"
      ? resumoCheckout?.pagamentos.pix.ativo
      : resumoCheckout?.pagamentos.cartao.ativo;

  return (
    <aside className="lg:col-span-5">
      <div className="sticky top-24 space-y-4">
        <OpcoesPagamento
          formaPagamento={formaPagamento}
          parcelasCartao={parcelasCartao}
          resumoCheckout={resumoCheckout}
          register={register}
          setValue={setValue}
        />

        <div className="border-border bg-card shadow-card overflow-hidden rounded-2xl border">
          <div className="border-border border-b p-6">
            <h2 className="text-base font-semibold">Totais do pedido</h2>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-300">
              <strong className="block text-sm">Prazo de entrega</strong>O prazo
              final soma o prazo da modalidade de preço escolhida com o prazo da
              transportadora.
            </div>

            <div className="flex gap-2 pt-2">
              <Input
                type="text"
                placeholder="Cupom de desconto"
                className="border-border bg-background focus:border-primary focus:ring-primary/15 h-10 flex-1 rounded-lg border px-3 text-sm uppercase outline-none focus:ring-2"
                value={cupom}
                onChange={(e) => onCupomChange(e.target.value)}
              />
              <button
                type="button"
                className="bg-secondary text-secondary-foreground hover:bg-muted h-10 rounded-lg px-4 text-xs font-bold tracking-wider transition-colors"
                onClick={onAplicarCupom}
              >
                APLICAR
              </button>
            </div>
            {mensagemCupom ? (
              <p className="text-muted-foreground text-xs">{mensagemCupom}</p>
            ) : null}

            <div className="border-border space-y-2.5 border-t pt-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatarPrecoCarrinho(totais?.subtotalEmCentavos ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-medium">
                  {(totais?.freteEmCentavos ?? 0) === 0
                    ? "Grátis"
                    : formatarPrecoCarrinho(totais?.freteEmCentavos ?? 0)}
                </span>
              </div>
              {(totais?.descontoEmCentavos ?? 0) > 0 ? (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Desconto</span>
                  <span className="font-medium">
                    -{formatarPrecoCarrinho(totais?.descontoEmCentavos ?? 0)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="text-right font-medium">
                  {formaPagamento === "pix"
                    ? "PIX"
                    : parcelamentoCartao
                      ? `${parcelamentoCartao.parcelas}x de ${parcelamentoCartao.valor}`
                      : `${parcelasCartao}x no cartão`}
                </span>
              </div>
              {formaPagamento === "pix" &&
              (resumoCheckout?.pagamentos.pix.economiaEmCentavos ?? 0) > 0 ? (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Economia no PIX</span>
                  <span className="font-medium">
                    {formatarPrecoCarrinho(
                      resumoCheckout?.pagamentos.pix.economiaEmCentavos ?? 0,
                    )}
                  </span>
                </div>
              ) : null}
              <div className="flex items-end justify-between pt-3">
                <span className="text-base font-semibold">Total</span>
                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight">
                    {formatarPrecoCarrinho(totalAtual)}
                  </p>
                  {formaPagamento === "cartao" && parcelamentoCartao ? (
                    <p className="text-muted-foreground text-xs font-medium">
                      {parcelamentoCartao.semJuros
                        ? "Parcelamento sem juros"
                        : `Total com juros: ${parcelamentoCartao.total}`}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                !isFormValid ||
                carregandoPagamento ||
                !resumoCheckout ||
                !pagamentoDisponivel
              }
              className="bg-primary text-primary-foreground mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-bold tracking-wide shadow-lg transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lock className="size-4" />
              {carregandoPagamento
                ? "Processando..."
                : "FINALIZAR PEDIDO COM SEGURANÇA"}
            </button>

            <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-[11px]">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Compra 100% segura · Dados protegidos por SSL
            </p>
          </div>
        </div>

        <div className="border-border bg-card shadow-card space-y-4 rounded-2xl border p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <p className="text-muted-foreground text-xs leading-relaxed">
              Seus dados são protegidos por criptografia SSL de 256 bits e
              processados em ambiente{" "}
              <strong className="text-foreground">PCI-DSS Compliant</strong>.
              Não armazenamos dados do seu cartão.
            </p>
          </div>
          <div className="border-border grid grid-cols-3 gap-2 border-t pt-4">
            <div className="border-border bg-background flex flex-col items-center gap-1 rounded-lg border py-2 text-center">
              <span className="text-emerald-600">
                <Lock className="size-3.5" />
              </span>
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                SSL 256-bit
              </span>
            </div>
            <div className="border-border bg-background flex flex-col items-center gap-1 rounded-lg border py-2 text-center">
              <span className="text-emerald-600">
                <ShieldCheck className="size-3.5" />
              </span>
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                PCI-DSS
              </span>
            </div>
            <div className="border-border bg-background flex flex-col items-center gap-1 rounded-lg border py-2 text-center">
              <span className="text-emerald-600">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Antifraude
              </span>
            </div>
          </div>
        </div>

        <div className="text-muted-foreground flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase">
          <Lock className="size-3" />
          <span>SSL · PCI Compliant · Ambiente seguro</span>
        </div>
      </div>
    </aside>
  );
}
