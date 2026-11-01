"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  useConfiguracaoProdutoJaaa,
  useSalvarJaaa,
} from "../../../hooks/jaaa/use-jaaa";
const schema = z.object({ autorizacaoId: z.uuid().or(z.literal("")) });
export function ConfiguracaoProdutoJaaa({ id }: { id: string }) {
  const q = useConfiguracaoProdutoJaaa(id);
  if (q.isPending) return <p role="status">Carregando atendimento…</p>;
  if (q.isError)
    return <p role="alert">Não foi possível consultar o atendimento.</p>;
  return (
    <FormularioAtendimento
      key={JSON.stringify(q.data)}
      produtoId={id}
      dados={q.data}
    />
  );
}
function FormularioAtendimento({
  produtoId,
  dados,
}: {
  produtoId: string;
  dados: {
    opcoes: { id: string; nome: string; fornecedor: string }[];
    selecionado: string | null;
  };
}) {
  const form = useForm<z.infer<typeof schema>>({
      resolver: zodResolver(schema),
      defaultValues: { autorizacaoId: dados.selecionado ?? "" },
    }),
    gravar = useSalvarJaaa("produto");
  const indisponivel =
    dados.selecionado && !dados.opcoes.some((o) => o.id === dados.selecionado);
  return (
    <form
      className="space-y-3 border-t pt-4"
      onSubmit={form.handleSubmit((d) =>
        gravar.mutate({ produtoId, autorizacaoId: d.autorizacaoId || null }),
      )}
    >
      <Label htmlFor={`atendimento-${produtoId}`}>
        Representante para atendimento
      </Label>
      <select
        id={`atendimento-${produtoId}`}
        className="border-input bg-background min-h-11 w-full min-w-0 rounded-md border px-3"
        {...form.register("autorizacaoId")}
      >
        <option value="">Atendimento padrão da Nooo</option>
        {indisponivel && (
          <option value={dados.selecionado!}>
            Atendimento configurado indisponível
          </option>
        )}
        {dados.opcoes.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome} — {o.fornecedor}
          </option>
        ))}
      </select>
      <p className="text-muted-foreground text-sm">
        Define apenas quem atende o cliente. Não altera comissões nem vendas
        anteriores. Destinos indisponíveis usam o atendimento padrão.
      </p>
      <Button className="min-h-11 w-full" disabled={gravar.isPending}>
        Salvar atendimento do produto
      </Button>
    </form>
  );
}
