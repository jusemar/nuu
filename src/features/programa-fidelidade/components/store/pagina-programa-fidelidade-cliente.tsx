import { Clock3, Coins, Gift, RotateCcw,ShoppingCart } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/features/header";

import {
  formatarCreditoFidelidade,
  formatarPontosCliente,
} from "../../lib/formatar-fidelidade-cliente";
import type { ProgramaFidelidadeCliente } from "../../types/programa-fidelidade-cliente.types";
import { HistoricoFidelidadeCliente } from "./historico-fidelidade-cliente";

function CartaoSaldo({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-5 ${destaque ? "border-[#0C447C]/20 bg-[#0C447C] text-white" : "bg-white"}`}
    >
      <p
        className={`text-xs font-medium tracking-wide uppercase ${destaque ? "text-blue-100" : "text-slate-500"}`}
      >
        {titulo}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {formatarPontosCliente(valor)}
      </p>
      <p
        className={`mt-1 text-xs ${destaque ? "text-blue-100" : "text-slate-500"}`}
      >
        pontos
      </p>
    </div>
  );
}

export function PaginaProgramaFidelidadeCliente({
  resultado,
}: {
  resultado: ProgramaFidelidadeCliente;
}) {
  const configuracao = resultado.configuracao;
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#0C447C]">Minha Conta</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {configuracao?.nomePublico ?? "Programa de Fidelidade"}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Consulte seu saldo e acompanhe a origem dos seus pontos.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/minha-conta">Voltar para conta</Link>
            </Button>
          </header>

          {configuracao && !configuracao.ativo && (
            <div
              role="status"
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              O programa está pausado no momento. Seus pontos existentes
              continuam disponíveis para consulta.
            </div>
          )}

          <section
            aria-label="Resumo dos pontos"
            className="grid gap-3 sm:grid-cols-3"
          >
            <CartaoSaldo
              titulo="Pontos disponíveis"
              valor={resultado.saldos.disponiveis}
              destaque
            />
            <CartaoSaldo
              titulo="Pontos pendentes"
              valor={resultado.saldos.pendentes}
            />
            <CartaoSaldo
              titulo="Total acumulado"
              valor={resultado.saldos.acumulado}
            />
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <HistoricoFidelidadeCliente resultado={resultado} />
            <aside className="space-y-4 lg:order-last">
              <section className="rounded-lg border bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Coins className="size-4 text-[#0C447C]" />
                  <h2 className="font-semibold text-slate-950">
                    Como funciona
                  </h2>
                </div>
                {configuracao ? (
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <p className="rounded-lg bg-slate-50 p-3 font-semibold text-slate-950">
                      {formatarPontosCliente(configuracao.pontosConversao)}{" "}
                      pontos ={" "}
                      {formatarCreditoFidelidade(
                        configuracao.valorCreditoEmCentavos,
                      )}{" "}
                      de crédito
                    </p>
                    <p className="flex gap-2">
                      <Gift className="mt-0.5 size-4 shrink-0" />
                      Mínimo futuro para resgate:{" "}
                      {formatarPontosCliente(configuracao.minimoResgate)}{" "}
                      pontos.
                    </p>
                    <p className="flex gap-2">
                      <Clock3 className="mt-0.5 size-4 shrink-0" />
                      {configuracao.mesesValidade
                        ? `Validade de ${configuracao.mesesValidade} meses.`
                        : "Os pontos não expiram."}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">
                    As regras do programa ainda não estão disponíveis.
                  </p>
                )}
              </section>
              <section className="rounded-lg border border-dashed bg-white p-5">
                <Badge variant="outline">Disponível no checkout</Badge>
                <div className="mt-3 flex items-center gap-2">
                  <ShoppingCart className="size-4 text-slate-500" />
                  <h2 className="font-semibold text-slate-950">
                    Usar meus pontos
                  </h2>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Escolha quantos pontos usar ao finalizar uma compra elegível.
                </p>
                <Button className="mt-4 w-full" asChild>
                  <Link href="/checkout">Ir para o checkout</Link>
                </Button>
              </section>
              {resultado.saldos.reservados > 0 ? (
                <p className="px-1 text-xs text-slate-500">
                  {formatarPontosCliente(resultado.saldos.reservados)} pontos
                  reservados em pedidos pendentes.
                </p>
              ) : null}
              {resultado.saldos.revertidos > 0 && (
                <p className="flex items-center gap-2 px-1 text-xs text-slate-500">
                  <RotateCcw className="size-3.5" />
                  {formatarPontosCliente(resultado.saldos.revertidos)} pontos
                  revertidos no histórico.
                </p>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
