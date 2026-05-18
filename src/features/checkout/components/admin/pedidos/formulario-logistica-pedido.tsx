"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, PackageCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { marcarPedidoEntregueAdmin } from "../../../actions/pedidos-admin/marcar-pedido-entregue-admin";
import { marcarPedidoEnviadoAdmin } from "../../../actions/pedidos-admin/marcar-pedido-enviado-admin";
import { salvarLogisticaPedidoAdmin } from "../../../actions/pedidos-admin/salvar-logistica-pedido-admin";
import { formatarDataAdminPedido } from "../../../lib/admin-pedidos/formatar-admin-pedidos";
import type { PedidoAdminLogistica } from "../../../types/admin-pedidos.types";

function BotaoSalvarLogistica() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Salvar logística
    </Button>
  );
}

function BotaoAcaoCritica({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

function MensagemAcao({
  sucesso,
  mensagem,
}: {
  sucesso: boolean;
  mensagem: string | null;
}) {
  if (!mensagem) {
    return null;
  }

  return (
    <p
      className={sucesso ? "text-sm text-emerald-700" : "text-sm text-rose-700"}
    >
      {mensagem}
    </p>
  );
}

export function FormularioLogisticaPedido({
  pedidoId,
  logistica,
}: {
  pedidoId: string;
  logistica: PedidoAdminLogistica | null;
}) {
  const router = useRouter();
  const [estadoSalvar, executarSalvar] = useActionState(
    salvarLogisticaPedidoAdmin,
    {
      sucesso: false,
      mensagem: null,
    },
  );
  const [estadoEnviado, executarEnviado] = useActionState(
    marcarPedidoEnviadoAdmin,
    {
      sucesso: false,
      mensagem: null,
    },
  );
  const [estadoEntregue, executarEntregue] = useActionState(
    marcarPedidoEntregueAdmin,
    {
      sucesso: false,
      mensagem: null,
    },
  );

  useEffect(() => {
    if (
      estadoSalvar.sucesso ||
      estadoEnviado.sucesso ||
      estadoEntregue.sucesso
    ) {
      router.refresh();
    }
  }, [
    estadoSalvar.sucesso,
    estadoEnviado.sucesso,
    estadoEntregue.sucesso,
    router,
  ]);

  const statusEnvio = logistica?.dataEntrega
    ? "Entregue"
    : logistica?.dataEnvio
      ? "Enviado"
      : "Aguardando envio";

  return (
    <div className="space-y-5">
      <div className="rounded-md border bg-slate-50 p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{statusEnvio}</Badge>
          {logistica?.dataEnvio && (
            <span className="text-xs text-slate-600">
              Enviado em {formatarDataAdminPedido(logistica.dataEnvio)}
            </span>
          )}
          {logistica?.dataEntrega && (
            <span className="text-xs text-slate-600">
              Entregue em {formatarDataAdminPedido(logistica.dataEntrega)}
            </span>
          )}
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase">
              Transportadora
            </dt>
            <dd className="mt-1 font-medium text-slate-900">
              {logistica?.transportadora || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase">
              Código rastreio
            </dt>
            <dd className="mt-1 font-medium break-words text-slate-900">
              {logistica?.codigoRastreio || "-"}
            </dd>
          </div>
        </dl>
      </div>

      <form action={executarSalvar} className="space-y-3">
        <input type="hidden" name="pedidoId" value={pedidoId} />
        <div>
          <label
            htmlFor="transportadora"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Transportadora
          </label>
          <Input
            id="transportadora"
            name="transportadora"
            defaultValue={logistica?.transportadora ?? ""}
            placeholder="Ex: Correios, Jadlog, Transportadora local"
          />
        </div>
        <div>
          <label
            htmlFor="codigoRastreio"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            Código de rastreio
          </label>
          <Input
            id="codigoRastreio"
            name="codigoRastreio"
            defaultValue={logistica?.codigoRastreio ?? ""}
            placeholder="Ex: AA123456789BR"
          />
        </div>
        <MensagemAcao
          sucesso={estadoSalvar.sucesso}
          mensagem={estadoSalvar.mensagem}
        />
        <BotaoSalvarLogistica />
      </form>

      <div className="flex flex-col gap-2 sm:flex-row">
        <form
          action={executarEnviado}
          onSubmit={(evento) => {
            if (!window.confirm("Confirmar que este pedido foi enviado?")) {
              evento.preventDefault();
            }
          }}
        >
          <input type="hidden" name="pedidoId" value={pedidoId} />
          <BotaoAcaoCritica>
            <Truck className="h-4 w-4" />
            Marcar enviado
          </BotaoAcaoCritica>
        </form>

        <form
          action={executarEntregue}
          onSubmit={(evento) => {
            if (!window.confirm("Confirmar que este pedido foi entregue?")) {
              evento.preventDefault();
            }
          }}
        >
          <input type="hidden" name="pedidoId" value={pedidoId} />
          <BotaoAcaoCritica>
            <PackageCheck className="h-4 w-4" />
            Marcar entregue
          </BotaoAcaoCritica>
        </form>
      </div>

      <MensagemAcao
        sucesso={estadoEnviado.sucesso}
        mensagem={estadoEnviado.mensagem}
      />
      <MensagemAcao
        sucesso={estadoEntregue.sucesso}
        mensagem={estadoEntregue.mensagem}
      />
      {(estadoEnviado.sucesso || estadoEntregue.sucesso) && (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Timeline atualizada.
        </div>
      )}
    </div>
  );
}
