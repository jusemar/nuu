"use client";

import {
  ArrowLeft,
  BadgeDollarSign,
  Boxes,
  Eye,
  FileText,
  PackageCheck,
  PackagePlus,
  Save,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BotaoDuplicarProduto,
  BotaoPublicarProduto,
  SeloSituacaoPublicacao,
} from "@/features/products";
import { AbaVendaCruzada } from "@/features/products/components/admin/venda-cruzada/aba-venda-cruzada";
import { useUpdateProduct } from "@/hooks/admin/mutations/products/useUpdateProduct";
import { useProductId } from "@/hooks/admin/queries/products/use-Product-Id";

import { ShippingTab } from "../../../../../features/admin/products/components/ShippingTab";
// Import das abas
import { BasicTab } from "../../new/components/tabs/BasicTab";
import { EntregaTab } from "../../new/components/tabs/EntregaTab";
import { PricingTab } from "../../new/components/tabs/PricingTab";
import { SeoTab } from "../../new/components/tabs/SeoTab";
import {
  clearVariantsDraft,
  VariantsTab,
} from "../../new/components/tabs/VariantsTab";
import { WarrantyTab } from "../../new/components/tabs/WarrantyTab";
import {
  initialProductData,
  ProductFormData,
} from "../../new/data/product-form-data";

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
      const estoqueProdutoSimples = product.estoqueProdutoSimples;
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
        status: product.status === "published" ? "published" : "draft",
        collection: product.collection || "",
        tags: product.tags || [],
        productKind: product.productKind === "variable" ? "variable" : "simple",

        // Store Product Flags (campo que estava faltando)
        storeProductFlags: product.storeProductFlags || [],

        // Códigos do produto
        productType: product.productType || "",
        productCode: product.productCode || "",
        ncmCode: product.ncmCode || "",
        estoqueProdutoSimples:
          typeof estoqueProdutoSimples === "number" &&
          Number.isSafeInteger(estoqueProdutoSimples) &&
          estoqueProdutoSimples >= 0
            ? estoqueProdutoSimples
            : 0,
        estoqueProdutoSimplesIndisponivel: Boolean(
          product.estoqueProdutoSimplesIndisponivel,
        ),

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
          aceitaPagamentoNaEntrega: product.aceitaPagamentoNaEntrega ?? false,
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
      name: "Básico",
      icon: FileText,
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
      name: "Preços",
      icon: BadgeDollarSign,
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
      name: "Frete",
      icon: Truck,
      value: "shipping",
      component: (
        <ShippingTab
          data={productData}
          onChange={(updates) =>
            setProductData((prev) => ({ ...prev, ...updates }))
          }
        />
      ),
    },
    {
      name: "Entrega",
      icon: PackageCheck,
      value: "entrega",
      component: (
        <EntregaTab
          data={productData.entrega ?? {}}
          productId={productId}
          dimensoesFrete={productData.dimensoesFreteExterno}
          usaLogisticaLaquila={Boolean(
            productResponse?.data?.usaLogisticaLaquila,
          )}
          resultadoTransportadorasLaquila={
            productResponse?.data?.resultadoTransportadorasLaquila ?? null
          }
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
      name: "Garantia",
      icon: ShieldCheck,
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
      name: "Variantes",
      icon: Boxes,
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
      name: "Venda cruzada",
      icon: PackagePlus,
      value: "venda-cruzada",
      component: <AbaVendaCruzada produtoId={productId} />,
    },
    {
      name: "SEO",
      icon: Search,
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
    <div className="flex min-h-screen min-w-0 flex-1 flex-col">
      {/* HEADER FIXO COM AÇÕES */}
      <div className="bg-background sticky top-0 z-30 min-w-0 border-b">
        <div className="flex min-w-0 flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <Button variant="outline" size="icon" className="shrink-0" asChild>
              <Link href="/admin/products">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para produtos</span>
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold sm:text-2xl">
                  Editar Produto
                </h1>
                {/* Mostra a situação real na loja: publicado, rascunho,
                    inativo ou fora do Catálogo. */}
                <SeloSituacaoPublicacao
                  status={productData.status}
                  isActive={productData.isActive}
                  storeProductFlags={productData.storeProductFlags}
                />
              </div>
              <p className="text-muted-foreground line-clamp-2 text-sm sm:text-base">
                {productData.name}
              </p>
            </div>
          </div>

          <div className="-mx-3 flex min-w-0 items-center gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0 sm:pb-0">
            <BotaoDuplicarProduto
              produtoId={productId}
              produtoNome={productData.name}
            />
            <BotaoPublicarProduto
              produtoId={productId}
              publicado={
                productData.isActive && productData.status === "published"
              }
              aoPublicar={() =>
                setProductData((dadosAtuais) => ({
                  ...dadosAtuais,
                  isActive: true,
                  status: "published",
                }))
              }
            />
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleUpdateProduct}
              disabled={updateProductMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateProductMutation.isPending ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </div>
      </div>

      {/* No celular as abas ficam horizontais e deixam o formulário usar toda a tela. */}
      <div className="min-w-0 flex-1 p-0 sm:p-4 lg:p-6">
        <div className="w-full min-w-0">
          <Tabs defaultValue="basic" className="min-w-0 gap-4 lg:flex-row">
            <div className="bg-background overflow-x-auto border-b px-3 py-2 sm:rounded-lg sm:border lg:overflow-visible lg:border-0 lg:p-0">
              <TabsList className="bg-background inline-flex h-auto w-max min-w-max justify-start gap-1 p-0 lg:h-full lg:w-48 lg:min-w-48 lg:flex-col lg:justify-start lg:rounded-none lg:border-l">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="bg-background data-[state=active]:border-primary h-10 shrink-0 justify-start gap-2 border-0 border-b-2 border-transparent px-3 text-sm data-[state=active]:shadow-none lg:w-full lg:rounded-none lg:border-b-0 lg:border-l-2"
                  >
                    <tab.icon className="size-4" aria-hidden="true" />
                    {tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="w-full min-w-0 flex-1 px-[1px] pb-6 sm:px-0">
              {tabs.map((tab) => (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className="mt-0 w-full min-w-0"
                >
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
