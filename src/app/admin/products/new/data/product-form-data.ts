import type { UploadedImage } from "@/app/admin/products/new/components/image-upload/ProductImageGallery";
import type { DimensoesFreteExternoProduto } from "@/features/admin/logistica/types/logistica.types";
import type { ProductOwnDeliveryPriceFormItem } from "@/features/admin/logistics/entrega-propria/types/shipping";
import type {
  ProductAttributeInput,
  ProductKind,
  ProductVariantFormInput,
} from "@/features/products";
export interface BasicTabProps {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}
// Primeiro, defina um tipo comum para Image
export interface ProductImage {
  id: string;
  url: string;
  preview?: string; // tornar obrigatório para compatibilidade
  isPrimary: boolean;
  altText?: string;
  uploadProgress?: number;
  file?: File;
}

export interface ProductFormData {
  // Dados básicos
  name: string;
  slug: string;
  description: string;
  cardShortText: string;
  categoryId: string;
  brandId: string;
  brand: string;
  sku: string;
  isActive: boolean;
  status?: "draft" | "published";
  storeProductFlags: string[];
  collection: string;
  tags: string[];
  productKind: ProductKind;
  productType: string;
  productCode: string;
  ncmCode: string;
  gtinProdutoSimples: string;
  mpnProduto: string;
  /** Estoque da variante técnica; usado exclusivamente por produto simples. */
  estoqueProdutoSimples: number;
  /** Protege produtos legados cuja variante técnica não pode ser identificada. */
  estoqueProdutoSimplesIndisponivel?: boolean;
  images: UploadedImage[];

  // Dados de outras abas (serão preenchidos depois)
  pricing?: {
    costPrice?: string;
    modalities?: Record<
      string,
      {
        price: string;
        deliveryText: string;
        promo: {
          active: boolean;
          type: string;
          price: string;
          endDate?: Date;
        };
      }
    >;
    mainCardPriceType?: string;
    configuracaoMapeamentoComercial?: unknown;
  };
  shipping?: {
    weight?: string | number;
    length?: string | number;
    width?: string | number;
    height?: string | number;
    hasFreeShipping?: boolean;
    hasLocalPickup?: boolean;
  };
  dimensoesFreteExterno?: DimensoesFreteExternoProduto;
  entrega?: {
    permiteRetirada?: boolean;
    modeloRetiradaId?: string | null;
    prazoCustom?: string;
    permiteEntregaPropria?: boolean;
    /** Modos de expedição persistidos no produto (own, supplier ou carrier). */
    tiposEntregaPermitidos?: string[];
    /** Opt-in do produto para pagar no recebimento. Nasce desligado. */
    aceitaPagamentoNaEntrega?: boolean;
    precosEntregaPropria?: ProductOwnDeliveryPriceFormItem[];
    classificacoesLogisticasIds?: string[];
  };
  modelosRetirada?: Array<{
    id: string;
    nome: string;
    prazoTexto: string;
    mensagem: string | null;
    ativo: boolean;
  }>;
  warranty?: {
    period?: string;
    provider?: string;
    terms?: string;
  };
  attributes: ProductAttributeInput[];
  variants: ProductVariantFormInput[];
  seller?: {
    sellerCode?: string;
    internalCode?: string;
    sellerInfo?: string;
  };
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

// Adicione estas interfaces no product-form-data.ts
export interface PricingTabProps {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export interface ShippingTabProps {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export interface WarrantyTabProps {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export interface VariantsTabProps {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export interface SellerTabProps {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export interface SeoTabProps {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export interface EntregaTabProps {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export const initialProductData: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  cardShortText: "",
  categoryId: "",
  brandId: "",
  brand: "",
  sku: "",
  isActive: true,
  status: "draft",
  storeProductFlags: ["general"],
  collection: "",
  tags: [],
  productKind: "simple",
  productType: "",
  productCode: "",
  ncmCode: "",
  gtinProdutoSimples: "",
  mpnProduto: "",
  estoqueProdutoSimples: 0,
  images: [],
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  attributes: [],
  variants: [],
  entrega: {
    permiteRetirada: false,
    modeloRetiradaId: null,
    prazoCustom: "",
    permiteEntregaPropria: false,
    tiposEntregaPermitidos: ["own"],
    aceitaPagamentoNaEntrega: false,
    precosEntregaPropria: [],
    classificacoesLogisticasIds: [],
  },
  dimensoesFreteExterno: {},
};
