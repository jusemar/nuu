import assert from "node:assert/strict";
import test from "node:test";

import { montarMetadataProduto } from "./metadata-produto";

const produto = {
  name: "Produto Real",
  description: "<p>Descrição editorial real.</p>",
  metaTitle: "Título SEO",
  metaDescription: "Descrição SEO",
  galleryImages: [
    {
      imageUrl: "https://cdn.example.com/produto.jpg",
      altText: "Produto visto de frente",
      isPrimary: true,
    },
  ],
};

test("Open Graph e Twitter usam os mesmos dados e a imagem principal", () => {
  const urlCanonica = "https://loja.example.com/product/produto-real";
  const metadata = montarMetadataProduto({ produto, urlCanonica });

  assert.equal(metadata.title, "Título SEO");
  assert.equal(metadata.description, "Descrição SEO");
  assert.equal(metadata.openGraph?.title, "Título SEO");
  assert.equal(metadata.openGraph?.description, "Descrição SEO");
  assert.equal(metadata.openGraph?.url, urlCanonica);
  assert.equal(
    metadata.openGraph && "type" in metadata.openGraph
      ? metadata.openGraph.type
      : undefined,
    "website",
  );
  assert.deepEqual(metadata.openGraph?.images, [
    {
      url: "https://cdn.example.com/produto.jpg",
      alt: "Produto visto de frente",
    },
  ]);
  assert.equal(
    metadata.twitter && "card" in metadata.twitter
      ? metadata.twitter.card
      : undefined,
    "summary_large_image",
  );
  assert.equal(metadata.twitter?.title, metadata.openGraph?.title);
  assert.equal(metadata.twitter?.description, metadata.openGraph?.description);
  assert.deepEqual(metadata.twitter?.images, metadata.openGraph?.images);
});

test("metadata sem imagem usa summary e não inventa dimensões", () => {
  const metadata = montarMetadataProduto({
    produto: { ...produto, galleryImages: [] },
    urlCanonica: "https://loja.example.com/product/sem-imagem",
  });

  assert.equal(
    metadata.twitter && "card" in metadata.twitter
      ? metadata.twitter.card
      : undefined,
    "summary",
  );
  assert.equal(metadata.twitter?.images, undefined);
  assert.equal(metadata.openGraph?.images, undefined);
});
