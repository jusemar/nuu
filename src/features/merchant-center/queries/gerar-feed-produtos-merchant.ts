import "server-only";

import { obterUrlBaseSite } from "@/lib/seo/url-site";

import { montarItensMerchant } from "../lib/montar-itens-merchant";
import { serializarFeedMerchantXml } from "../lib/serializar-feed-merchant-xml";
import { listarProdutosFonteMerchant } from "./listar-produtos-fonte-merchant";

export async function gerarFeedProdutosMerchant() {
  const produtos = await listarProdutosFonteMerchant();
  const itens = await montarItensMerchant(produtos);
  return serializarFeedMerchantXml(itens, obterUrlBaseSite());
}
