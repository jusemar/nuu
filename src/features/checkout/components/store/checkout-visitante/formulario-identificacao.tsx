"use client";

import { AlertCircle, CheckCircle2, User, Info } from "lucide-react";
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
    <div className={id === "documento" ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          autoComplete={autoComplete}
          className={cn(
            "h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15",
            mostrarSucesso &&
              "border-emerald-300 bg-emerald-50/40 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-emerald-900 dark:bg-emerald-950/20",
            mostrarErro &&
              "border-destructive bg-destructive/10 focus-visible:border-destructive focus-visible:ring-destructive/20",
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
          {mostrarErro ? <AlertCircle className="size-4 text-destructive" /> : null}
        </div>
      </div>

      <div className="min-h-4 mt-1.5">
        {mostrarErro ? (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <Info className="size-3" />
            {error}
          </p>
        ) : null}
        {mostrarSucesso ? (
          <p className="text-xs text-emerald-600 transition-opacity duration-200">
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
    <section className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-card">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <User className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Identificação</h2>
            <p className="text-xs text-muted-foreground">Seus dados de contato e nota fiscal.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Controller
            control={control}
            name="nome"
            render={({ field, fieldState }) => (
              <CampoPremium
                id="nome"
                autoComplete="name"
                error={fieldState.error?.message}
                label="Nome completo"
                placeholder="Como no documento"
                successMessage="Nome completo preenchido"
                valid={validarNome(field.value || "")}
                value={field.value || ""}
                onBlur={field.onBlur}
                onChange={(valor) => field.onChange(aplicarMascaraNome(valor))}
              />
            )}
          />
        </div>

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

        <div className="md:col-span-2">
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
                  placeholder="000.000.000-00"
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
