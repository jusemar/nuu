import { Banknote } from "lucide-react";

import type { SeloPagamentoNaEntregaPdp } from "../../queries/avaliar-pagamento-na-entrega-pdp";

/**
 * Selo informativo da página de produto.
 *
 * Componente de servidor puro: recebe a decisão já calculada e só renderiza. Não busca
 * nada, não tem estado e não oferece escolha nenhuma — pagar na entrega continua sendo
 * decidido no checkout, depois da revalidação.
 *
 * Quando não há nada a informar, não renderiza — em vez de aparecer dizendo "indisponível".
 * Um aviso negativo em toda página de produto seria ruído para o cliente e não o ajudaria
 * em nada: ele não tem como agir sobre isso ali.
 */
export function SeloPagamentoNaEntregaPdp({
  selo,
}: {
  selo: SeloPagamentoNaEntregaPdp;
}) {
  if (!selo.exibir) return null;

  return (
    <div
      className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-900 dark:bg-sky-950/20"
      // Informativo e não urgente: `role="note"` deixa o leitor de tela anunciar o bloco
      // como um comentário à parte, sem interromper a leitura do preço e do botão.
      role="note"
    >
      <Banknote
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400"
      />
      <p className="text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        {selo.mensagem}
      </p>
    </div>
  );
}
