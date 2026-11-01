"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { criarEnderecoPublicoJaaa } from "../../../lib/jaaa/endereco-publico-jaaa";
import { identidadeJaaaSchema } from "../../../schemas/jaaa/identidade-jaaa.schema";
export type IdentidadeDemonstracao = {
  id: string;
  nome: string;
  fornecedor: string;
  identidade: string;
  ativa: boolean;
};
/** Formulário compartilhado: o pai conecta a persistência autorizada ou a prévia visual. */
export function ConfigurarIdentidadeJaaa({
  representante,
  salvar,
  pendente = false,
}: {
  representante: IdentidadeDemonstracao;
  pendente?: boolean;
  salvar: (id: string, identidade: string, ativa: boolean) => void;
}) {
  const form = useForm<
    z.input<typeof identidadeJaaaSchema>,
    unknown,
    z.output<typeof identidadeJaaaSchema>
  >({
    resolver: zodResolver(identidadeJaaaSchema),
    defaultValues: {
      identidade: representante.identidade,
      ativa: representante.ativa,
    },
  });
  const endereco = criarEnderecoPublicoJaaa(form.watch("identidade"));
  return (
    <form
      className="bg-card min-w-0 space-y-4 rounded-xl border p-4"
      onSubmit={form.handleSubmit((d) => {
        if (d.identidade) salvar(representante.id, d.identidade, d.ativa);
      })}
    >
      <div>
        <h3 className="font-semibold">{representante.nome}</h3>
        <p className="text-muted-foreground text-sm">
          {representante.fornecedor}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`identidade-${representante.id}`}>
          Usuário no Jaaa de {representante.nome}
        </Label>
        <Input
          id={`identidade-${representante.id}`}
          className="h-11"
          placeholder="@usuario"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          {...form.register("identidade")}
        />
        <p className="text-muted-foreground text-xs">
          Informe o @usuário público confirmado com o representante.
        </p>
      </div>
      {form.formState.errors.identidade && (
        <p className="text-destructive text-sm" role="alert">
          {form.formState.errors.identidade.message}
        </p>
      )}
      <Label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" className="size-5" {...form.register("ativa")} />
        Permitir atendimento pelo Jaaa
      </Label>
      {endereco ? (
        <a
          className="text-primary inline-flex min-h-11 max-w-full items-center text-sm break-all underline"
          href={endereco}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          aria-label={`Conferir endereço de ${representante.nome}`}
        >
          {endereco}
        </a>
      ) : (
        <p className="text-muted-foreground text-sm">
          Informe um usuário válido para conferir o endereço.
        </p>
      )}
      <Button className="min-h-11 w-full" type="submit" disabled={pendente}>
        Salvar Jaaa de {representante.nome}
      </Button>
    </form>
  );
}
