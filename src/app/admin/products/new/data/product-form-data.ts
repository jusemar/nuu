import type { UploadedImage } from "@/app/admin/products/new/components/image-upload/ProductImageGallery";
import type { ProductOwnDeliveryPriceFormItem } from "@/features/admin/logistics/entrega-propria/types/shipping";
import type { DimensoesFreteExternoProduto } from "@/features/admin/logistica/types/logistica.types";
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
  storeProductFlags: string[];
  collection: string;
  tags: string[];
  productKind: ProductKind;
  productType: string;
  productCode: string;
  ncmCode: string;
  images: UploadedImage[];

  // Dados de outras abas (serão preenchidos depois)
  pricing?: any;
  shipping?: any;
  dimensoesFreteExterno?: DimensoesFreteExternoProduto;
  entrega?: {
    permiteRetirada?: boolean;
    modeloRetiradaId?: string | null;
    prazoCustom?: string;
    permiteEntregaPropria?: boolean;
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
  warranty?: any;
  attributes: ProductAttributeInput[];
  variants: ProductVariantFormInput[];
  seller?: any;
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
  storeProductFlags: [],
  collection: "",
  tags: [],
  productKind: "simple",
  productType: "",
  productCode: "",
  ncmCode: "",
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
    precosEntregaPropria: [],
    classificacoesLogisticasIds: [],
  },
  dimensoesFreteExterno: {},
};
