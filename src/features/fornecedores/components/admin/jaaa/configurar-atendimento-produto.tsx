"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import type { IdentidadeDemonstracao } from "./configurar-identidade-jaaa";
const schema = z.object({
  representanteId: z.enum(["", "fernando", "beatriz"]),
});
/** Escolha explícita e independente do comissionado; não escolhe o primeiro representante. */
export function ConfigurarAtendimentoProduto({
  opcoes,
  selecionado,
  salvar,
}: {
  opcoes: IdentidadeDemonstracao[];
  selecionado: string;
  salvar: (id: string) => void;
}) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      representanteId: schema.shape.representanteId.parse(selecionado),
    },
  });
  return (
    <form
      className="bg-card min-w-0 space-y-4 rounded-xl border p-4"
      onSubmit={form.handleSubmit((d) => salvar(d.representanteId))}
    >
      <div>
        <h3 className="font-semibold">Atendimento do produto</h3>
        <p className="text-muted-foreground text-sm">
          Mouse sem fio · SKU: NOOO-002
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="atendimento-produto">
          Representante para atendimento
        </Label>
        <select
          className="border-input bg-background min-h-11 w-full min-w-0 rounded-md border px-3"
          id="atendimento-produto"
          {...form.register("representanteId")}
        >
          <option value="">Atendimento padrão da Nooo</option>
          {opcoes
            .filter((o) => o.ativa && o.identidade)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome} — {o.fornecedor}
              </option>
            ))}
        </select>
      </div>
      <p className="text-muted-foreground text-sm">
        Esta escolha define apenas quem atende o cliente. Não altera o
        representante comissionado nem vendas anteriores.
      </p>
      <Button className="min-h-11 w-full" type="submit">
        Salvar atendimento do produto
      </Button>
    </form>
  );
}
