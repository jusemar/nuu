"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useQuitarComissao } from "../../../hooks/painel-comissoes/use-painel-comissoes";
import { formatarCentavosHistoricos } from "../../../lib/painel-comissoes/formatar-valores";
import { quitarComissaoSchema } from "../../../schemas/painel-comissoes/painel.schema";
/** Confirma exclusivamente um pagamento externo já realizado, pelo valor integral histórico. */
export function QuitacaoManual({ id, valor }: { id: string; valor: string }) {
  const form = useForm<
    z.input<typeof quitarComissaoSchema>,
    unknown,
    z.output<typeof quitarComissaoSchema>
  >({
    resolver: zodResolver(quitarComissaoSchema),
    defaultValues: {
      comissaoId: id,
      data: new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
      }).format(new Date()),
      referencia: "",
      observacao: "",
    },
  });
  const gravar = useQuitarComissao();
  return (
    <form
      className="space-y-3 rounded-lg border p-4"
      onSubmit={form.handleSubmit((d) => gravar.mutate(d))}
    >
      <h3 className="font-semibold">Registrar quitação externa</h3>
      <p className="text-muted-foreground text-sm">
        Registra a quitação integral de {formatarCentavosHistoricos(valor)} já
        realizada por outro meio. Não executa transferência ou Pix.
      </p>
      <Label htmlFor="quitacao-data">Data da quitação</Label>
      <Input
        id="quitacao-data"
        type="date"
        className="h-11 min-w-0"
        {...form.register("data")}
      />
      <Label htmlFor="quitacao-referencia">Referência (opcional)</Label>
      <Input
        id="quitacao-referencia"
        className="h-11"
        maxLength={150}
        {...form.register("referencia")}
      />
      <Label htmlFor="quitacao-observacao">Observação interna (opcional)</Label>
      <Textarea
        id="quitacao-observacao"
        maxLength={500}
        {...form.register("observacao")}
      />
      {Object.values(form.formState.errors).map((e, i) => (
        <p key={i} role="alert" className="text-destructive text-sm">
          {e.message}
        </p>
      ))}
      <Button
        type="submit"
        className="min-h-11 w-full whitespace-normal"
        disabled={gravar.isPending}
      >
        {gravar.isPending
          ? "Registrando…"
          : "Confirmar registro de quitação externa"}
      </Button>
    </form>
  );
}
