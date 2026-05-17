import { Lock, Tag } from "lucide-react";
import type { UseFormRegister, UseFormSetValue } from "react-hook-form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatarPrecoCarrinho } from "@/features/carrinho";

import type { CheckoutVisitanteSchema } from "../../../schemas/checkout.schema";

type OpcoesPagamentoProps = {
  formaPagamento: "pix" | "cartao";
  parcelasCartao?: number;
  totalEmCentavos: number;
  register: UseFormRegister<CheckoutVisitanteSchema>;
  setValue: UseFormSetValue<CheckoutVisitanteSchema>;
};

export function OpcoesPagamento({
  formaPagamento,
  parcelasCartao = 1,
  totalEmCentavos,
  register,
  setValue,
}: OpcoesPagamentoProps) {
  const parcelas = Array.from({ length: 12 }, (_, index) => index + 1);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-card">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold">Pagamento</h2>
            <p className="text-xs text-muted-foreground">Transação criptografada de ponta a ponta.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <Lock className="size-3" /> SSL
        </span>
      </div>

      <div role="radiogroup" className="grid grid-cols-2 gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={formaPagamento === "pix"}
          className={
            "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all " +
            (formaPagamento === "pix"
              ? "border-primary bg-accent ring-1 ring-primary"
              : "border-border bg-card hover:border-primary/40")
          }
          onClick={() => {
            const input = document.querySelector(`input[name="formaPagamento"]`) as HTMLInputElement;
            if (input) {
              input.value = "pix";
              input.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }}
        >
          <span
            className={
              "flex size-7 shrink-0 items-center justify-center rounded-md " +
              (formaPagamento === "pix" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[13px] font-semibold">PIX</span>
            <span className="block truncate text-[11px] text-muted-foreground">5% OFF · imediato</span>
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={formaPagamento === "cartao"}
          className={
            "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all " +
            (formaPagamento === "cartao"
              ? "border-primary bg-accent ring-1 ring-primary"
              : "border-border bg-card hover:border-primary/40")
          }
          onClick={() => {
            const input = document.querySelector(`input[name="formaPagamento"]`) as HTMLInputElement;
            if (input) {
              input.value = "cartao";
              input.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }}
        >
          <span
            className={
              "flex size-7 shrink-0 items-center justify-center rounded-md " +
              (formaPagamento === "cartao" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[13px] font-semibold">Cartão</span>
            <span className="block truncate text-[11px] text-muted-foreground">até 12x</span>
          </span>
        </button>

        <input
          type="radio"
          value={formaPagamento}
          {...register("formaPagamento")}
          className="sr-only"
        />
      </div>

      <div className="mt-4">
        {formaPagamento === "pix" && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
            <Tag className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <p className="text-[13px] leading-relaxed text-foreground">
              QR Code gerado após confirmar o pedido. Aprovação em segundos com{" "}
              <strong className="text-emerald-600">5% de desconto</strong>.
            </p>
          </div>
        )}

        {formaPagamento === "cartao" && (
          <div className="grid grid-cols-1 gap-3 animate-in slide-in-from-top-2 fade-in duration-300 md:grid-cols-6">
            <div className="md:col-span-6">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Número do cartão
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                autoComplete="cc-number"
                className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="md:col-span-6">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Nome no cartão
              </label>
              <input
                type="text"
                placeholder="Como impresso"
                autoComplete="cc-name"
                className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Validade
              </label>
              <input
                type="text"
                placeholder="MM/AA"
                autoComplete="cc-exp"
                className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                autoComplete="cc-csc"
                className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Parcelas
              </label>
              <Select
                value={String(parcelasCartao)}
                onValueChange={(value) => {
                  setValue("parcelasCartao", Number(value));
                }}
              >
                <SelectTrigger className="h-11 w-full rounded-lg border border-border bg-background text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {parcelas.map((parcela) => (
                    <SelectItem key={parcela} value={String(parcela)}>
                      {parcela}x de{" "}
                      {formatarPrecoCarrinho(
                        Math.ceil(totalEmCentavos / parcela),
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
