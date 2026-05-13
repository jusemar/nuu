import type { UseFormRegister, FieldErrors } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CheckoutVisitanteSchema } from "../../../schemas/checkout.schema";

type FormularioIdentificacaoProps = {
  register: UseFormRegister<CheckoutVisitanteSchema>;
  errors: FieldErrors<CheckoutVisitanteSchema>;
};

export function FormularioIdentificacao({
  register,
  errors,
}: FormularioIdentificacaoProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          Identificação
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Usaremos estes dados para enviar informações do pedido.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" autoComplete="name" {...register("nome")} />
          {errors.nome ? (
            <p className="text-xs text-red-600">{errors.nome.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" autoComplete="tel" {...register("telefone")} />
          {errors.telefone ? (
            <p className="text-xs text-red-600">{errors.telefone.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="documento">CPF ou CNPJ</Label>
          <Input id="documento" {...register("documento")} />
          {errors.documento ? (
            <p className="text-xs text-red-600">{errors.documento.message}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
