import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  escaparXml,
  serializarFeedMerchantXml,
} from "./serializar-feed-merchant-xml";

describe("feed XML do Merchant Center", () => {
  it("escapa XML e omite campos opcionais ausentes", () => {
    assert.equal(
      escaparXml(`A&B <C> "D" 'E'`),
      "A&amp;B &lt;C&gt; &quot;D&quot; &apos;E&apos;",
    );
    const xml = serializarFeedMerchantXml(
      [
        {
          id: "SKU-1",
          title: "A & B",
          description: "Teste <seguro>",
          link: "https://loja.test/product/a?x=1&y=2",
          imageLink: "https://cdn.test/a.jpg",
          availability: "in_stock",
          price: { amountInCents: 12345, currency: "BRL" },
        },
      ],
      "https://loja.test",
    );
    assert.match(xml, /<g:price>123\.45 BRL<\/g:price>/);
    assert.match(xml, /A &amp; B/);
    assert.doesNotMatch(xml, /<g:gtin>/);
  });

  it("serializa agrupamento e identificadores opcionais", () => {
    const xml = serializarFeedMerchantXml(
      [
        {
          id: "VAR-1",
          title: "Produto - Azul",
          description: "Descrição",
          link: "https://loja.test/product/p",
          imageLink: "https://cdn.test/p.jpg",
          availability: "out_of_stock",
          price: { amountInCents: 999, currency: "BRL" },
          brand: "Marca",
          gtin: "7891234567895",
          mpn: "MPN-1",
          itemGroupId: "grupo-1",
          itemGroupTitle: "Produto",
          color: "Azul & Verde",
          size: "M",
          material: "Algodão",
          pattern: "Listrado",
          variantOptions: [
            { name: "Cor", value: "Azul & Verde" },
            { name: "Voltagem", value: "220 V" },
          ],
          shippingLabel: "grande-volume+produto-fragil",
        },
      ],
      "https://loja.test",
    );
    assert.match(xml, /<g:item_group_id>grupo-1<\/g:item_group_id>/);
    assert.match(xml, /<g:gtin>7891234567895<\/g:gtin>/);
    assert.match(xml, /<g:item_group_title>Produto<\/g:item_group_title>/);
    assert.match(xml, /<g:color>Azul &amp; Verde<\/g:color>/);
    assert.match(
      xml,
      /<g:variant_option><g:name>Voltagem<\/g:name><g:value>220 V<\/g:value><\/g:variant_option>/,
    );
    assert.match(
      xml,
      /<g:shipping_label>grande-volume\+produto-fragil<\/g:shipping_label>/,
    );
    assert.doesNotMatch(xml, /<g:shipping>/);
    assert.doesNotMatch(xml, /<g:condition>/);
    assert.doesNotMatch(xml, /<g:identifier_exists>/);
  });
});
