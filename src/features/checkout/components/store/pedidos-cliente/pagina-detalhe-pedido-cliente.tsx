import Link from "next/link";
import { ArrowLeft, PackageCheck, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/features/header";

import {
  PAGAMENTO_METODO_LABEL,
  PEDIDO_HISTORICO_TIPO_LABEL,
} from "../../../constants/pedidos-apresentacao";
import {
  formatarDataPedidoCliente,
  formatarMoedaPedidoCliente,
} from "../../../lib/pedidos-cliente/formatar-pedidos-cliente";
import type { PedidoClienteDetalhe } from "../../../types/pedidos-cliente.types";
import {
  StatusPagamentoClienteBadge,
  StatusPedidoClienteBadge,
} from "./status-pedido-cliente-badge";

function SecaoCliente({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">{titulo}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PaginaDetalhePedidoCliente({
  pedido,
}: {
  pedido: PedidoClienteDetalhe;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-3">
            <Link href="/minha-conta/pedidos">
              <ArrowLeft className="h-4 w-4" />
              Voltar para pedidos
            </Link>
          </Button>

          <div className="mb-5 rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-[#0C447C]">
                  Pedido {pedido.numeroPedido}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  Detalhes do pedido
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Criado em {formatarDataPedidoCliente(pedido.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="space-y-1">
                  <span className="block text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                    Pedido
                  </span>
                  <StatusPedidoClienteBadge status={pedido.status} />
                </div>
                <div className="space-y-1">
                  <span className="block text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                    Pagamento
                  </span>
                  <StatusPagamentoClienteBadge
                    status={pedido.pagamentoStatus}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <SecaoCliente titulo="Itens do pedido">
                <div className="space-y-4">
                  {pedido.itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-lg border bg-slate-50 p-3"
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-white">
                        {item.imagemUrl ? (
                          <img
                            src={item.imagemUrl}
                            alt={item.nomeProduto}
                            className="h-full w-full rounded-md object-cover"
                          />
                        ) : (
                          <PackageCheck className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-950">
                          {item.nomeProduto}
                        </p>
                        {Object.keys(item.atributosVariante).length > 0 ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {Object.entries(item.atributosVariante)
                              .map(([nome, valor]) => `${nome}: ${valor}`)
                              .join(" • ")}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {item.quantidade} x{" "}
                          {formatarMoedaPedidoCliente(
                            item.precoUnitarioEmCentavos,
                          )}
                        </p>
                        {item.modalidade &&
                        Object.keys(item.atributosVariante).length === 0 ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {item.modalidade} {item.prazoModalidade ?? ""}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-slate-950">
                        {formatarMoedaPedidoCliente(item.totalEmCentavos)}
                      </p>
                    </div>
                  ))}
                </div>
              </SecaoCliente>

              <SecaoCliente titulo="Timeline">
                <ol className="space-y-3">
                  {pedido.historicos.map((historico) => (
                    <li key={historico.id} className="flex gap-3">
                      <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#0C447C]" />
                      <div>
                        <p className="text-sm font-medium text-slate-950">
                          {PEDIDO_HISTORICO_TIPO_LABEL[historico.tipo]}
                        </p>
                        <p className="text-sm text-slate-600">
                          {historico.descricao}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatarDataPedidoCliente(historico.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </SecaoCliente>
            </div>

            <div className="space-y-5">
              <SecaoCliente titulo="Resumo financeiro">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Subtotal</dt>
                    <dd className="font-medium text-slate-950">
                      {formatarMoedaPedidoCliente(pedido.subtotalEmCentavos)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Frete</dt>
                    <dd className="font-medium text-slate-950">
                      {formatarMoedaPedidoCliente(pedido.freteEmCentavos)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Desconto</dt>
                    <dd className="font-medium text-slate-950">
                      -{formatarMoedaPedidoCliente(pedido.descontoEmCentavos)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t pt-3 text-base">
                    <dt className="font-semibold text-slate-950">Total</dt>
                    <dd className="font-semibold text-slate-950">
                      {formatarMoedaPedidoCliente(pedido.totalEmCentavos)}
                    </dd>
                  </div>
                </dl>
              </SecaoCliente>

              <SecaoCliente titulo="Pagamento">
                {pedido.pagamento ? (
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase">
                        Método
                      </dt>
                      <dd className="mt-1 font-medium text-slate-950">
                        {PAGAMENTO_METODO_LABEL[pedido.pagamento.metodo]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase">
                        Status
                      </dt>
                      <dd className="mt-1">
                        <StatusPagamentoClienteBadge
                          status={pedido.pagamento.status}
                        />
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-slate-600">
                    Pagamento ainda não disponível.
                  </p>
                )}
              </SecaoCliente>

              <SecaoCliente titulo="Rastreio">
                {pedido.logistica ? (
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Truck className="h-4 w-4" />
                      <span>
                        {pedido.logistica.dataEntrega
                          ? "Pedido entregue"
                          : pedido.logistica.dataEnvio
                            ? "Pedido enviado"
                            : "Aguardando envio"}
                      </span>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase">
                        Transportadora
                      </dt>
                      <dd className="mt-1 font-medium text-slate-950">
                        {pedido.logistica.transportadora || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase">
                        Código rastreio
                      </dt>
                      <dd className="mt-1 font-medium break-words text-slate-950">
                        {pedido.logistica.codigoRastreio || "-"}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-slate-600">
                    O rastreio aparecerá aqui quando o pedido for enviado.
                  </p>
                )}
              </SecaoCliente>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
