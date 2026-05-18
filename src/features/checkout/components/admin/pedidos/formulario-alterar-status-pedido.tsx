"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  PEDIDO_STATUS_LABEL,
  PEDIDO_STATUS_MANUAL_ADMIN,
} from "../../../constants/admin-pedidos";
import { alterarStatusPedidoAdmin } from "../../../actions/pedidos-admin/alterar-status-pedido-admin";
import type { PedidoStatusCheckout } from "../../../types/pedidos-pagamentos.types";

function BotaoAlterarStatus() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Alterar status
    </Button>
  );
}

export function FormularioAlterarStatusPedido({
  pedidoId,
  statusAtual,
}: {
  pedidoId: string;
  statusAtual: PedidoStatusCheckout;
}) {
  const router = useRouter();
  const [estado, executarAction] = useActionState(alterarStatusPedidoAdmin, {
    sucesso: false,
    mensagem: null,
  });

  useEffect(() => {
    if (estado.sucesso) {
      router.refresh();
    }
  }, [estado.sucesso, router]);

  return (
    <form
      action={executarAction}
      onSubmit={(evento) => {
        if (
          !window.confirm("Confirmar alteração manual do status deste pedido?")
        ) {
          evento.preventDefault();
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="pedidoId" value={pedidoId} />

      <div>
        <label
          htmlFor="status"
          className="mb-1.5 block text-xs font-medium tracking-wide text-slate-500 uppercase"
        >
          Novo status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={statusAtual}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-white px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
        >
          {PEDIDO_STATUS_MANUAL_ADMIN.map((status) => (
            <option key={status} value={status}>
              {PEDIDO_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </div>

      {estado.mensagem && (
        <p
          className={
            estado.sucesso
              ? "text-sm text-emerald-700"
              : "text-sm text-rose-700"
          }
        >
          {estado.mensagem}
        </p>
      )}

      <BotaoAlterarStatus />
    </form>
  );
}
