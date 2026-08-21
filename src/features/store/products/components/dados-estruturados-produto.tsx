import type { PrecosProdutoPorModalidade } from "@/features/precificacao/client";
import { serializarJsonLd } from "@/lib/seo/serializar-json-ld";

import type { CategoriaBreadcrumb } from "../../category/queries/buscar-categoria-publica";
import {
  montarBreadcrumbListProduto,
  montarDadosEstruturadosProduto,
} from "../lib/dados-estruturados-produto";
import type {
  PrecoModalidade,
  VarianteProdutoLoja,
} from "../types/product.types";

type DadosEstruturadosProdutoProps = {
  produto: {
    name: string;
    slug: string;
    description: string | null;
    brand: string | null;
    sku: string | null;
    productKind: string | null;
    marcaId: string | null;
    identificadoresCatalogo?: Array<{
      tipo: "gtin" | "mpn";
      valor: string;
      gtinTipo: "gtin_8" | "gtin_12" | "gtin_13" | "gtin_14" | null;
      marcaId: string | null;
      status: "pendente" | "verificado" | "rejeitado" | "conflito";
      principal: boolean;
    }>;
    galleryImages: Array<{ imageUrl: string; isPrimary: boolean | null }>;
    pricing: PrecoModalidade[];
    variants: Array<
      VarianteProdutoLoja & {
        identificadoresCatalogo?: NonNullable<
          DadosEstruturadosProdutoProps["produto"]["identificadoresCatalogo"]
        >;
      }
    >;
  };
  urlCanonica: string;
  nomeVendedor: string | null;
  breadcrumbCategorias: CategoriaBreadcrumb[];
  precosCalculadosPorModalidade: PrecosProdutoPorModalidade;
  precosCalculadosPorVariante: PrecosProdutoPorModalidade;
};

/** Responsabilidade única pelos dados estruturados da página de produto. */
export function DadosEstruturadosProduto({
  produto,
  urlCanonica,
  nomeVendedor,
  breadcrumbCategorias,
  precosCalculadosPorModalidade,
  precosCalculadosPorVariante,
}: DadosEstruturadosProdutoProps) {
  const dados = montarDadosEstruturadosProduto({
    produto,
    urlCanonica,
    nomeVendedor,
    precosCalculadosPorModalidade,
    precosCalculadosPorVariante,
  });
  const breadcrumbList = montarBreadcrumbListProduto({
    breadcrumbCategorias,
    nomeProduto: produto.name,
    urlCanonica,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(breadcrumbList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(dados) }}
      />
    </>
  );
}
