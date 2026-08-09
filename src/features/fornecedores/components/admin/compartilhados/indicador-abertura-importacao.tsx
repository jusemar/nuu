"use client";

import { Loader2 } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { useLinkStatus } from "next/link";

/**
 * Sinaliza, dentro de um `<Link>`, que a navegação já começou.
 *
 * Por que é um componente separado
 * --------------------------------
 * `useLinkStatus` só enxerga a navegação quando é chamado de dentro de um
 * componente **filho** do `<Link>` — mesma regra do `useFormStatus`. Se a lista
 * inteira chamasse o hook, `pending` ficaria sempre `false` e o clique
 * continuaria sem resposta.
 *
 * O problema que isso resolve: abrir uma importação carrega staging, revisão,
 * rascunhos e opções de mapeamento no servidor. Isso leva alguns segundos e,
 * até aqui, a tela não dizia nada — o gestor clicava de novo achando que tinha
 * travado. Agora a seta vira spinner no mesmo instante do clique.
 *
 * O estado morre sozinho quando a rota troca: não há estado manual para limpar,
 * nem risco de o indicador ficar preso ligado se a navegação falhar.
 */
export function IndicadorAberturaImportacao() {
  const { pending } = useLinkStatus();

  if (pending) {
    return (
      <span
        className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
        role="status"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Abrindo…
      </span>
    );
  }

  return (
    <ChevronRight
      className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
      aria-hidden="true"
    />
  );
}
