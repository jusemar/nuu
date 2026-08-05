import { Banknote, CreditCard, Lock, Tag, Zap } from "lucide-react";
import type { UseFormRegister, UseFormSetValue } from "react-hook-form";

import { formatarPrecoCarrinho } from "@/features/carrinho";
import { ROTULO_FORMA_PAGAMENTO_NA_ENTREGA } from "@/features/pagamento-na-entrega";

import type { CheckoutVisitanteSchema } from "../../../schemas/checkout.schema";
import type { ResumoCheckoutCalculado } from "../../../types/checkout.types";

type OpcoesPagamentoProps = {
  formaPagamento: CheckoutVisitanteSchema["formaPagamento"];
  parcelasCartao?: number;
  formaPagamentoNaEntrega?: CheckoutVisitanteSchema["formaPagamentoNaEntrega"];
  precisaTroco?: boolean;
  trocoParaEmCentavos?: number;
  resumoCheckout: ResumoCheckoutCalculado | null;
  register: UseFormRegister<CheckoutVisitanteSchema>;
  setValue: UseFormSetValue<CheckoutVisitanteSchema>;
};

export function OpcoesPagamento({
  formaPagamento,
  parcelasCartao = 1,
  formaPagamentoNaEntrega,
  precisaTroco,
  trocoParaEmCentavos,
  resumoCheckout,
  register,
  setValue,
}: OpcoesPagamentoProps) {
  const pixAtivo = resumoCheckout?.pagamentos.pix.ativo ?? false;
  const cartaoAtivo = resumoCheckout?.pagamentos.cartao.ativo ?? false;
  const parcelamentosCartao =
    resumoCheckout?.pagamentos.cartao.parcelamentos ?? [];
  const parcelamentoSelecionado =
    parcelamentosCartao.find(
      (parcela) => parcela.parcelas === parcelasCartao,
    ) ?? parcelamentosCartao[0];

  const naEntrega = resumoCheckout?.pagamentos.naEntrega;

  /**
   * Escolhe UM motivo para explicar a indisponibilidade.
   *
   * O motor devolve a lista completa, útil para diagnóstico, mas despejá-la no checkout
   * viraria ruído. Motivos de escopo "pedido" vêm primeiro porque são os acionáveis pelo
   * cliente (valor abaixo do mínimo, endereço faltando); os de item explicam um produto
   * específico. Motivos puramente internos, como a funcionalidade estar desligada na loja,
   * não viram texto: nesse caso o painel simplesmente não aparece.
   */
  const motivoRelevante = (() => {
    if (naEntrega === undefined || naEntrega.ativo) return null;

    const motivosOcultos = new Set([
      "configuracao-global-desativada",
      "carrinho-vazio",
      "servico-sem-configuracao",
      "servico-inativo",
      "servico-com-pagamento-desativado",
      "servico-entrega-nao-suportado",
      "frete-nao-escolhido",
      "avaliacao-parcial-sem-total",
    ]);

    const visiveis = naEntrega.motivos.filter(
      (motivo) => !motivosOcultos.has(motivo.codigo),
    );

    return (
      visiveis.find((motivo) => motivo.escopo === "pedido")?.mensagem ??
      visiveis[0]?.mensagem ??
      null
    );
  })();

  return (
    <section className="border-border bg-card shadow-card rounded-2xl border p-6 md:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-lg">
            <CreditCard className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Pagamento</h2>
            <p className="text-muted-foreground text-xs">
              Escolha uma única forma de pagamento para este pedido.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-600 uppercase dark:bg-emerald-900/30 dark:text-emerald-400">
          <Lock className="size-3" /> SSL
        </span>
      </div>

      <div role="radiogroup" className="grid grid-cols-2 gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={formaPagamento === "pix"}
          disabled={!pixAtivo}
          className={
            "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-55 " +
            (formaPagamento === "pix"
              ? "border-primary bg-accent ring-primary ring-1"
              : "border-border bg-card hover:border-primary/40")
          }
          onClick={() => {
            if (!pixAtivo) return;
            setValue("formaPagamento", "pix", {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        >
          <span
            className={
              "flex size-7 shrink-0 items-center justify-center rounded-md " +
              (formaPagamento === "pix"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground")
            }
          >
            <Zap className="size-4" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[13px] font-semibold">PIX</span>
            <span className="text-muted-foreground block truncate text-[11px]">
              {pixAtivo
                ? resumoCheckout?.pagamentos.pix.total
                : "Indisponível para este pedido"}
            </span>
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={formaPagamento === "cartao"}
          disabled={!cartaoAtivo}
          className={
            "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-55 " +
            (formaPagamento === "cartao"
              ? "border-primary bg-accent ring-primary ring-1"
              : "border-border bg-card hover:border-primary/40")
          }
          onClick={() => {
            if (!cartaoAtivo) return;
            setValue("formaPagamento", "cartao", {
              shouldDirty: true,
              shouldValidate: true,
            });
            if (parcelamentoSelecionado) {
              setValue("parcelasCartao", parcelamentoSelecionado.parcelas, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
        >
          <span
            className={
              "flex size-7 shrink-0 items-center justify-center rounded-md " +
              (formaPagamento === "cartao"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground")
            }
          >
            <CreditCard className="size-4" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[13px] font-semibold">Cartão</span>
            <span className="text-muted-foreground block truncate text-[11px]">
              {cartaoAtivo && parcelamentoSelecionado
                ? `${parcelamentoSelecionado.parcelas}x de ${parcelamentoSelecionado.valor}`
                : "Indisponível para este pedido"}
            </span>
          </span>
        </button>

        <input type="hidden" {...register("formaPagamento")} />
      </div>

      {/*
        Pagamento na entrega.

        Fica fora do radiogroup acima por enquanto: `formaPagamento` ainda aceita apenas
        "pix" e "cartao", e ampliar esse enum exige mexer no caminho de criação do pedido —
        que é a etapa seguinte. Ampliar só a interface criaria uma opção selecionável que
        falharia ao finalizar, que é pior do que uma que se anuncia indisponível.

        O que já vale aqui: o painel aparece e some conforme a decisão do motor, com o
        motivo quando bloqueado.
      */}
      {naEntrega !== undefined && (naEntrega.ativo || motivoRelevante !== null) && (
        <button
          type="button"
          role="radio"
          aria-checked={formaPagamento === "naEntrega"}
          disabled={!naEntrega.ativo}
          className={
            "mt-2 flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-55 " +
            (formaPagamento === "naEntrega"
              ? "border-primary bg-accent ring-primary ring-1"
              : "border-border bg-card hover:border-primary/40")
          }
          onClick={() => {
            if (!naEntrega.ativo) return;
            setValue("formaPagamento", "naEntrega", {
              shouldDirty: true,
              shouldValidate: true,
            });
            // Pré-seleciona a primeira forma liberada para o cliente não precisar de dois
            // cliques só para ver o pedido válido.
            const primeira = naEntrega.formasPermitidas[0];
            if (primeira) {
              setValue("formaPagamentoNaEntrega", primeira, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
        >
          <Banknote
            className={
              "mt-0.5 size-4 shrink-0 " +
              (naEntrega.ativo ? "text-sky-600" : "text-muted-foreground")
            }
          />
          <span className="min-w-0 space-y-1">
            <span className="block text-[13px] font-semibold">
              Pagar na entrega
              {naEntrega.ativo ? "" : " — indisponível para este pedido"}
            </span>
            <span className="text-muted-foreground block text-[12px] leading-relaxed">
              {naEntrega.ativo
                ? `Pague ao receber: ${naEntrega.formasPermitidas
                    .map((forma) => ROTULO_FORMA_PAGAMENTO_NA_ENTREGA[forma])
                    .join(", ")}.`
                : motivoRelevante}
            </span>
            {naEntrega.ativo && naEntrega.observacoesCliente !== null && (
              <span className="text-muted-foreground block text-[11px] leading-relaxed">
                {naEntrega.observacoesCliente}
              </span>
            )}
          </span>
        </button>
      )}

      {/* Detalhes: com o que vai pagar e se precisa de troco. */}
      {formaPagamento === "naEntrega" && naEntrega?.ativo && (
        <div className="mt-3 space-y-3 rounded-lg border border-sky-200 bg-sky-50/40 p-3 dark:border-sky-800 dark:bg-sky-950/20">
          <div className="grid gap-2 sm:grid-cols-2">
            {naEntrega.formasPermitidas.map((forma) => (
              <button
                key={forma}
                type="button"
                className={
                  "rounded-lg border px-3 py-2 text-left text-[13px] transition-all " +
                  (formaPagamentoNaEntrega === forma
                    ? "border-primary bg-accent ring-primary ring-1"
                    : "border-border bg-background hover:border-primary/40")
                }
                onClick={() => {
                  setValue("formaPagamentoNaEntrega", forma, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  // Trocar para uma forma sem troco precisa limpar os campos de troco,
                  // senão o pedido seguiria com "troco para R$ 200" num pagamento no débito.
                  if (forma !== "dinheiro") {
                    setValue("precisaTroco", false, { shouldValidate: true });
                    setValue("trocoParaEmCentavos", undefined, {
                      shouldValidate: true,
                    });
                  }
                }}
              >
                {ROTULO_FORMA_PAGAMENTO_NA_ENTREGA[forma]}
              </button>
            ))}
          </div>

          {formaPagamentoNaEntrega === "dinheiro" && naEntrega.exigeTroco && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  className="size-4 accent-sky-600"
                  checked={precisaTroco ?? false}
                  onChange={(evento) => {
                    setValue("precisaTroco", evento.target.checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    if (!evento.target.checked) {
                      setValue("trocoParaEmCentavos", undefined, {
                        shouldValidate: true,
                      });
                    }
                  }}
                />
                Preciso de troco
              </label>

              {precisaTroco && (
                <div className="space-y-1">
                  <label
                    htmlFor="troco-para"
                    className="text-muted-foreground block text-[11px]"
                  >
                    Vou pagar com (R$)
                  </label>
                  <input
                    id="troco-para"
                    type="number"
                    min="0"
                    step="0.01"
                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] sm:max-w-[200px]"
                    value={
                      trocoParaEmCentavos === undefined
                        ? ""
                        : (trocoParaEmCentavos / 100).toFixed(2)
                    }
                    onChange={(evento) => {
                      const texto = evento.target.value.trim();
                      setValue(
                        "trocoParaEmCentavos",
                        texto === ""
                          ? undefined
                          : Math.round(Number(texto) * 100),
                        { shouldDirty: true, shouldValidate: true },
                      );
                    }}
                  />
                  <p className="text-muted-foreground text-[11px]">
                    Precisa ser igual ou maior que {naEntrega.total}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        {formaPagamento === "pix" && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
            <Tag className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <p className="text-foreground text-[13px] leading-relaxed">
              QR Code gerado após confirmar o pedido. Economia no PIX:{" "}
              <strong className="text-emerald-600">
                {formatarPrecoCarrinho(
                  resumoCheckout?.pagamentos.pix.economiaEmCentavos ?? 0,
                )}
              </strong>
              .
            </p>
          </div>
        )}

        {formaPagamento === "cartao" && (
          <div className="animate-in slide-in-from-top-2 fade-in grid grid-cols-1 gap-2 duration-300 sm:grid-cols-2">
            {parcelamentosCartao.map((parcela) => {
              const selecionada = parcelasCartao === parcela.parcelas;

              return (
                <button
                  key={parcela.parcelas}
                  type="button"
                  className={
                    "rounded-lg border px-3 py-2.5 text-left transition-all " +
                    (selecionada
                      ? "border-primary bg-accent ring-primary ring-1"
                      : "border-border bg-background hover:border-primary/40")
                  }
                  onClick={() =>
                    setValue("parcelasCartao", parcela.parcelas, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <span className="block text-[13px] font-semibold">
                    {parcela.parcelas}x de {parcela.valor}
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    {parcela.semJuros ? "Sem juros" : `Total ${parcela.total}`}
                  </span>
                </button>
              );
            })}
            <p className="text-muted-foreground text-[11px] leading-relaxed sm:col-span-2">
              Os dados do cartão serão informados no ambiente seguro da Stripe.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
