import { Info, MapPin } from "lucide-react";
import { useState } from "react";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import { Input } from "@/components/ui/input";

import type { CheckoutVisitanteSchema } from "../../../schemas/checkout.schema";

type FormularioEnderecoProps = {
  register: UseFormRegister<CheckoutVisitanteSchema>;
  setValue: UseFormSetValue<CheckoutVisitanteSchema>;
  watch: UseFormWatch<CheckoutVisitanteSchema>;
  errors: FieldErrors<CheckoutVisitanteSchema>;
  buscandoCep: boolean;
  mensagemCep: string | null;
  onConsultarCep: (cep: string) => void;
};

const inputClass =
  "h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15";

export function FormularioEndereco({
  register,
  setValue,
  watch,
  errors,
  buscandoCep,
  mensagemCep,
  onConsultarCep,
}: FormularioEnderecoProps) {
  const cepField = register("cep");
  const permitirEntregaVizinho = watch("permitirEntregaVizinho");

  return (
    <section className="border-border bg-card shadow-card rounded-2xl border p-6 md:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-lg">
            <MapPin className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Endereço de entrega</h2>
            <p className="text-muted-foreground text-xs">
              Para cálculo do frete e envio.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="text-muted-foreground mb-1.5 block text-[11px] font-bold tracking-wider uppercase">
            CEP
          </label>
          <Input
            id="cep"
            autoComplete="postal-code"
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
            className={inputClass}
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
            <p className="text-destructive mt-1.5 flex items-center gap-1 text-xs">
              <Info className="size-3" />
              {errors.cep.message}
            </p>
          ) : null}
          {buscandoCep ? (
            <p className="text-muted-foreground mt-1.5 text-xs">
              Buscando CEP...
            </p>
          ) : null}
          {mensagemCep ? (
            <p className="mt-1.5 text-xs text-emerald-600">{mensagemCep}</p>
          ) : null}
        </div>

        <div className="md:col-span-4">
          <label className="text-muted-foreground mb-1.5 block text-[11px] font-bold tracking-wider uppercase">
            Rua / Logradouro
          </label>
          <Input
            id="rua"
            autoComplete="address-line1"
            placeholder="Av. Paulista"
            className={inputClass}
            {...register("rua")}
          />
          {errors.rua ? (
            <p className="text-destructive mt-1.5 flex items-center gap-1 text-xs">
              <Info className="size-3" />
              {errors.rua.message}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="text-muted-foreground mb-1.5 block text-[11px] font-bold tracking-wider uppercase">
            Número
          </label>
          <Input
            id="numero"
            placeholder="123"
            className={inputClass}
            {...register("numero")}
          />
          {errors.numero ? (
            <p className="text-destructive mt-1.5 flex items-center gap-1 text-xs">
              <Info className="size-3" />
              {errors.numero.message}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-4">
          <label className="text-muted-foreground mb-1.5 block text-[11px] font-bold tracking-wider uppercase">
            Complemento (opcional)
          </label>
          <Input
            id="complemento"
            placeholder="Apto, Bloco"
            className={inputClass}
            {...register("complemento")}
          />
        </div>

        <div className="md:col-span-3">
          <label className="text-muted-foreground mb-1.5 block text-[11px] font-bold tracking-wider uppercase">
            Bairro
          </label>
          <Input
            id="bairro"
            placeholder="Bairro"
            className={inputClass}
            {...register("bairro")}
          />
          {errors.bairro ? (
            <p className="text-destructive mt-1.5 flex items-center gap-1 text-xs">
              <Info className="size-3" />
              {errors.bairro.message}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="text-muted-foreground mb-1.5 block text-[11px] font-bold tracking-wider uppercase">
            Cidade
          </label>
          <Input
            id="cidade"
            autoComplete="address-level2"
            placeholder="Cidade"
            className={inputClass}
            {...register("cidade")}
          />
          {errors.cidade ? (
            <p className="text-destructive mt-1.5 flex items-center gap-1 text-xs">
              <Info className="size-3" />
              {errors.cidade.message}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-1">
          <label className="text-muted-foreground mb-1.5 block text-[11px] font-bold tracking-wider uppercase">
            UF
          </label>
          <Input
            id="estado"
            maxLength={2}
            autoComplete="address-level1"
            placeholder="UF"
            className={inputClass}
            {...register("estado", {
              onChange: (event) => {
                setValue("estado", event.target.value.toUpperCase());
              },
            })}
          />
          {errors.estado ? (
            <p className="text-destructive mt-1.5 flex items-center gap-1 text-xs">
              <Info className="size-3" />
              {errors.estado.message}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-6">
          <label className="text-muted-foreground mb-1.5 block text-[11px] font-bold tracking-wider uppercase">
            Observação (opcional)
          </label>
          <Input
            id="observacao"
            placeholder="Ponto de referência, instruções de entrega"
            className={inputClass}
            {...register("observacao")}
          />
        </div>

        <div className="md:col-span-6">
          <label className="text-muted-foreground mb-1.5 block text-[11px] font-bold tracking-wider uppercase">
            Observação geral do cliente
          </label>
          <Input
            id="observacaoCliente"
            placeholder="Portão azul, interfone quebrado, casa fundos"
            className={inputClass}
            {...register("observacaoCliente")}
          />
          {errors.observacaoCliente ? (
            <p className="text-destructive mt-1.5 flex items-center gap-1 text-xs">
              <Info className="size-3" />
              {errors.observacaoCliente.message}
            </p>
          ) : null}
        </div>

        <div className="md:col-span-6">
          <div className="border-border bg-background/60 mt-5 rounded-xl border border-dashed p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="border-border accent-primary mt-0.5 size-4 rounded"
                {...register("permitirEntregaVizinho")}
              />
              <span className="text-sm font-medium">
                Autorizo deixar com vizinho se eu não estiver
              </span>
            </label>
          </div>
        </div>

        {permitirEntregaVizinho && (
          <div className="animate-in slide-in-from-top-2 fade-in grid grid-cols-1 gap-3 duration-300 md:col-span-6 md:grid-cols-2">
            <div>
              <Input
                id="nomeVizinho"
                aria-label="Nome do vizinho"
                placeholder="Nome do vizinho"
                className={inputClass}
                {...register("nomeVizinho")}
              />
            </div>
            <div>
              <Input
                id="enderecoVizinho"
                aria-label="Observação sobre o vizinho"
                placeholder="Casa, apartamento ou instrução"
                className={inputClass}
                {...register("observacaoVizinho")}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
