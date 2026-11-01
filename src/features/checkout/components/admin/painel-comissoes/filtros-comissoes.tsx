"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useOpcoesComissoes } from "../../../hooks/painel-comissoes/use-painel-comissoes";
import { ROTULOS_SITUACAO } from "../../../lib/painel-comissoes/situacao-comissao";
import type { FiltrosPainelComissoes } from "../../../types/painel-comissoes/painel.types";
const schema = z
  .object({
    de: z.iso.date().or(z.literal("")),
    ate: z.iso.date().or(z.literal("")),
    busca: z.string().max(150),
    situacao: z.string(),
    representanteId: z.string(),
    fornecedorId: z.string(),
  })
  .refine((f) => !f.de || !f.ate || f.de <= f.ate, {
    message: "Período inválido.",
    path: ["ate"],
  });
export function FiltrosComissoes({
  gestor,
  aplicar,
}: {
  gestor: boolean;
  aplicar: (f: FiltrosPainelComissoes) => void;
}) {
  const opcoes = useOpcoesComissoes(gestor);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      de: "",
      ate: "",
      busca: "",
      situacao: "",
      representanteId: "",
      fornecedorId: "",
    },
  });
  return (
    <form
      className="bg-card grid min-w-0 gap-3 rounded-xl border p-4 sm:grid-cols-2 xl:grid-cols-4"
      onSubmit={form.handleSubmit((d) =>
        aplicar({
          ...(d.de ? { de: d.de } : {}),
          ...(d.ate ? { ate: d.ate } : {}),
          ...(d.busca ? { busca: d.busca } : {}),
          ...(d.situacao
            ? { situacao: d.situacao as FiltrosPainelComissoes["situacao"] }
            : {}),
          ...(gestor && d.representanteId
            ? { representanteId: d.representanteId }
            : {}),
          ...(gestor && d.fornecedorId ? { fornecedorId: d.fornecedorId } : {}),
        }),
      )}
    >
      <div className="min-w-0 space-y-2">
        <Label htmlFor="comissao-de">Data do pedido: de</Label>
        <Input
          className="h-11 w-full min-w-0"
          id="comissao-de"
          type="date"
          {...form.register("de")}
        />
      </div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor="comissao-ate">Até</Label>
        <Input
          className="h-11 w-full min-w-0"
          id="comissao-ate"
          type="date"
          {...form.register("ate")}
        />
        {form.formState.errors.ate && (
          <p role="alert">{form.formState.errors.ate.message}</p>
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor="comissao-busca">Pedido, produto ou SKU</Label>
        <Input
          className="h-11"
          id="comissao-busca"
          {...form.register("busca")}
        />
      </div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor="comissao-situacao">Situação</Label>
        <select
          id="comissao-situacao"
          className="border-input bg-background h-11 w-full min-w-0 rounded-md border px-2"
          {...form.register("situacao")}
        >
          <option value="">Todas</option>
          {Object.entries(ROTULOS_SITUACAO)
            .filter(([v]) => gestor || v !== "aguardando_confirmacao")
            .map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
        </select>
      </div>
      {gestor && (
        <>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="comissao-representante">Representante</Label>
            <select
              id="comissao-representante"
              className="border-input bg-background h-11 w-full min-w-0 rounded-md border px-2"
              {...form.register("representanteId")}
            >
              <option value="">Todos</option>
              {opcoes.data?.representantes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="comissao-fornecedor">Fornecedor</Label>
            <select
              id="comissao-fornecedor"
              className="border-input bg-background h-11 w-full min-w-0 rounded-md border px-2"
              {...form.register("fornecedorId")}
            >
              <option value="">Todos</option>
              {opcoes.data?.fornecedores.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      <Button type="submit" className="min-h-11 self-end">
        Aplicar filtros
      </Button>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 self-end"
        onClick={() => {
          form.reset();
          aplicar({});
        }}
      >
        Limpar filtros
      </Button>
    </form>
  );
}
