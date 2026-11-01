"use client";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useDetalheComissao } from "../../../hooks/painel-comissoes/use-painel-comissoes";
import {
  formatarCentavosHistoricos as dinheiro,
  formatarDataHistorica as data,
  formatarRegraHistorica,
} from "../../../lib/painel-comissoes/formatar-valores";
import { ROTULOS_SITUACAO } from "../../../lib/painel-comissoes/situacao-comissao";
import { QuitacaoManual } from "./quitacao-manual";
const eventos: Record<string, string> = {
  confirmada: "Pagamento confirmado / comissão válida",
  cancelada: "Comissão invalidada por cancelamento",
  estornada: "Comissão invalidada por estorno",
};
export function DetalheComissaoModal({
  id,
  fechar,
}: {
  id: string;
  fechar: () => void;
}) {
  const consulta = useDetalheComissao(id),
    d = consulta.data;
  return (
    <Dialog
      open={!!id}
      onOpenChange={(aberto) => {
        if (!aberto) fechar();
      }}
    >
      <DialogContent className="max-h-[90dvh] min-w-0 overflow-y-auto [&>button]:top-2 [&>button]:right-2 [&>button]:flex [&>button]:size-11 [&>button]:items-center [&>button]:justify-center">
        <DialogHeader>
          <DialogTitle>Detalhes da comissão</DialogTitle>
          <DialogDescription>
            Valores históricos congelados nesta venda.
          </DialogDescription>
        </DialogHeader>
        {consulta.isPending ? (
          <p role="status">Carregando detalhes…</p>
        ) : consulta.isError ? (
          <p role="alert">Comissão indisponível ou sem acesso.</p>
        ) : (
          d && (
            <div className="min-w-0 space-y-4">
              <div>
                <h2 className="font-semibold break-words">{d.linha.produto}</h2>
                <p className="text-muted-foreground text-sm">
                  Pedido {d.linha.pedido} · {d.linha.fornecedor}
                </p>
                <p className="mt-2 font-medium">
                  {ROTULOS_SITUACAO[d.linha.situacao]}
                </p>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Data do pedido", data(d.linha.data)],
                  ["Quantidade", String(d.linha.quantidade)],
                  [
                    "Preço comercial unitário",
                    dinheiro(d.precoUnitarioCentavos),
                  ],
                  ["Desconto do item", dinheiro(d.descontoCentavos)],
                  ["Valor líquido vendido", dinheiro(d.linha.vendidoCentavos)],
                  ["Comissão histórica", dinheiro(d.linha.comissaoCentavos)],
                  [
                    "Regra desta venda",
                    formatarRegraHistorica(d.regra.tipo, d.regra.valor),
                  ],
                ].map(([t, v]) => (
                  <div key={t} className="min-w-0">
                    <dt className="text-muted-foreground">{t}</dt>
                    <dd className="font-medium break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              {d.linha.gestao && (
                <Link
                  className="text-primary inline-flex min-h-11 items-center underline"
                  href={`/admin/orders/${d.linha.gestao.pedidoId}`}
                >
                  Abrir pedido no admin
                </Link>
              )}
              <div>
                <h3 className="mb-2 font-semibold">Histórico</h3>
                <ul className="space-y-2 text-sm">
                  {d.eventos.map((e, i) => (
                    <li key={i} className="rounded-md border p-3">
                      {eventos[e.tipo] ?? e.tipo}
                      <span className="text-muted-foreground block text-xs">
                        {data(e.data)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {d.quitacao && (
                <div className="space-y-1 rounded-lg border p-3 text-sm">
                  <h3 className="font-semibold">Quitação externa registrada</h3>
                  <p>
                    {dinheiro(d.quitacao.valorCentavos)} ·{" "}
                    {data(d.quitacao.data)}
                  </p>
                  {d.quitacao.gestao && (
                    <>
                      <p>Responsável: {d.quitacao.gestao.responsavel}</p>
                      <p className="break-words">
                        Referência: {d.quitacao.gestao.referencia || "—"}
                      </p>
                      <p className="break-words">
                        Observação interna:{" "}
                        {d.quitacao.gestao.observacao || "—"}
                      </p>
                    </>
                  )}
                  <p className="text-muted-foreground">
                    O registro de quitação permanece no histórico mesmo se a
                    comissão for invalidada depois.
                  </p>
                </div>
              )}
              {d.podeQuitar && (
                <QuitacaoManual id={id} valor={d.linha.comissaoCentavos} />
              )}
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
