import type { UseFormRegister, UseFormSetValue } from "react-hook-form";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
    <Accordion
      className="rounded-lg border border-zinc-200 px-4 dark:border-zinc-800"
      type="single"
      collapsible
      defaultValue="pagamento"
    >
      <AccordionItem value="pagamento">
        <AccordionTrigger className="hover:no-underline">
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Pagamento
            </h2>
            <p className="mt-1 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              Escolha Pix ou cartão de crédito.
            </p>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <div className="grid gap-3">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 has-[:checked]:border-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:has-[:checked]:border-zinc-100">
              <div className="flex items-start gap-3">
                <input
                  className="mt-1"
                  type="radio"
                  value="pix"
                  {...register("formaPagamento")}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      Pix
                    </span>
                    {formaPagamento === "pix" ? (
                      <Badge variant="secondary">Selecionado</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Pagamento à vista com confirmação rápida.
                  </p>
                </div>
              </div>
            </label>

            <label className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 has-[:checked]:border-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:has-[:checked]:border-zinc-100">
              <div className="flex items-start gap-3">
                <input
                  className="mt-1"
                  type="radio"
                  value="cartao"
                  {...register("formaPagamento")}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      Cartão de crédito
                    </span>
                    {formaPagamento === "cartao" ? (
                      <Badge variant="secondary">Selecionado</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Escolha o parcelamento antes de pagar.
                  </p>

                  {formaPagamento === "cartao" ? (
                    <div className="mt-4 max-w-xs">
                      <Select
                        value={String(parcelasCartao)}
                        onValueChange={(value) => {
                          setValue("parcelasCartao", Number(value));
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione as parcelas" />
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
                  ) : null}
                </div>
              </div>
            </label>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
