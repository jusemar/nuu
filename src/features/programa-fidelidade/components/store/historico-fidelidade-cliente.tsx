import { ArrowDownLeft, Clock3, History } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

import {
  formatarDataMovimentoFidelidade,
  formatarPontosCliente,
} from "../../lib/formatar-fidelidade-cliente";
import type { ProgramaFidelidadeCliente } from "../../types/programa-fidelidade-cliente.types";
import { PaginacaoHistoricoFidelidade } from "./paginacao-historico-fidelidade";

const APRESENTACAO = {
  pendente: {
    rotulo: "Pendentes",
    classe: "border-amber-200 bg-amber-50 text-amber-800",
    Icone: Clock3,
  },
  disponivel: {
    rotulo: "Disponíveis",
    classe: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Icone: History,
  },
  revertido: {
    rotulo: "Revertidos",
    classe: "border-slate-200 bg-slate-100 text-slate-700",
    Icone: ArrowDownLeft,
  },
} as const;

export function HistoricoFidelidadeCliente({
  resultado,
}: {
  resultado: ProgramaFidelidadeCliente;
}) {
  if (resultado.movimentos.length === 0) {
    return (
      <section className="rounded-lg border border-dashed bg-white px-6 py-12 text-center">
        <History className="mx-auto size-9 text-slate-400" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">
          Você ainda não tem movimentações
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Seus pontos aparecerão aqui quando uma compra elegível tiver o
          pagamento confirmado.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex text-sm font-semibold text-[#0C447C] hover:underline"
        >
          Continuar comprando
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <header className="border-b px-5 py-4">
        <h2 className="font-semibold text-slate-950">Histórico de pontos</h2>
        <p className="mt-1 text-sm text-slate-600">
          Acompanhe os pontos gerados em cada pedido.
        </p>
      </header>
      <ul className="divide-y">
        {resultado.movimentos.map((movimento) => {
          const apresentacao = APRESENTACAO[movimento.situacao];
          const sinal = movimento.situacao === "revertido" ? "−" : "+";
          return (
            <li
              key={movimento.pedidoId}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <apresentacao.Icone className="size-4" />
                </span>
                <div>
                  <Link
                    href={`/minha-conta/pedidos/${movimento.pedidoId}`}
                    className="text-sm font-semibold text-slate-950 hover:text-[#0C447C] hover:underline"
                  >
                    Pedido {movimento.numeroPedido}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatarDataMovimentoFidelidade(movimento.data)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 pl-12 sm:justify-end sm:pl-0">
                <Badge variant="outline" className={apresentacao.classe}>
                  {apresentacao.rotulo}
                </Badge>
                <span
                  className={`min-w-24 text-right text-sm font-semibold tabular-nums ${movimento.situacao === "revertido" ? "text-slate-600" : "text-[#0C447C]"}`}
                >
                  {sinal}
                  {formatarPontosCliente(movimento.pontos)} pontos
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <PaginacaoHistoricoFidelidade {...resultado.paginacao} />
    </section>
  );
}
