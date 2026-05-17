import { Check, Truck } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";

import { formatarPrecoCarrinho } from "@/features/carrinho";

import { OPCOES_FRETE_CHECKOUT } from "../../../constants/checkout-steps";
import type { CheckoutVisitanteSchema } from "../../../schemas/checkout.schema";

type OpcoesFreteProps = {
  freteSelecionado: string;
  register: UseFormRegister<CheckoutVisitanteSchema>;
};

export function OpcoesFrete({ freteSelecionado, register }: OpcoesFreteProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-card">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Truck className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Frete</h2>
            <p className="text-xs text-muted-foreground">Selecione a modalidade de entrega.</p>
          </div>
        </div>
      </div>

      <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {OPCOES_FRETE_CHECKOUT.map((opcao) => {
          const selecionado = freteSelecionado === opcao.id;

          return (
            <button
              key={opcao.id}
              type="button"
              role="radio"
              aria-checked={selecionado}
              className={
                "group relative flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-all " +
                (selecionado
                  ? "border-primary bg-accent ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/40")
              }
              onClick={() => {
                const input = document.querySelector(`input[name="freteId"]`) as HTMLInputElement;
                if (input) {
                  input.value = opcao.id;
                  input.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-[13px] font-semibold leading-tight">{opcao.nome}</span>
                {selecionado && <Check className="size-3.5 text-primary" strokeWidth={3} />}
              </div>
              <span className="text-[11px] text-muted-foreground">{opcao.prazo}</span>
              <span
                className={
                  "text-[12px] font-bold " +
                  (opcao.valorEmCentavos === 0 ? "text-emerald-600" : "text-foreground")
                }
              >
                {opcao.valorEmCentavos === 0
                  ? "Grátis"
                  : formatarPrecoCarrinho(opcao.valorEmCentavos)}
              </span>
            </button>
          );
        })}
        <input
          type="radio"
          value={freteSelecionado}
          {...register("freteId")}
          className="sr-only"
        />
      </div>
    </section>
  );
}
