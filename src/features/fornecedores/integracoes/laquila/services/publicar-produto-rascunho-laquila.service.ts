import { publicarProdutoRascunhoFornecedor } from "@/features/fornecedores/services/publicar-produto-rascunho-fornecedor.service";

import { PROVEDOR_INTEGRACAO_LAQUILA } from "../constants";

export function publicarProdutoRascunhoLaquila(rascunhoId: string) {
  return publicarProdutoRascunhoFornecedor(rascunhoId, {
    origemTipo: "fornecedor_api",
    origemProvedor: PROVEDOR_INTEGRACAO_LAQUILA,
    nomeOrigem: "Laquila",
    modalidadePadrao: "dropshipping",
    prazoEntregaPadrao: "Prazo informado após a confirmação do pedido",
  });
}
