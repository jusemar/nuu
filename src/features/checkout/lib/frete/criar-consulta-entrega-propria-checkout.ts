import { consultarEntregaPropriaLoja } from "@/features/logistica";

import type {
  ConsultaEntregaPropriaRevalidacaoCheckout,
  ProdutoRevalidacaoFreteCheckout,
} from "./revalidar-frete-checkout";

export function criarConsultaEntregaPropriaCheckout() {
  return async ({
    produto,
    cep,
  }: {
    produto: ProdutoRevalidacaoFreteCheckout;
    cep: string;
  }): Promise<ConsultaEntregaPropriaRevalidacaoCheckout> => {
    const entrega = await consultarEntregaPropriaLoja({
      produtoId: produto.id,
      cep,
    });

    if (!entrega.disponivel) {
      return {
        disponivel: false,
        motivo: entrega.mensagem,
      };
    }

    return {
      disponivel: true,
      valorEmCentavos: entrega.valorEmCentavos,
      descricao: entrega.prazoEntrega ?? entrega.descricao,
      metadados: {
        nivelEntregaPropriaAtual: entrega.nivel,
        promessaEntregaPropria: entrega.promessaEntrega ?? null,
        regiaoEntregaPropria: entrega.regiaoResolvida ?? null,
        bairro: entrega.bairro,
        cidade: entrega.cidade,
        uf: entrega.uf,
      },
    };
  };
}
