"use client";

import { AlertCircle, Banknote, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { PedidoAdminPagamentoNaEntrega } from "@/features/checkout/types/admin-pedidos.types";

import { confirmarRecebimentoPagamentoEntregaAdmin } from "../../actions/admin/confirmar-recebimento-pagamento-entrega-admin";
import { estornarRecebimentoPagamentoEntregaAdmin } from "../../actions/admin/estornar-recebimento-pagamento-entrega-admin";
import { registrarNaoRecebimentoPagamentoEntregaAdmin } from "../../actions/admin/registrar-nao-recebimento-pagamento-entrega-admin";
import {
  ESTADO_INICIAL_RECEBIMENTO_PAGAMENTO_ENTREGA,
  ORDEM_FORMAS_PAGAMENTO_NA_ENTREGA,
  ROTULO_FORMA_PAGAMENTO_NA_ENTREGA,
} from "../../constants/pagamento-na-entrega.constants";
import type { FormaPagamentoNaEntrega } from "../../types/pagamento-na-entrega.types";

function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function BotaoAcao({ rotulo, variante }: { rotulo: string; variante?: "destructive" | "outline" }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" variant={variante} disabled={pending}>
      {pending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
      {rotulo}
    </Button>
  );
}

function Mensagem({ estado }: { estado: { sucesso: boolean; mensagem: string | null } }) {
  if (estado.mensagem === null) return null;

  return (
    <Badge
      variant={estado.sucesso ? "secondary" : "destructive"}
      className="mt-2 gap-1.5 whitespace-normal text-left"
    >
      {estado.sucesso ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <AlertCircle className="size-3.5" />
      )}
      {estado.mensagem}
    </Badge>
  );
}

export function PainelRecebimentoPagamentoEntrega({
  pedidoId,
  pagamentoNaEntrega,
}: {
  pedidoId: string;
  pagamentoNaEntrega: PedidoAdminPagamentoNaEntrega;
}) {
  const router = useRouter();
  const jaRecebido = pagamentoNaEntrega.recebidoEm !== null;

  const [estadoConfirmar, confirmar] = useActionState(
    confirmarRecebimentoPagamentoEntregaAdmin,
    ESTADO_INICIAL_RECEBIMENTO_PAGAMENTO_ENTREGA,
  );
  const [estadoOcorrencia, registrarOcorrencia] = useActionState(
    registrarNaoRecebimentoPagamentoEntregaAdmin,
    ESTADO_INICIAL_RECEBIMENTO_PAGAMENTO_ENTREGA,
  );
  const [estadoEstorno, estornar] = useActionState(
    estornarRecebimentoPagamentoEntregaAdmin,
    ESTADO_INICIAL_RECEBIMENTO_PAGAMENTO_ENTREGA,
  );

  // A forma realmente recebida começa igual à escolhida, mas pode ser trocada: o cliente
  // disse dinheiro e pagou no débito. O caixa precisa refletir o que aconteceu.
  const [formaRecebida, setFormaRecebida] = useState<FormaPagamentoNaEntrega>(
    pagamentoNaEntrega.formaEscolhida as FormaPagamentoNaEntrega,
  );

  useEffect(() => {
    if (estadoConfirmar.sucesso || estadoOcorrencia.sucesso || estadoEstorno.sucesso) {
      router.refresh();
    }
  }, [estadoConfirmar.sucesso, estadoOcorrencia.sucesso, estadoEstorno.sucesso, router]);

  return (
    <div className="space-y-4 text-sm">
      {/* O que o cliente escolheu, congelado na criação do pedido. */}
      <dl className="space-y-1.5">
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">Forma escolhida</dt>
          <dd className="font-medium">
            {ROTULO_FORMA_PAGAMENTO_NA_ENTREGA[
              pagamentoNaEntrega.formaEscolhida as FormaPagamentoNaEntrega
            ] ?? pagamentoNaEntrega.formaEscolhida}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">Valor a receber</dt>
          <dd className="font-medium">
            {formatarReais(pagamentoNaEntrega.valorAReceberEmCentavos)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">Precisa de troco</dt>
          <dd className="font-medium">
            {pagamentoNaEntrega.precisaTroco
              ? `Sim — cliente paga com ${
                  pagamentoNaEntrega.trocoParaEmCentavos !== null
                    ? formatarReais(pagamentoNaEntrega.trocoParaEmCentavos)
                    : "valor não informado"
                }`
              : "Não"}
          </dd>
        </div>
        {pagamentoNaEntrega.precisaTroco &&
          pagamentoNaEntrega.trocoParaEmCentavos !== null && (
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500 dark:text-zinc-400">Troco a devolver</dt>
              <dd className="font-semibold text-amber-600 dark:text-amber-400">
                {formatarReais(
                  Math.max(
                    pagamentoNaEntrega.trocoParaEmCentavos -
                      pagamentoNaEntrega.valorAReceberEmCentavos,
                    0,
                  ),
                )}
              </dd>
            </div>
          )}
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500 dark:text-zinc-400">Serviço</dt>
          <dd className="font-mono text-xs">
            {pagamentoNaEntrega.servicoIdentificador}
          </dd>
        </div>
      </dl>

      {pagamentoNaEntrega.observacoesCliente !== null && (
        <p className="rounded-md bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          {pagamentoNaEntrega.observacoesCliente}
        </p>
      )}

      <Separator />

      {jaRecebido ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <div className="space-y-0.5 text-xs">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                Recebimento confirmado
              </p>
              <p className="text-emerald-700 dark:text-emerald-400">
                {formatarReais(pagamentoNaEntrega.valorRecebidoEmCentavos ?? 0)} em{" "}
                {ROTULO_FORMA_PAGAMENTO_NA_ENTREGA[
                  pagamentoNaEntrega.formaEscolhida as FormaPagamentoNaEntrega
                ]}
                {pagamentoNaEntrega.recebidoPorEmail
                  ? ` · por ${pagamentoNaEntrega.recebidoPorEmail}`
                  : ""}
              </p>
              {pagamentoNaEntrega.observacaoRecebimento !== null && (
                <p className="text-emerald-700 dark:text-emerald-400">
                  {pagamentoNaEntrega.observacaoRecebimento}
                </p>
              )}
            </div>
          </div>

          <form action={estornar} className="space-y-2">
            <input type="hidden" name="pedidoId" value={pedidoId} />
            <Label htmlFor="estorno-observacao" className="text-xs">
              Estornar recebimento (explique o motivo)
            </Label>
            <Textarea
              id="estorno-observacao"
              name="observacao"
              rows={2}
              minLength={5}
              required
              placeholder="Ex.: baixa lançada no pedido errado."
            />
            <BotaoAcao rotulo="Estornar recebimento" variante="destructive" />
            <Mensagem estado={estadoEstorno} />
          </form>
        </div>
      ) : (
        <div className="space-y-5">
          <form action={confirmar} className="space-y-3">
            <input type="hidden" name="pedidoId" value={pedidoId} />
            <input type="hidden" name="formaRecebida" value={formaRecebida} />

            <div className="space-y-1.5">
              <Label className="text-xs">Forma realmente recebida</Label>
              <div className="grid grid-cols-2 gap-2">
                {ORDEM_FORMAS_PAGAMENTO_NA_ENTREGA.map((forma) => (
                  <button
                    key={forma}
                    type="button"
                    className={
                      "rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors " +
                      (formaRecebida === forma
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900")
                    }
                    onClick={() => setFormaRecebida(forma)}
                  >
                    {ROTULO_FORMA_PAGAMENTO_NA_ENTREGA[forma]}
                  </button>
                ))}
              </div>
              {formaRecebida !== pagamentoNaEntrega.formaEscolhida && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Diferente do que o cliente escolheu. A divergência fica registrada no
                  histórico.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valor-recebido" className="text-xs">
                Valor recebido (R$)
              </Label>
              <Input
                id="valor-recebido"
                name="valorRecebidoEmCentavos"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={(
                  pagamentoNaEntrega.valorAReceberEmCentavos / 100
                ).toFixed(2)}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Confirme o valor que entrou de fato — não é preenchido automaticamente.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacao-recebimento" className="text-xs">
                Observação (opcional)
              </Label>
              <Textarea
                id="observacao-recebimento"
                name="observacao"
                rows={2}
                placeholder="Ex.: cliente pagou com nota de R$ 200."
              />
            </div>

            <BotaoAcao rotulo="Confirmar recebimento" />
            <Mensagem estado={estadoConfirmar} />
          </form>

          <Separator />

          <form action={registrarOcorrencia} className="space-y-2">
            <input type="hidden" name="pedidoId" value={pedidoId} />
            <Label htmlFor="motivo-ocorrencia" className="text-xs">
              Registrar que não houve recebimento
            </Label>
            <select
              id="motivo-ocorrencia"
              name="motivo"
              className="border-input h-9 w-full rounded-md border bg-white px-3 text-sm dark:bg-zinc-950"
            >
              <option value="pagamento_recusado">
                Pagamento recusado na entrega
              </option>
              <option value="entrega_nao_realizada">
                Entrega não realizada
              </option>
            </select>
            <Textarea
              name="observacao"
              rows={2}
              minLength={5}
              required
              placeholder="Descreva o que aconteceu."
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Isso cancela o pedido e marca o pagamento como falho.
            </p>
            <BotaoAcao rotulo="Registrar ocorrência" variante="outline" />
            <Mensagem estado={estadoOcorrencia} />
          </form>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
        <Banknote className="size-3" />
        Pagamento na entrega — baixa manual, sem gateway.
      </p>
    </div>
  );
}
