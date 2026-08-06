"use client";

import { AlertCircle, CheckCircle2, Loader2, Power, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { alternarKillSwitchPagamentoNaEntregaAdmin } from "../../actions/admin/alternar-kill-switch-pagamento-na-entrega-admin";
import { ESTADO_INICIAL_KILL_SWITCH } from "../../constants/pagamento-na-entrega.constants";

function BotaoAlternar({ ativo }: { ativo: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      variant={ativo ? "outline" : "default"}
      disabled={pending}
    >
      {pending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
      {ativo ? "Desligar na loja" : "Ligar na loja"}
    </Button>
  );
}

/**
 * Chave geral do pagamento na entrega.
 *
 * Fica no topo da página porque é o contexto que mais importa: nenhuma configuração abaixo
 * chega ao cliente enquanto ela estiver desligada. É também o mecanismo de ativação
 * gradual — o código sobe inerte e o gestor escolhe a hora, sem depender de deploy.
 *
 * O botão envia o estado OPOSTO ao atual. Um switch daria a impressão de que a mudança já
 * aconteceu ao ser arrastado; aqui a ação é explícita e só vale depois do envio.
 */
export function ChaveGeralPagamentoNaEntrega({ ativo }: { ativo: boolean }) {
  const router = useRouter();
  const [estado, alternar] = useActionState(
    alternarKillSwitchPagamentoNaEntregaAdmin,
    ESTADO_INICIAL_KILL_SWITCH,
  );

  useEffect(() => {
    if (estado.sucesso) router.refresh();
  }, [estado.sucesso, router]);

  return (
    <form
      action={alternar}
      className={
        "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between " +
        (ativo
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
          : "border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30")
      }
    >
      {/* Envia o oposto do estado atual. Desligado não manda o campo — é assim que o
          checkbox se comporta em HTML, e a action já trata a ausência como false. */}
      {!ativo && (
        <input type="hidden" name="pagamentoNaEntregaAtivo" value="on" />
      )}

      <div className="flex items-start gap-3">
        {ativo ? (
          <Power className="mt-0.5 size-4 shrink-0 text-emerald-600" />
        ) : (
          <PowerOff className="mt-0.5 size-4 shrink-0 text-amber-600" />
        )}
        <div className="space-y-1 text-sm">
          <p
            className={
              "font-medium " +
              (ativo
                ? "text-emerald-900 dark:text-emerald-200"
                : "text-amber-900 dark:text-amber-200")
            }
          >
            {ativo
              ? "Pagamento na entrega está ligado na loja"
              : "Pagamento na entrega está desligado na loja"}
          </p>
          <p
            className={
              ativo
                ? "text-emerald-800 dark:text-emerald-300"
                : "text-amber-800 dark:text-amber-300"
            }
          >
            {ativo
              ? "A opção aparece para o cliente nos pedidos que atenderem às regras configuradas abaixo."
              : "As configurações abaixo podem ser preenchidas e salvas, mas nenhuma opção aparece para o cliente."}
          </p>
          {estado.mensagem !== null && (
            <p className="flex items-center gap-1.5 pt-1 text-xs">
              {estado.sucesso ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <AlertCircle className="size-3.5" />
              )}
              {estado.mensagem}
            </p>
          )}
        </div>
      </div>

      <BotaoAlternar ativo={ativo} />
    </form>
  );
}
