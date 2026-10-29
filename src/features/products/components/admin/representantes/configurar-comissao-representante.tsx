"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  configurarComissaoProdutoGestor,
  consultarComissoesProdutoGestor,
} from "../../../actions/representantes/configurar-comissao-gestor";
import { consultarPerfilProdutosAdmin } from "../../../actions/representantes/consultar-produtos-representante";
import { chavesProdutosRepresentante } from "../../../constants/representantes/query-keys";

const schema = z.object({
  tipo: z.enum(["nenhuma", "percentual", "fixa"]),
  visivel: z.boolean(),
  valor: z.string().regex(/^\d+(?:[,.]\d{1,2})?$/, "Informe um valor válido."),
});
type Configuracao = Awaited<
  ReturnType<typeof consultarComissoesProdutoGestor>
>[number];
function FormularioComissao({
  configuracao,
  produtoId,
}: {
  configuracao: Configuracao;
  produtoId: string;
}) {
  const cliente = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: configuracao.tipo ?? "nenhuma",
      visivel: configuracao.visivel,
      valor: ((configuracao.valor ?? 0) / 100).toFixed(2).replace(".", ","),
    },
  });
  const tipo = form.watch("tipo");
  const mutacao = useMutation({
    mutationFn: async (dados: z.infer<typeof schema>) => {
      const resultado = await configurarComissaoProdutoGestor({
        produtoId,
        autorizacaoId: configuracao.id,
        tipo: dados.tipo === "nenhuma" ? null : dados.tipo,
        valor:
          dados.tipo === "nenhuma"
            ? null
            : Math.round(Number(dados.valor.replace(",", ".")) * 100),
        visivel: dados.tipo !== "nenhuma" && dados.visivel,
      });
      if (!resultado.sucesso) throw new Error(resultado.mensagem);
    },
    onSuccess: async () => {
      await cliente.invalidateQueries({
        queryKey: chavesProdutosRepresentante.todas,
      });
      toast.success("Configuração de comissão atualizada.");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((d) => mutacao.mutate(d))}
    >
      <div className="space-y-2">
        <Label htmlFor="tipo-comissao">Formato</Label>
        <select
          id="tipo-comissao"
          className="border-input bg-background h-11 w-full rounded-md border px-3"
          {...form.register("tipo")}
        >
          <option value="nenhuma">Sem comissão configurada</option>
          <option value="percentual">Percentual (%)</option>
          <option value="fixa">Valor fixo (R$)</option>
        </select>
      </div>
      {tipo !== "nenhuma" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="valor-comissao">
              {tipo === "percentual" ? "Percentual (%)" : "Valor (R$)"}
            </Label>
            <Input
              id="valor-comissao"
              inputMode="decimal"
              className="h-11"
              {...form.register("valor")}
            />
            {form.formState.errors.valor && (
              <p role="alert" className="text-destructive text-sm">
                {form.formState.errors.valor.message}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="visibilidade-comissao">
              Exibir ao representante
            </Label>
            <Switch
              id="visibilidade-comissao"
              checked={form.watch("visivel")}
              onCheckedChange={(valor) =>
                form.setValue("visivel", valor, { shouldDirty: true })
              }
            />
          </div>
        </>
      )}
      <Button
        type="submit"
        className="min-h-11 w-full"
        disabled={mutacao.isPending}
      >
        {mutacao.isPending ? "Salvando…" : "Salvar configuração"}
      </Button>
    </form>
  );
}
export function ConfigurarComissaoRepresentante({
  produtoId,
}: {
  produtoId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [autorizacaoId, setAutorizacaoId] = useState("");
  const perfil = useQuery({
    queryKey: chavesProdutosRepresentante.perfil(),
    queryFn: consultarPerfilProdutosAdmin,
    staleTime: 60000,
  });
  const comissoes = useQuery({
    queryKey: [
      ...chavesProdutosRepresentante.todas,
      "comissoes-gestor",
      produtoId,
    ],
    queryFn: () => consultarComissoesProdutoGestor(produtoId),
    enabled: aberto && perfil.data?.principal === true,
  });
  if (!perfil.data?.principal) return null;
  const selecionada =
    comissoes.data?.length === 1
      ? comissoes.data[0]
      : comissoes.data?.find((c) => c.id === autorizacaoId);
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11">
          Comissão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comissão do representante</DialogTitle>
          <DialogDescription>
            Configuração de exibição por autorização individual. Não registra
            vendas ou valores ganhos.
          </DialogDescription>
        </DialogHeader>
        {comissoes.isPending ? (
          <p>Carregando autorizações…</p>
        ) : comissoes.isError ? (
          <p role="alert">Não foi possível consultar as autorizações.</p>
        ) : !comissoes.data?.length ? (
          <p className="text-muted-foreground text-sm">
            Este produto ainda não possui autorizações individuais de
            representantes.
          </p>
        ) : (
          <>
            <label className="space-y-2 text-sm">
              <span>Representante e fornecedor</span>
              <select
                className="border-input bg-background h-11 w-full rounded-md border px-3"
                value={selecionada?.id ?? ""}
                onChange={(e) => setAutorizacaoId(e.target.value)}
              >
                <option value="">Selecione a autorização</option>
                {comissoes.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} — {c.fornecedor}
                    {c.ativa ? "" : " (revogada)"}
                  </option>
                ))}
              </select>
            </label>
            {selecionada && (
              <FormularioComissao
                key={selecionada.id}
                configuracao={selecionada}
                produtoId={produtoId}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
