import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/features/header";

import { PAGAMENTO_METODO_LABEL } from "../../../constants/pedidos-apresentacao";
import {
  formatarDataPedidoCliente,
  formatarMoedaPedidoCliente,
} from "../../../lib/pedidos-cliente/formatar-pedidos-cliente";
import type { PedidoClienteListaItem } from "../../../types/pedidos-cliente.types";
import {
  StatusPagamentoClienteBadge,
  StatusPedidoClienteBadge,
} from "./status-pedido-cliente-badge";

export function PaginaMeusPedidos({
  pedidos,
}: {
  pedidos: PedidoClienteListaItem[];
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#0C447C]">Minha Conta</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                Meus Pedidos
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Acompanhe status, pagamento e rastreio das suas compras.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/minha-conta">Voltar para conta</Link>
            </Button>
          </div>

          {pedidos.length === 0 ? (
            <section className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-8 text-center">
              <PackageSearch className="h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                Nenhum pedido encontrado
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Quando você fizer uma compra usando este email, ela aparecerá
                aqui automaticamente.
              </p>
              <Button asChild className="mt-5">
                <Link href="/">Continuar comprando</Link>
              </Button>
            </section>
          ) : (
            <section className="grid gap-3">
              {pedidos.map((pedido) => (
                <Link
                  key={pedido.id}
                  href={`/minha-conta/pedidos/${pedido.id}`}
                  className="rounded-lg border bg-white p-4 shadow-sm transition hover:border-[#0C447C]/30 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {pedido.numeroPedido}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatarDataPedidoCliente(pedido.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPedidoClienteBadge status={pedido.status} />
                      <StatusPagamentoClienteBadge
                        status={pedido.pagamentoStatus}
                      />
                    </div>
                    <div className="md:text-right">
                      <p className="text-sm font-semibold text-slate-950">
                        {formatarMoedaPedidoCliente(pedido.totalEmCentavos)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {pedido.metodoPagamento
                          ? PAGAMENTO_METODO_LABEL[pedido.metodoPagamento]
                          : "Pagamento"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
