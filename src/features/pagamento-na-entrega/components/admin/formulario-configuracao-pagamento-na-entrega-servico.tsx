"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  ESTADO_INICIAL_SALVAR_CONFIGURACAO_PAGAMENTO_NA_ENTREGA,
  salvarConfiguracaoPagamentoNaEntregaServico,
} from "../../actions/admin/salvar-configuracao-pagamento-na-entrega-servico";
import {
  ORDEM_FORMAS_PAGAMENTO_NA_ENTREGA,
  ROTULO_FORMA_PAGAMENTO_NA_ENTREGA,
} from "../../constants/pagamento-na-entrega.constants";
import type { LinhaConfiguracaoPagamentoNaEntregaAdmin } from "../../queries/admin/listar-configuracoes-pagamento-na-entrega-servico";
import type { FormaPagamentoNaEntrega } from "../../types/pagamento-na-entrega.types";

/** Nome do campo de formulário para cada forma. Mantém o HTML e o schema em sintonia. */
const CAMPO_POR_FORMA: Record<FormaPagamentoNaEntrega, string> = {
  dinheiro: "aceitaDinheiro",
  pix_na_entrega: "aceitaPixNaEntrega",
  debito_entrega: "aceitaDebito",
  credito_entrega: "aceitaCredito",
};

/** Centavos → o valor decimal que o `input type="number"` espera. Vazio = sem limite. */
function centavosParaCampo(centavos: number | null): string {
  return centavos === null ? "" : (centavos / 100).toFixed(2);
}

function BotaoSalvar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
      Salvar configuração
    </Button>
  );
}

export function FormularioConfiguracaoPagamentoNaEntregaServico({
  linha,
}: {
  linha: LinhaConfiguracaoPagamentoNaEntregaAdmin;
}) {
  const router = useRouter();
  const [estado, executarAction] = useActionState(
    salvarConfiguracaoPagamentoNaEntregaServico,
    ESTADO_INICIAL_SALVAR_CONFIGURACAO_PAGAMENTO_NA_ENTREGA,
  );

  const configuracao = linha.configuracao;

  // Espelha a chave-mestra no estado só para habilitar/desabilitar visualmente os campos
  // dependentes. A decisão de verdade continua sendo do servidor — isto é conveniência de
  // interface, nunca validação.
  const [aceitaPagamento, setAceitaPagamento] = useState(
    configuracao?.aceitaPagamentoNaEntrega ?? false,
  );

  useEffect(() => {
    if (estado.sucesso && estado.servicoFreteId === linha.servicoFreteId) {
      router.refresh();
    }
  }, [estado.sucesso, estado.servicoFreteId, linha.servicoFreteId, router]);

  const mensagemDesteCard =
    estado.servicoFreteId === linha.servicoFreteId ? estado.mensagem : null;

  return (
    <form action={executarAction} className="space-y-5">
      <input type="hidden" name="servicoFreteId" value={linha.servicoFreteId} />

      {/* Chave-mestra do serviço */}
      <div className="flex items-start justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="space-y-1">
          <Label
            htmlFor={`aceita-${linha.servicoFreteId}`}
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Aceitar pagamento na entrega
          </Label>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Desligado, nenhuma forma vale para este serviço.
          </p>
        </div>
        <Switch
          id={`aceita-${linha.servicoFreteId}`}
          name="aceitaPagamentoNaEntrega"
          checked={aceitaPagamento}
          onCheckedChange={setAceitaPagamento}
        />
      </div>

      <fieldset
        disabled={!aceitaPagamento}
        className="space-y-5 transition-opacity disabled:opacity-50"
      >
        {/* Formas aceitas */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Formas aceitas
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {ORDEM_FORMAS_PAGAMENTO_NA_ENTREGA.map((forma) => {
              const campo = CAMPO_POR_FORMA[forma];
              const marcadoPorPadrao =
                configuracao === null
                  ? false
                  : ({
                      aceitaDinheiro: configuracao.aceitaDinheiro,
                      aceitaPixNaEntrega: configuracao.aceitaPixNaEntrega,
                      aceitaDebito: configuracao.aceitaDebito,
                      aceitaCredito: configuracao.aceitaCredito,
                    }[campo] ?? false);

              return (
                <label
                  key={forma}
                  htmlFor={`${campo}-${linha.servicoFreteId}`}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-zinc-200 p-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <input
                    id={`${campo}-${linha.servicoFreteId}`}
                    type="checkbox"
                    name={campo}
                    defaultChecked={marcadoPorPadrao}
                    className="size-4 accent-zinc-900 dark:accent-zinc-100"
                  />
                  {ROTULO_FORMA_PAGAMENTO_NA_ENTREGA[forma]}
                </label>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Faixa de valor */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor={`minimo-${linha.servicoFreteId}`}>
              Valor mínimo (R$)
            </Label>
            <Input
              id={`minimo-${linha.servicoFreteId}`}
              name="valorMinimoPedidoEmCentavos"
              type="number"
              min="0"
              step="0.01"
              placeholder="Sem limite"
              defaultValue={centavosParaCampo(
                configuracao?.valorMinimoPedidoEmCentavos ?? null,
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`maximo-${linha.servicoFreteId}`}>
              Valor máximo (R$)
            </Label>
            <Input
              id={`maximo-${linha.servicoFreteId}`}
              name="valorMaximoPedidoEmCentavos"
              type="number"
              min="0"
              step="0.01"
              placeholder="Sem limite"
              defaultValue={centavosParaCampo(
                configuracao?.valorMaximoPedidoEmCentavos ?? null,
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`maximo-dinheiro-${linha.servicoFreteId}`}>
              Limite em dinheiro (R$)
            </Label>
            <Input
              id={`maximo-dinheiro-${linha.servicoFreteId}`}
              name="valorMaximoDinheiroEmCentavos"
              type="number"
              min="0"
              step="0.01"
              placeholder="Sem limite"
              defaultValue={centavosParaCampo(
                configuracao?.valorMaximoDinheiroEmCentavos ?? null,
              )}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Acima disso, só as outras formas ficam disponíveis.
            </p>
          </div>
        </div>

        <Separator />

        {/* Troco, observações e status da configuração */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor={`troco-${linha.servicoFreteId}`}>
                Entregador leva troco
              </Label>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Desligado, o cliente precisa ter o valor exato.
              </p>
            </div>
            <Switch
              id={`troco-${linha.servicoFreteId}`}
              name="exigeTroco"
              defaultChecked={configuracao?.exigeTroco ?? true}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`observacoes-${linha.servicoFreteId}`}>
              Observações exibidas ao cliente
            </Label>
            <Textarea
              id={`observacoes-${linha.servicoFreteId}`}
              name="observacoesCliente"
              rows={3}
              maxLength={500}
              placeholder="Ex.: confirme o comprovante do PIX antes de receber a mercadoria."
              defaultValue={configuracao?.observacoesCliente ?? ""}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor={`ativo-${linha.servicoFreteId}`}>
                Configuração ativa
              </Label>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Desliga tudo sem apagar os valores já preenchidos.
              </p>
            </div>
            <Switch
              id={`ativo-${linha.servicoFreteId}`}
              name="ativo"
              defaultChecked={configuracao?.ativo ?? true}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BotaoSalvar />

        {mensagemDesteCard !== null && (
          <Badge
            variant={estado.sucesso ? "secondary" : "destructive"}
            className="gap-1.5 whitespace-normal text-left"
          >
            {estado.sucesso ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <AlertCircle className="size-3.5" />
            )}
            {mensagemDesteCard}
          </Badge>
        )}
      </div>
    </form>
  );
}
