import "server-only";

import { db } from "@/db/connection";

import { MENSAGEM_SELO_PDP_PAGAMENTO_NA_ENTREGA } from "../constants/pagamento-na-entrega.constants";
import { avaliarElegibilidadePagamentoNaEntrega } from "../lib/avaliar-elegibilidade-pagamento-na-entrega";
import type { FormaPagamentoNaEntrega } from "../types/pagamento-na-entrega.types";
import { buscarContextoPagamentoNaEntrega } from "./buscar-contexto-pagamento-na-entrega";
import type { ExecutorConsultaPagamentoNaEntrega } from "./carregar-configuracoes-pagamento-na-entrega";

export type SeloPagamentoNaEntregaPdp = {
  /** Só é `true` quando existe ao menos uma forma possível. */
  exibir: boolean;
  /** Texto aprovado, sem promessa de elegibilidade. */
  mensagem: string;
  formasPossiveis: FormaPagamentoNaEntrega[];
};

const SELO_OCULTO: SeloPagamentoNaEntregaPdp = {
  exibir: false,
  mensagem: MENSAGEM_SELO_PDP_PAGAMENTO_NA_ENTREGA,
  formasPossiveis: [],
};

/**
 * Decide se a página de produto deve informar que existe pagamento na entrega.
 *
 * A PDP tem um problema próprio: ainda não há frete escolhido, endereço nem total, e o
 * motor — corretamente — recusa decidir sem isso. A pergunta aqui é outra e mais fraca:
 * *este produto poderia, em princípio, ser pago na entrega?*
 *
 * Em vez de reimplementar as regras com essa pergunta mais fraca — que é como uma segunda
 * fonte de verdade nasce e passa a divergir —, o motor é executado uma vez **por serviço
 * de entrega própria configurado**, simulando que aquele serviço foi escolhido. Se algum
 * deles devolver formas, o selo aparece com a união delas.
 *
 * A resposta é sempre parcial: sem total e sem CEP o motor devolve `decisaoParcial: true`
 * e `elegivel: false`, e é justamente por isso que o texto promete só o que pode cumprir —
 * a confirmação acontece no checkout.
 */
export async function avaliarSeloPagamentoNaEntregaPdp(
  entrada: {
    produtoId: string;
    varianteId?: string | null;
    /** `product_pricing.type` da modalidade em exibição. */
    modalidadeComercial?: string | null;
    /**
     * `product.allowsOwnDelivery`. Desligado, nenhum serviço de entrega própria chega a
     * ser ofertado — anunciar pagamento na entrega seria prometer algo que a cotação
     * nunca vai oferecer. É disponibilidade de serviço, não regra de elegibilidade.
     */
    permiteEntregaPropria: boolean;
  },
  executor: ExecutorConsultaPagamentoNaEntrega = db,
): Promise<SeloPagamentoNaEntregaPdp> {
  if (!entrada.permiteEntregaPropria) return SELO_OCULTO;

  const contexto = await buscarContextoPagamentoNaEntrega(
    {
      itens: [
        {
          itemCarrinhoId: "pdp",
          produtoId: entrada.produtoId,
          varianteId: entrada.varianteId ?? null,
          modalidadeInformada: entrada.modalidadeComercial ?? null,
          // Preenchido abaixo, um serviço por vez.
          frete: null,
        },
      ],
    },
    executor,
  );

  const item = contexto.itens[0];

  if (item === undefined || contexto.configuracoesPorServico.length === 0) {
    return SELO_OCULTO;
  }

  const avaliadoEm = new Date().toISOString();
  const formasPossiveis = new Set<FormaPagamentoNaEntrega>();

  for (const configuracao of contexto.configuracoesPorServico) {
    const resultado = avaliarElegibilidadePagamentoNaEntrega({
      contexto: "pdp",
      itens: [
        {
          ...item,
          frete: {
            provedor: "entrega-propria",
            servico: configuracao.servicoIdentificador,
            cepCotado: null,
          },
        },
      ],
      // Sem total e sem CEP: a resposta nasce parcial de propósito.
      totalPedidoEmCentavos: null,
      cepEntrega: null,
      configuracaoGlobalAtiva: contexto.configuracaoGlobalAtiva,
      configuracoesPorServico: contexto.configuracoesPorServico,
      avaliadoEm,
    });

    for (const forma of resultado.formasPermitidas) formasPossiveis.add(forma);
  }

  return {
    // Nenhuma forma possível significa que o produto, a variante, a modalidade ou a
    // configuração barram — e nesse caso o selo não aparece, em vez de aparecer negando.
    exibir: formasPossiveis.size > 0,
    mensagem: MENSAGEM_SELO_PDP_PAGAMENTO_NA_ENTREGA,
    formasPossiveis: [...formasPossiveis],
  };
}
