import type { ItemMerchant } from "../types/item-merchant";

export function escaparXml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function campo(nome: string, valor: string | undefined) {
  return valor ? `<g:${nome}>${escaparXml(valor)}</g:${nome}>` : "";
}

function opcoesVariante(opcoes: ItemMerchant["variantOptions"]) {
  return (opcoes ?? [])
    .map(
      (opcao) =>
        `<g:variant_option><g:name>${escaparXml(opcao.name)}</g:name><g:value>${escaparXml(opcao.value)}</g:value></g:variant_option>`,
    )
    .join("");
}

export function serializarFeedMerchantXml(
  itens: ItemMerchant[],
  urlLoja: string,
) {
  const produtos = itens.map((item) =>
    [
      "<item>",
      campo("id", item.id),
      campo("title", item.title),
      campo("description", item.description),
      campo("link", item.link),
      campo("image_link", item.imageLink),
      campo("availability", item.availability),
      campo(
        "price",
        `${(item.price.amountInCents / 100).toFixed(2)} ${item.price.currency}`,
      ),
      campo("brand", item.brand),
      campo("gtin", item.gtin),
      campo("mpn", item.mpn),
      campo("item_group_id", item.itemGroupId),
      campo("item_group_title", item.itemGroupTitle),
      campo("color", item.color),
      campo("size", item.size),
      campo("material", item.material),
      campo("pattern", item.pattern),
      opcoesVariante(item.variantOptions),
      campo("condition", item.condition),
      campo("identifier_exists", item.identifierExists),
      campo("shipping_label", item.shippingLabel),
      "</item>",
    ].join(""),
  );
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Catálogo de produtos</title><link>${escaparXml(urlLoja)}</link><description>Produtos públicos da loja</description>${produtos.join("")}</channel></rss>`;
}
