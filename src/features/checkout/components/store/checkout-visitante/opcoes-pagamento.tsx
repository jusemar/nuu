import { CreditCard, Lock, Tag, Zap } from "lucide-react";
import type { UseFormRegister, UseFormSetValue } from "react-hook-form";

import { formatarPrecoCarrinho } from "@/features/carrinho";

import type { CheckoutVisitanteSchema } from "../../../schemas/checkout.schema";
import type { ResumoCheckoutCalculado } from "../../../types/checkout.types";

type OpcoesPagamentoProps = {
  formaPagamento: "pix" | "cartao";
  parcelasCartao?: number;
  resumoCheckout: ResumoCheckoutCalculado | null;
  register: UseFormRegister<CheckoutVisitanteSchema>;
  setValue: UseFormSetValue<CheckoutVisitanteSchema>;
};

export function OpcoesPagamento({
  formaPagamento,
  parcelasCartao = 1,
  resumoCheckout,
  register,
  setValue,
}: OpcoesPagamentoProps) {
  const pixAtivo = resumoCheckout?.pagamentos.pix.ativo ?? false;
  const cartaoAtivo = resumoCheckout?.pagamentos.cartao.ativo ?? false;
  const parcelamentosCartao =
    resumoCheckout?.pagamentos.cartao.parcelamentos ?? [];
  const parcelamentoSelecionado =
    parcelamentosCartao.find(
      (parcela) => parcela.parcelas === parcelasCartao,
    ) ?? parcelamentosCartao[0];

  return (
    <section className="border-border bg-card shadow-card rounded-2xl border p-6 md:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-lg">
            <CreditCard className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Pagamento</h2>
            <p className="text-muted-foreground text-xs">
              Escolha uma única forma de pagamento para este pedido.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-600 uppercase dark:bg-emerald-900/30 dark:text-emerald-400">
          <Lock className="size-3" /> SSL
        </span>
      </div>

      <div role="radiogroup" className="grid grid-cols-2 gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={formaPagamento === "pix"}
          disabled={!pixAtivo}
          className={
            "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-55 " +
            (formaPagamento === "pix"
              ? "border-primary bg-accent ring-primary ring-1"
              : "border-border bg-card hover:border-primary/40")
          }
          onClick={() => {
            if (!pixAtivo) return;
            setValue("formaPagamento", "pix", {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        >
          <span
            className={
              "flex size-7 shrink-0 items-center justify-center rounded-md " +
              (formaPagamento === "pix"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground")
            }
          >
            <Zap className="size-4" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[13px] font-semibold">PIX</span>
            <span className="text-muted-foreground block truncate text-[11px]">
              {pixAtivo
                ? resumoCheckout?.pagamentos.pix.total
                : "Indisponível para este pedido"}
            </span>
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={formaPagamento === "cartao"}
          disabled={!cartaoAtivo}
          className={
            "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-55 " +
            (formaPagamento === "cartao"
              ? "border-primary bg-accent ring-primary ring-1"
              : "border-border bg-card hover:border-primary/40")
          }
          onClick={() => {
            if (!cartaoAtivo) return;
            setValue("formaPagamento", "cartao", {
              shouldDirty: true,
              shouldValidate: true,
            });
            if (parcelamentoSelecionado) {
              setValue("parcelasCartao", parcelamentoSelecionado.parcelas, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
        >
          <span
            className={
              "flex size-7 shrink-0 items-center justify-center rounded-md " +
              (formaPagamento === "cartao"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground")
            }
          >
            <CreditCard className="size-4" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[13px] font-semibold">Cartão</span>
            <span className="text-muted-foreground block truncate text-[11px]">
              {cartaoAtivo && parcelamentoSelecionado
                ? `${parcelamentoSelecionado.parcelas}x de ${parcelamentoSelecionado.valor}`
                : "Indisponível para este pedido"}
            </span>
          </span>
        </button>

        <input type="hidden" {...register("formaPagamento")} />
      </div>

      <div className="mt-4">
        {formaPagamento === "pix" && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
            <Tag className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <p className="text-foreground text-[13px] leading-relaxed">
              QR Code gerado após confirmar o pedido. Economia no PIX:{" "}
              <strong className="text-emerald-600">
                {formatarPrecoCarrinho(
                  resumoCheckout?.pagamentos.pix.economiaEmCentavos ?? 0,
                )}
              </strong>
              .
            </p>
          </div>
        )}

        {formaPagamento === "cartao" && (
          <div className="animate-in slide-in-from-top-2 fade-in grid grid-cols-1 gap-2 duration-300 sm:grid-cols-2">
            {parcelamentosCartao.map((parcela) => {
              const selecionada = parcelasCartao === parcela.parcelas;

              return (
                <button
                  key={parcela.parcelas}
                  type="button"
                  className={
                    "rounded-lg border px-3 py-2.5 text-left transition-all " +
                    (selecionada
                      ? "border-primary bg-accent ring-primary ring-1"
                      : "border-border bg-background hover:border-primary/40")
                  }
                  onClick={() =>
                    setValue("parcelasCartao", parcela.parcelas, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <span className="block text-[13px] font-semibold">
                    {parcela.parcelas}x de {parcela.valor}
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    {parcela.semJuros ? "Sem juros" : `Total ${parcela.total}`}
                  </span>
                </button>
              );
            })}
            <p className="text-muted-foreground text-[11px] leading-relaxed sm:col-span-2">
              Os dados do cartão serão informados no ambiente seguro da Stripe.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
