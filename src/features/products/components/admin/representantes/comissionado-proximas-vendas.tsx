"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { definirRepresentanteComissionadoProduto } from "../../../actions/representantes/definir-comissionado-produto";
import { chavesProdutosRepresentante } from "../../../constants/representantes/query-keys";
const schema = z.object({ autorizacaoId: z.uuid().or(z.literal("")) });
/** Seleção separada da autorização de edição e da configuração de valor de cada regra. */
export function ComissionadoProximasVendas({
  produtoId,
  opcoes,
}: {
  produtoId: string;
  opcoes: {
    id: string;
    nome: string;
    fornecedor: string;
    ativa: boolean;
    comissaoAtiva: boolean;
    comissionadoProximasVendas: boolean;
  }[];
}) {
  const cliente = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      autorizacaoId: opcoes.find((o) => o.comissionadoProximasVendas)?.id ?? "",
    },
  });
  const salvar = useMutation({
    mutationFn: async (d: z.infer<typeof schema>) => {
      const r = await definirRepresentanteComissionadoProduto({
        produtoId,
        autorizacaoId: d.autorizacaoId || null,
      });
      if (!r.sucesso) throw new Error(r.mensagem);
    },
    onSuccess: async () => {
      await cliente.invalidateQueries({
        queryKey: chavesProdutosRepresentante.todas,
      });
      toast.success("Representante das próximas vendas atualizado.");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form
      className="space-y-3 rounded-lg border p-3"
      onSubmit={form.handleSubmit((d) => salvar.mutate(d))}
    >
      <Label htmlFor="comissionado-proximas-vendas">
        Representante comissionado nas próximas vendas
      </Label>
      <select
        id="comissionado-proximas-vendas"
        className="border-input bg-background min-h-11 w-full min-w-0 rounded-md border px-3"
        {...form.register("autorizacaoId")}
      >
        <option value="">Nenhum representante</option>
        {opcoes
          .filter(
            (o) => o.comissionadoProximasVendas || (o.ativa && o.comissaoAtiva),
          )
          .map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome} — {o.fornecedor}
              {!o.ativa || !o.comissaoAtiva ? " (indisponível)" : ""}
            </option>
          ))}
      </select>
      <p className="text-muted-foreground text-xs">
        O checkout congela automaticamente esta escolha em cada novo item.
        Alterações não afetam pedidos já criados.
      </p>
      <Button
        type="submit"
        className="min-h-11 w-full"
        disabled={salvar.isPending}
      >
        {salvar.isPending
          ? "Salvando…"
          : "Salvar representante das próximas vendas"}
      </Button>
    </form>
  );
}
