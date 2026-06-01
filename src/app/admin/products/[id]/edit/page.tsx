"use client";

import Link from "next/link";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateProduct } from "@/hooks/admin/mutations/products/useUpdateProduct";
import { useProductId } from "@/hooks/admin/queries/products/use-Product-Id";
import { useState, useEffect, useRef } from "react";
import {
  ProductFormData,
  initialProductData,
} from "../../new/data/product-form-data";
import { useParams } from "next/navigation";

// Import das abas
import { BasicTab } from "../../new/components/tabs/BasicTab";
import { PricingTab } from "../../new/components/tabs/PricingTab";
import { ShippingTab } from "../../../../../features/admin/products/components/ShippingTab";
import { EntregaTab } from "../../new/components/tabs/EntregaTab";
import { WarrantyTab } from "../../new/components/tabs/WarrantyTab";
import {
  clearVariantsDraft,
  VariantsTab,
} from "../../new/components/tabs/VariantsTab";
import { SellerTab } from "../../new/components/tabs/SellerTab";
import { SeoTab } from "../../new/components/tabs/SeoTab";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const variantsDraftKey = `produto-${productId}`;

  const { data: productResponse, isLoading } = useProductId(productId);
  const updateProductMutation = useUpdateProduct();

  const [productData, setProductData] =
    useState<ProductFormData>(initialProductData);
  const carregamentoInicialAplicadoRef = useRef(false);

  useEffect(() => {
    carregamentoInicialAplicadoRef.current = false;
  }, [productId]);

  useEffect(() => {
    if (
      productResponse?.success &&
      productResponse.data &&
      !carregamentoInicialAplicadoRef.current
    ) {
      const product = productResponse.data;
      // Função para mapear modalidades do banco para estrutura do frontend
      const mapModalitiesFromDB = (dbModalities: any) => {
        return {
          stock: {
            price: dbModalities?.stock?.price || "",
            deliveryText: dbModalities?.stock?.deliveryText || "",
            promo: {
              active: dbModalities?.stock?.promo?.active || false,
              type: dbModalities?.stock?.promo?.type || "normal",
              price: dbModalities?.stock?.promo?.price || "",
              endDate: dbModalities?.stock?.promo?.endDate
                ? new Date(dbModalities.stock.promo.endDate)
                : undefined,
            },
          },
          preSale: {
            price: dbModalities?.preSale?.price || "",
            deliveryText: dbModalities?.preSale?.deliveryText || "",
            promo: {
              active: dbModalities?.preSale?.promo?.active || false,
              type: dbModalities?.preSale?.promo?.type || "normal",
              price: dbModalities?.preSale?.promo?.price || "",
              endDate: dbModalities?.preSale?.promo?.endDate
                ? new Date(dbModalities.preSale.promo.endDate)
                : undefined,
            },
          },
          dropshipping: {
            price: dbModalities?.dropshipping?.price || "",
            deliveryText: dbModalities?.dropshipping?.deliveryText || "",
            promo: {
              active: dbModalities?.dropshipping?.promo?.active || false,
              type: dbModalities?.dropshipping?.promo?.type || "normal",
              price: dbModalities?.dropshipping?.promo?.price || "",
              endDate: dbModalities?.dropshipping?.promo?.endDate
                ? new Date(dbModalities.dropshipping.promo.endDate)
                : undefined,
            },
          },
          orderBasis: {
            price: dbModalities?.orderBasis?.price || "",
            deliveryText: dbModalities?.orderBasis?.deliveryText || "",
            promo: {
              active: dbModalities?.orderBasis?.promo?.active || false,
              type: dbModalities?.orderBasis?.promo?.type || "normal",
              price: dbModalities?.orderBasis?.promo?.price || "",
              endDate: dbModalities?.orderBasis?.promo?.endDate
                ? new Date(dbModalities.orderBasis.promo.endDate)
                : undefined,
            },
          },
        };
      };

      setProductData({
        // Campos básicos
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        cardShortText: product.cardShortText || "",
        categoryId: product.categoryId || "",
        brandId: product.brandId || "",
        brand: product.brand || "",
        sku: product.sku || "",
        isActive: product.isActive ?? true,
        collection: product.collection || "",
        tags: product.tags || [],
        productKind: product.productKind === "variable" ? "variable" : "simple",

        // Store Product Flags (campo que estava faltando)
        storeProductFlags: product.storeProductFlags || [],

        // Códigos do produto
        productType: product.productType || "",
        productCode: product.productCode || "",
        ncmCode: product.ncmCode || "",

        // SEO (campos que estavam faltando)
        metaTitle: product.metaTitle || "",
        metaDescription: product.metaDescription || "",
        canonicalUrl: product.canonicalUrl || "",

        // Dados de preços (estrutura que estava faltando)
        pricing: {
          costPrice: (product.pricing as any)?.costPrice || "",
          modalities: mapModalitiesFromDB(product.pricing?.modalities),
          mainCardPriceType: product.pricing?.mainCardPriceType || "",
        },

        // Dados de garantia (campos que estavam faltando)
        warranty: {
          period: product.warrantyPeriod?.toString() || "",
          provider: product.warrantyProvider || "",
          terms: "",
        },

        // Imagens da galeria principal (vindas da tabela product_gallery_images)
        images: Array.isArray(product.images)
          ? product.images.map((img: any) => ({
              id: String(img.id),
              url: String(img.url ?? ""),
              preview: String(img.url ?? img.preview ?? ""),
              isPrimary: Boolean(img.isPrimary),
            }))
          : [],

        attributes: Array.isArray(product.attributes)
          ? product.attributes.map((attribute: any) => ({
              id: String(attribute.id),
              productId: String(attribute.productId),
              name: String(attribute.name ?? ""),
              values: Array.isArray(attribute.values) ? attribute.values : [],
            }))
          : [],

        variants: Array.isArray(product.variants)
          ? product.variants.map((variant: any) => ({
              id: String(variant.id),
              productId: String(variant.productId),
              sku: String(variant.sku ?? ""),
              name: variant.name ?? null,
              attributes: variant.attributes ?? {},
              priceInCents: Number(variant.priceInCents ?? 0),
              comparePriceInCents: variant.comparePriceInCents,
              stockQuantity: Number(variant.stockQuantity ?? 0),
              weightInGrams: variant.weightInGrams,
              heightInCm: variant.heightInCm,
              widthInCm: variant.widthInCm,
              lengthInCm: variant.lengthInCm,
              imageUrl: variant.imageUrl,
              classificacoesLogisticasIds:
                variant.classificacoesLogisticasIds ?? [],
              isActive: Boolean(variant.isActive),
              isDefault: Boolean(variant.isDefault),
            }))
          : [],

        // Campos de shipping (valores padrão)
        shipping: {
          weight: product.weight ?? "",
          length: product.length ?? "",
          width: product.width ?? "",
          height: product.height ?? "",
          hasFreeShipping: false,
          hasLocalPickup: false,
        },
        dimensoesFreteExterno: {
          pesoEmKg:
            product.weight === null || product.weight === undefined
              ? ""
              : String(Number(product.weight) / 1000),
          alturaEmCm: product.height?.toString() ?? "",
          larguraEmCm: product.width?.toString() ?? "",
          comprimentoEmCm: product.length?.toString() ?? "",
        },

        // Campos de retirada local (entrega)
        entrega: {
          permiteRetirada: product.allowsPickup ?? false,
          modeloRetiradaId: product.modeloRetiradaId || null,
          prazoCustom: product.prazoRetiradaCustom || "",
          permiteEntregaPropria: product.allowsOwnDelivery ?? false,
          precosEntregaPropria: product.precosEntregaPropria || [],
          classificacoesLogisticasIds:
            product.classificacoesLogisticasIds || [],
        },

        // Campos de vendedor (valores padrão)
        seller: {
          sellerCode: product.sellerCode || "",
          internalCode: product.internalCode || "",
          sellerInfo: product.sellerInfo || "",
        },
      });
      carregamentoInicialAplicadoRef.current = true;
    }
  }, [productResponse, productId]);

  const tabs = [
    {
      name: "📝 Básico",
      value: "basic",
      component: (
        <BasicTab
          data={productData}
          onChange={(updates: Partial<ProductFormData>) =>
            setProductData((prev) => ({ ...prev, ...updates }))
          }
        />
      ),
    },
    {
      name: "💲 Preços",
      value: "pricing",
      component: (
        <PricingTab
          data={productData}
          onChange={(updates: Partial<ProductFormData>) =>
            setProductData((prev) => ({ ...prev, ...updates }))
          }
        />
      ),
    },
    {
      name: "🚚 Frete",
      value: "shipping",
      component: (
        <ShippingTab
          data={productData}
          onChange={(updates: Partial<{ [key: string]: any }>) =>
            setProductData((prev) => ({
              ...prev,
              shipping: { ...prev.shipping, ...updates },
            }))
          }
        />
      ),
    },
    {
      name: "📦 Entrega",
      value: "entrega",
      component: (
        <EntregaTab
          data={productData.entrega ?? {}}
          productId={productId}
          dimensoesFrete={productData.dimensoesFreteExterno}
          aoAlterarDimensoes={(dimensoes) =>
            setProductData((prev) => ({
              ...prev,
              dimensoesFreteExterno: dimensoes,
            }))
          }
          onChange={(updates) =>
            setProductData((prev) => ({
              ...prev,
              entrega: { ...prev.entrega, ...updates },
            }))
          }
        />
      ),
    },
    {
      name: "🛡️ Garantia",
      value: "warranty",
      component: (
        <WarrantyTab
          data={productData}
          onChange={(updates: Partial<ProductFormData>) =>
            setProductData((prev) => ({ ...prev, ...updates }))
          }
        />
      ),
    },
    {
      name: "🎨 Variantes",
      value: "variants",
      component: (
        <VariantsTab
          data={productData}
          draftKey={variantsDraftKey}
          onChange={(updates: Partial<ProductFormData>) =>
            setProductData((prev) => ({ ...prev, ...updates }))
          }
        />
      ),
    },
    {
      name: "🔍 SEO",
      value: "seo",
      component: (
        <SeoTab
          data={productData}
          onChange={(updates: Partial<ProductFormData>) =>
            setProductData((prev) => ({ ...prev, ...updates }))
          }
        />
      ),
    },
  ];

  const handleUpdateProduct = async () => {
    try {
      if (!productData.categoryId) {
        alert("Selecione uma categoria antes de salvar!");
        return;
      }

      await updateProductMutation.mutateAsync({
        id: productId,
        data: productData,
      });
      clearVariantsDraft(variantsDraftKey);
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-1 flex-col p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Carregando produto...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!productResponse?.success) {
    return (
      <div className="flex min-h-screen flex-1 flex-col p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Produto não encontrado</h1>
            <p className="text-muted-foreground">
              O produto que você está tentando editar não existe.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      {/* HEADER FIXO COM AÇÕES */}
      <div className="bg-background sticky top-0 z-50 border-b">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/products">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Editar Produto</h1>
              <p className="text-muted-foreground">{productData.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateProduct}
              disabled={updateProductMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateProductMutation.isPending
                ? "Atualizando..."
                : "Atualizar Produto"}
            </Button>
          </div>
        </div>
      </div>

      {/* CONTEÚDO COM ABAS VERTICAIS COMPACTAS */}
      <div className="flex-1 p-6">
        <div className="w-full">
          <Tabs defaultValue="basic" className="flex flex-row gap-4">
            <TabsList className="bg-background h-full w-48 flex-col rounded-none border-l p-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary h-10 w-full justify-start rounded-none border-0 border-l-2 border-transparent px-3 text-left text-sm data-[state=active]:shadow-none"
                >
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1">
              {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                  {tab.component}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
