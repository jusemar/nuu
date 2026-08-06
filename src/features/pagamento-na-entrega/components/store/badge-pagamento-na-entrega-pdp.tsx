import { Banknote } from "lucide-react";

import { ROTULO_BADGE_PAGAMENTO_NA_ENTREGA } from "../../constants/pagamento-na-entrega.constants";

/**
 * Indicador que vive **dentro do card de uma modalidade de entrega** na página de produto.
 *
 * Substituiu o aviso solto que ficava no topo da área comercial. O aviso antigo falava do
 * produto inteiro e, com mais de uma modalidade em tela, o cliente não tinha como saber a
 * qual delas a informação se referia. Aqui a informação fica onde ela é verdadeira: a
 * modalidade que aceita pagamento na entrega é a que carrega o indicador.
 *
 * Quem decide se este componente aparece é sempre `avaliarSeloPagamentoNaEntregaPdp`, que
 * roda o motor de elegibilidade uma vez por serviço. Este arquivo não conhece regra nenhuma
 * — só desenha.
 */
export function BadgePagamentoNaEntregaPdp() {
  return (
    <span className="bg-success-light text-success mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] leading-tight font-bold">
      <Banknote className="size-3 shrink-0" aria-hidden="true" />
      {ROTULO_BADGE_PAGAMENTO_NA_ENTREGA}
    </span>
  );
}
