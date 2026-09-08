"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { cancelarPedidoCliente } from "../../../actions/cancelamentos/cancelar-pedido-cliente";

const estadoInicial = { sucesso: false, mensagem: "" };

export function FormularioCancelamentoPedido({
  pedidoId,
  pago,
}: {
  pedidoId: string;
  pago: boolean;
}) {
  const [estado, acao, pendente] = useActionState(
    cancelarPedidoCliente,
    estadoInicial,
  );
  return (
    <form action={acao} className="space-y-3">
      <input type="hidden" name="pedidoId" value={pedidoId} />
      <div className="space-y-1.5">
        <Label htmlFor="motivo-cancelamento">Motivo</Label>
        <select
          id="motivo-cancelamento"
          name="motivo"
          required
          defaultValue=""
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="" disabled>
            Selecione uma opção
          </option>
          <option value="compra_por_engano">Comprei por engano</option>
          <option value="alterar_pedido">Quero alterar o pedido</option>
          <option value="prazo_entrega">Prazo de entrega</option>
          <option value="outra_opcao">Encontrei outra opção</option>
          <option value="problema_pagamento">Problema com pagamento</option>
          <option value="outro">Outro</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="complemento-cancelamento">Conte mais (opcional)</Label>
        <Textarea
          id="complemento-cancelamento"
          name="complementoMotivo"
          maxLength={500}
          rows={3}
        />
      </div>
      <Button
        type="submit"
        variant="destructive"
        disabled={pendente}
        className="w-full"
      >
        {pendente
          ? "Processando..."
          : pago
            ? "Solicitar cancelamento"
            : "Cancelar pedido"}
      </Button>
      {estado.mensagem ? (
        <p
          role="status"
          className={
            estado.sucesso ? "text-sm text-emerald-700" : "text-sm text-red-700"
          }
        >
          {estado.mensagem}
        </p>
      ) : null}
    </form>
  );
}
