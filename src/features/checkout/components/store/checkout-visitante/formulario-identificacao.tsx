"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { HTMLAttributes, HTMLInputTypeAttribute } from "react";
import type { Control, FieldPath } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { useDocumentoMask } from "../../../hooks/useDocumentoMask";
import { useNomeFilter } from "../../../hooks/useNomeFilter";
import { useTelefoneMask } from "../../../hooks/useTelefoneMask";
import type { CheckoutVisitanteSchema } from "../../../schemas/checkout.schema";

type FormularioIdentificacaoProps = {
  control: Control<CheckoutVisitanteSchema>;
};

type CampoPremiumProps = {
  id: FieldPath<CheckoutVisitanteSchema>;
  label: string;
  value: string;
  error?: string;
  successMessage: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  type?: HTMLInputTypeAttribute;
  valid: boolean;
  onBlur: () => void;
  onChange: (valor: string) => void;
};

function CampoPremium({
  id,
  label,
  value,
  error,
  successMessage,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  type = "text",
  valid,
  onBlur,
  onChange,
}: CampoPremiumProps) {
  const mostrarSucesso = value.length > 0 && valid && !error;
  const mostrarErro = value.length > 0 && !!error;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          autoComplete={autoComplete}
          className={cn(
            "h-11 rounded-lg pr-10 transition-all duration-200 focus-visible:ring-2",
            mostrarSucesso &&
              "border-emerald-300 bg-emerald-50/40 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-emerald-900 dark:bg-emerald-950/20",
            mostrarErro &&
              "border-red-300 bg-red-50/40 focus-visible:border-red-500 focus-visible:ring-red-500/20 dark:border-red-900 dark:bg-red-950/20",
          )}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          type={type}
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 transition-all duration-200">
          {mostrarSucesso ? (
            <CheckCircle2 className="size-4 text-emerald-600" />
          ) : null}
          {mostrarErro ? <AlertCircle className="size-4 text-red-600" /> : null}
        </div>
      </div>

      <div className="min-h-4">
        {mostrarErro ? (
          <p className="text-xs text-red-600 transition-opacity duration-200">
            {error}
          </p>
        ) : null}
        {mostrarSucesso ? (
          <p className="text-xs text-emerald-700 transition-opacity duration-200 dark:text-emerald-400">
            {successMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function FormularioIdentificacao({
  control,
}: FormularioIdentificacaoProps) {
  const {
    aplicarMascaraDocumento,
    limparDocumento,
    obterTipoDocumento,
    validarDocumento,
  } = useDocumentoMask();
  const { aplicarMascaraTelefone, validarTelefone } = useTelefoneMask();
  const { aplicarMascaraNome, validarNome } = useNomeFilter();

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
        <div className="sm:col-span-2">
          <Controller
            control={control}
            name="nome"
            render={({ field, fieldState }) => (
              <CampoPremium
                id="nome"
                autoComplete="name"
                error={fieldState.error?.message}
                label="Nome completo"
                placeholder="Seu nome completo"
                successMessage="Nome completo preenchido"
                valid={validarNome(field.value || "")}
                value={field.value || ""}
                onBlur={field.onBlur}
                onChange={(valor) => field.onChange(aplicarMascaraNome(valor))}
              />
            )}
          />
        </div>

        <div>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <CampoPremium
                id="email"
                autoComplete="email"
                error={fieldState.error?.message}
                label="E-mail"
                placeholder="seu@email.com"
                successMessage="E-mail válido"
                type="email"
                valid={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value || "")}
                value={field.value || ""}
                onBlur={field.onBlur}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div>
          <Controller
            control={control}
            name="telefone"
            render={({ field, fieldState }) => (
              <CampoPremium
                id="telefone"
                autoComplete="tel"
                error={fieldState.error?.message}
                inputMode="numeric"
                label="Telefone"
                maxLength={15}
                placeholder="(00) 00000-0000"
                successMessage="Telefone válido"
                type="tel"
                valid={validarTelefone(field.value || "")}
                value={field.value || ""}
                onBlur={field.onBlur}
                onChange={(valor) =>
                  field.onChange(aplicarMascaraTelefone(valor))
                }
              />
            )}
          />
        </div>

        <div className="sm:col-span-2">
          <Controller
            control={control}
            name="documento"
            render={({ field, fieldState }) => {
              const tipoDocumento = obterTipoDocumento(field.value || "");
              const documentoValido = validarDocumento(field.value || "");

              return (
                <CampoPremium
                  id="documento"
                  error={fieldState.error?.message}
                  inputMode="numeric"
                  label="CPF ou CNPJ"
                  maxLength={18}
                  placeholder="CPF ou CNPJ"
                  successMessage={
                    tipoDocumento === "cnpj" ? "CNPJ válido" : "CPF válido"
                  }
                  valid={documentoValido}
                  value={field.value || ""}
                  onBlur={field.onBlur}
                  onChange={(valor) => {
                    const digitos = limparDocumento(valor);
                    field.onChange(aplicarMascaraDocumento(digitos));
                  }}
                />
              );
            }}
          />
        </div>
      </div>
    </section>
  );
}
