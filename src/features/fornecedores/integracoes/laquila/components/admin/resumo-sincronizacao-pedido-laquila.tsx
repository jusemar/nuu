import { formatarDataAdminPedido } from "@/features/checkout/lib/admin-pedidos/formatar-admin-pedidos";

import type { IntegracaoPedidoLaquilaAdmin } from "../../types/reconciliacao-pedido-laquila";

/** O painel recebe somente a projeção administrativa, sem credenciais/payload. */
export function ResumoSincronizacaoPedidoLaquila({
  integracoes,
}: {
  integracoes: IntegracaoPedidoLaquilaAdmin[];
}) {
  if (!integracoes.length) return null;
  return (
    <section
      className="rounded-lg border bg-white p-5 shadow-sm"
      aria-label="Integração Laquila"
    >
      <h2 className="text-base font-semibold text-slate-950">
        Integração Laquila
      </h2>
      <div className="mt-3 space-y-4">
        {integracoes.map((integracao) => {
          const sincronizacao = integracao.sincronizacao;
          const estado = sincronizacao?.ultimoEstado;
          return (
            <div
              key={integracao.id}
              className="space-y-2 rounded-md border p-3 text-sm"
            >
              <p>
                Ambiente: {integracao.ambiente} · Criação da integração:{" "}
                {integracao.status}
              </p>
              <p>
                Pedido externo:{" "}
                {integracao.idPedidoExterno ?? "Ainda não criado"}
              </p>
              <p>
                Estado operacional externo:{" "}
                {estado?.estado === "cancelado"
                  ? "Cancelado"
                  : estado
                    ? "Em acompanhamento"
                    : "Ainda não sincronizado"}
              </p>
              <p>
                Última consulta:{" "}
                {integracao.ultimaConsulta
                  ? formatarDataAdminPedido(new Date(integracao.ultimaConsulta))
                  : "Não registrada"}
              </p>
              {estado?.campos &&
                Object.entries(estado.campos).map(([campo, valor]) => (
                  <p key={campo} className="break-words">
                    <span className="font-medium">{campo}:</span> {valor || "—"}
                  </p>
                ))}
              {sincronizacao?.erro ? (
                <p role="alert" className="text-amber-800">
                  {sincronizacao.erro}
                </p>
              ) : null}
              {sincronizacao?.revisaoOperacional ? (
                <p className="text-amber-800">
                  {sincronizacao.revisaoOperacional}
                </p>
              ) : null}
              {estado?.estado === "cancelado" ? (
                <p className="text-slate-600">
                  Cancelamento operacional confirmado. Nenhum reembolso é
                  disparado por esta sincronização.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
