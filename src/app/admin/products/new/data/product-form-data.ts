export interface BasicTabProps {
  data: ProductFormData
  onChange: (updates: Partial<ProductFormData>) => void
}
// Primeiro, defina um tipo comum para Image
export interface ProductImage {
  id: string;
  url: string;
  preview: string; // tornar obrigatório para compatibilidade
  isPrimary: boolean;
  altText?: string;
  uploadProgress?: number;
  file?: File;
}

export interface ProductFormData {
  // Dados básicos
  name: string
  slug: string
  description: string
  cardShortText: string
  categoryId: string
  brand: string
  sku: string
  isActive: boolean
  collection: string
  tags: string[]
  productType: string
  productCode: string
  ncmCode: string
  images: ProductImage[]; // Usar o tipo comum
  
  // Dados de outras abas (serão preenchidos depois)
  pricing?: any
  shipping?: any
  warranty?: any
  variants?: any
  seller?: any 
  metaTitle?: string
  metaDescription?: string 
  canonicalUrl?: string
  
}

// Adicione estas interfaces no product-form-data.ts
export  interface PricingTabProps {
  data: ProductFormData
  onChange: (updates: Partial<ProductFormData>) => void
}

export interface ShippingTabProps {
  data: ProductFormData
  onChange: (updates: Partial<ProductFormData>) => void
}

export interface WarrantyTabProps {
  data: ProductFormData
  onChange: (updates: Partial<ProductFormData>) => void
}

export interface VariantsTabProps {
  data: ProductFormData
  onChange: (updates: Partial<ProductFormData>) => void
}

export interface SellerTabProps {
  data: ProductFormData
  onChange: (updates: Partial<ProductFormData>) => void
}

export interface SeoTabProps {
  data: ProductFormData 
  onChange: (updates: Partial<ProductFormData>) => void
}

export const initialProductData: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  cardShortText: '', 
  categoryId: '',
  brand: '',
  sku: '',
  isActive: true,
  collection: '',
  tags: [],
  productType: '',
  productCode: '',
  ncmCode: '',
  images: [], 
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
}
