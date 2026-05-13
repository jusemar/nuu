import type { UseFormRegister } from "react-hook-form";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { formatarPrecoCarrinho } from "@/features/carrinho";

import { OPCOES_FRETE_CHECKOUT } from "../../../constants/checkout-steps";
import type { CheckoutVisitanteSchema } from "../../../schemas/checkout.schema";

type OpcoesFreteProps = {
  freteSelecionado: string;
  register: UseFormRegister<CheckoutVisitanteSchema>;
};

export function OpcoesFrete({ freteSelecionado, register }: OpcoesFreteProps) {
  return (
    <Accordion
      className="rounded-lg border border-zinc-200 px-4 dark:border-zinc-800"
      type="single"
      collapsible
      defaultValue="frete"
    >
      <AccordionItem value="frete">
        <AccordionTrigger className="hover:no-underline">
          <div>
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Frete
            </h2>
            <p className="mt-1 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              Escolha uma opção para ver o total antes do pagamento.
            </p>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <div className="grid gap-3">
            {OPCOES_FRETE_CHECKOUT.map((opcao) => {
              const selecionado = freteSelecionado === opcao.id;

              return (
                <label
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 has-[:checked]:border-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:has-[:checked]:border-zinc-100"
                  key={opcao.id}
                >
                  <div className="flex items-start gap-3">
                    <input
                      className="mt-1"
                      type="radio"
                      value={opcao.id}
                      {...register("freteId")}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {opcao.nome}
                        </span>
                        {selecionado ? (
                          <Badge variant="secondary">Selecionado</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {opcao.prazo}
                      </p>
                    </div>
                  </div>

                  <strong className="text-sm text-zinc-950 dark:text-zinc-50">
                    {opcao.valorEmCentavos === 0
                      ? "Grátis"
                      : formatarPrecoCarrinho(opcao.valorEmCentavos)}
                  </strong>
                </label>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
