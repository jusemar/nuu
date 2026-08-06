import "server-only";

import { db } from "@/db/connection";

import { avaliarElegibilidadePagamentoNaEntrega } from "../lib/avaliar-elegibilidade-pagamento-na-entrega";
import type { FormaPagamentoNaEntrega } from "../types/pagamento-na-entrega.types";
import { buscarContextoPagamentoNaEntrega } from "./buscar-contexto-pagamento-na-entrega";
import type { ExecutorConsultaPagamentoNaEntrega } from "./carregar-configuracoes-pagamento-na-entrega";

export type SeloPagamentoNaEntregaPdp = {
  /**
   * Identificadores dos serviços de entrega própria (`servicos_frete.identificador`) que
   * aceitam pagamento na entrega para este produto — por exemplo `entrega-propria-atual`
   * ou `entrega-programada`.
   *
   * A informação é por serviço, e não do produto inteiro, porque o aviso vive dentro do
   * card da modalidade na PDP: cada modalidade só anuncia o que ela própria aceita. Lista
   * vazia significa nenhuma modalidade elegível e, portanto, nenhum aviso.
   */
  servicosComPagamentoNaEntrega: string[];
  /** União das formas possíveis entre os serviços elegíveis. */
  formasPossiveis: FormaPagamentoNaEntrega[];
};

const SELO_OCULTO: SeloPagamentoNaEntregaPdp = {
  servicosComPagamentoNaEntrega: [],
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
  const servicosComPagamentoNaEntrega: string[] = [];

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

    // Nenhuma forma liberada significa que o produto, a variante, a modalidade ou a
    // configuração deste serviço barram — e aí a modalidade não anuncia nada, em vez de
    // anunciar negando.
    if (resultado.formasPermitidas.length === 0) continue;

    servicosComPagamentoNaEntrega.push(configuracao.servicoIdentificador);
    for (const forma of resultado.formasPermitidas) formasPossiveis.add(forma);
  }

  return {
    servicosComPagamentoNaEntrega,
    formasPossiveis: [...formasPossiveis],
  };
}
