import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CheckoutVisitanteSchema } from "../../../schemas/checkout.schema";

type FormularioEnderecoProps = {
  register: UseFormRegister<CheckoutVisitanteSchema>;
  setValue: UseFormSetValue<CheckoutVisitanteSchema>;
  errors: FieldErrors<CheckoutVisitanteSchema>;
  buscandoCep: boolean;
  mensagemCep: string | null;
  onConsultarCep: (cep: string) => void;
};

export function FormularioEndereco({
  register,
  setValue,
  errors,
  buscandoCep,
  mensagemCep,
  onConsultarCep,
}: FormularioEnderecoProps) {
  const cepField = register("cep");

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          Endereço de entrega
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          O frete é estimado para o checkout visitante.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-6">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            autoComplete="postal-code"
            placeholder="00000-000"
            {...cepField}
            onChange={(event) => {
              cepField.onChange(event);

              if (event.currentTarget.value.replace(/\D/g, "").length === 8) {
                onConsultarCep(event.currentTarget.value);
              }
            }}
            onBlur={(event) => {
              cepField.onBlur(event);
              onConsultarCep(event.currentTarget.value);
            }}
          />
          {errors.cep ? (
            <p className="text-xs text-red-600">{errors.cep.message}</p>
          ) : null}
          {buscandoCep ? (
            <p className="text-xs text-zinc-500">Buscando CEP...</p>
          ) : null}
          {mensagemCep ? (
            <p className="text-xs text-zinc-500">{mensagemCep}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-4">
          <Label htmlFor="rua">Rua</Label>
          <Input id="rua" autoComplete="address-line1" placeholder="Nome da rua" {...register("rua")} />
          {errors.rua ? (
            <p className="text-xs text-red-600">{errors.rua.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="numero">Número</Label>
          <Input id="numero" placeholder="Número" {...register("numero")} />
          {errors.numero ? (
            <p className="text-xs text-red-600">{errors.numero.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-4">
          <Label htmlFor="complemento">Complemento</Label>
          <Input id="complemento" placeholder="Apartamento, bloco, etc." {...register("complemento")} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bairro">Bairro</Label>
          <Input id="bairro" placeholder="Seu bairro" {...register("bairro")} />
          {errors.bairro ? (
            <p className="text-xs text-red-600">{errors.bairro.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-3">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            autoComplete="address-level2"
            placeholder="Sua cidade"
            {...register("cidade")}
          />
          {errors.cidade ? (
            <p className="text-xs text-red-600">{errors.cidade.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="estado">UF</Label>
          <Input
            id="estado"
            maxLength={2}
            autoComplete="address-level1"
            placeholder="UF"
            {...register("estado", {
              onChange: (event) => {
                setValue("estado", event.target.value.toUpperCase());
              },
            })}
          />
          {errors.estado ? (
            <p className="text-xs text-red-600">{errors.estado.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-6">
          <Label htmlFor="observacao">Observação para entrega</Label>
          <Input
            id="observacao"
            placeholder="Ex: portaria, ponto de referência, vizinho"
            {...register("observacao")}
          />
        </div>
      </div>
    </section>
  );
}
