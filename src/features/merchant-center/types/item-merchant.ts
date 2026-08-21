import type { PrecoModalidadeVitrineEntrada } from "@/features/precificacao/server";

export type DisponibilidadeMerchant =
  | "in_stock"
  | "out_of_stock"
  | "preorder"
  | "backorder";

export type ItemMerchant = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  availability: DisponibilidadeMerchant;
  price: { amountInCents: number; currency: "BRL" };
  brand?: string;
  gtin?: string;
  mpn?: string;
  itemGroupId?: string;
  itemGroupTitle?: string;
  color?: string;
  size?: string;
  material?: string;
  pattern?: string;
  variantOptions?: Array<{ name: string; value: string }>;
  condition?: "new" | "used" | "refurbished";
  identifierExists?: "no";
  shippingLabel?: string;
};

export type VinculoClassificacaoLogisticaMerchant = {
  tipoLogisticoId: string;
  tipoLogistico: {
    ativo: boolean;
    identificador: string;
  };
};

export type IdentificadorFonteMerchant = {
  tipo: "gtin" | "mpn";
  valor: string;
  gtinTipo: "gtin_8" | "gtin_12" | "gtin_13" | "gtin_14" | null;
  status: "pendente" | "verificado" | "rejeitado" | "conflito";
  principal: boolean;
  marcaId: string | null;
};

export type VarianteFonteMerchant = {
  id: string;
  sku: string;
  name: string | null;
  attributes: Record<string, string>;
  priceInCents: number;
  comparePriceInCents: number | null;
  stockQuantity: number;
  weightInGrams: number | null;
  heightInCm: number | null;
  widthInCm: number | null;
  lengthInCm: number | null;
  imageUrl: string | null;
  isActive: boolean;
  isDefault: boolean;
  identificadoresCatalogo: IdentificadorFonteMerchant[];
  classificacoesLogisticas: VinculoClassificacaoLogisticaMerchant[];
};

export type ProdutoFonteMerchant = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  productKind: string;
  canonicalUrl: string | null;
  marcaId: string;
  marca: { nome: string } | null;
  pricing: PrecoModalidadeVitrineEntrada[];
  variants: VarianteFonteMerchant[];
  galleryImages: Array<{
    imageUrl: string;
    isPrimary: boolean | null;
    sortOrder: number | null;
  }>;
  identificadoresCatalogo: IdentificadorFonteMerchant[];
  classificacoesLogisticas: VinculoClassificacaoLogisticaMerchant[];
};
