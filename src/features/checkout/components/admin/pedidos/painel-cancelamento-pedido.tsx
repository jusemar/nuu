import { PAGAMENTO_GATEWAY_LABEL } from "../../../constants/admin-pedidos";
import { formatarDataAdminPedido } from "../../../lib/admin-pedidos/formatar-admin-pedidos";
import type { PedidoAdminDetalhe } from "../../../types/admin-pedidos.types";

function CampoCancelamento({
  label,
  valor,
}: {
  label: string;
  valor: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium break-words text-slate-900">
        {valor || "-"}
      </dd>
    </div>
  );
}

/** Bloco compartilhável do detalhe Admin, isolado para validação visual segura. */
export function PainelCancelamentoPedido({
  cancelamento,
}: {
  cancelamento: NonNullable<PedidoAdminDetalhe["cancelamento"]>;
}) {
  return (
    <dl className="grid gap-4 md:grid-cols-2">
      <CampoCancelamento
        label="Status do cancelamento"
        valor={cancelamento.status}
      />
      <CampoCancelamento
        label="Status do reembolso"
        valor={cancelamento.reembolsoStatus}
      />
      <CampoCancelamento label="Motivo" valor={cancelamento.motivo} />
      <CampoCancelamento
        label="Detalhes"
        valor={cancelamento.complementoMotivo}
      />
      <CampoCancelamento
        label="Solicitado por"
        valor={cancelamento.solicitadoPorEmail}
      />
      <CampoCancelamento
        label="Solicitado em"
        valor={formatarDataAdminPedido(cancelamento.solicitadoEm)}
      />
      <CampoCancelamento
        label="Gateway"
        valor={
          cancelamento.gatewayReembolso
            ? PAGAMENTO_GATEWAY_LABEL[cancelamento.gatewayReembolso]
            : "Não necessário"
        }
      />
      <CampoCancelamento
        label="ID do reembolso"
        valor={cancelamento.reembolsoId}
      />
      {cancelamento.erroOperacional ? (
        <CampoCancelamento
          label="Erro operacional"
          valor={cancelamento.erroOperacional}
        />
      ) : null}
    </dl>
  );
}
