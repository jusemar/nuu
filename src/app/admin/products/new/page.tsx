"use client";

import {
  ArrowLeft,
  BadgeDollarSign,
  Boxes,
  Eye,
  FileText,
  PackageCheck,
  Save,
  Search,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateProduct } from "@/hooks/admin/mutations/products/useCreateProduct";

import { ShippingTab } from "../../../../features/admin/products/components/ShippingTab";
// Import das abas
import { BasicTab } from "./components/tabs/BasicTab";
import { EntregaTab } from "./components/tabs/EntregaTab";
import { PricingTab } from "./components/tabs/PricingTab";
import { SellerTab } from "./components/tabs/SellerTab";
import { SeoTab } from "./components/tabs/SeoTab";
import { clearVariantsDraft, VariantsTab } from "./components/tabs/VariantsTab";
import { WarrantyTab } from "./components/tabs/WarrantyTab";
import { initialProductData, ProductFormData } from "./data/product-form-data";

export default function NewProductPage() {
  const variantsDraftKey = "novo-produto";
  const createProductMutation = useCreateProduct({
    onSuccess: () => {
      clearVariantsDraft(variantsDraftKey);
      // RESETA O FORMULÁRIO APÓS SUCESSO
      setProductData(initialProductData);
    },
  });

  const [productData, setProductData] = useState<ProductFormData>({
    ...initialProductData,
    entrega: {
      permiteRetirada: false,
      modeloRetiradaId: null,
      prazoCustom: "",
      permiteEntregaPropria: false,
      precosEntregaPropria: [],
      classificacoesLogisticasIds: [],
    },
  });

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
      name: "Vendedor",
      icon: Store,
      value: "seller",
      component: (
        <SellerTab
          data={productData}
          onChange={(updates: Partial<ProductFormData>) =>
            setProductData((prev) => ({ ...prev, ...updates }))
          }
        />
      ),
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

  const handlePublishProduct = async () => {
    try {
      console.log("Dados sendo enviados:", productData);
      if (!productData.categoryId) {
        alert("Selecione uma categoria antes de salvar!");
        return;
      }

      await createProductMutation.mutateAsync(productData);
    } catch (error) {
      console.error("Erro ao publicar produto:", error);
    }
  };

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
              <h1 className="text-xl font-bold sm:text-2xl">Novo Produto</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Cadastre um novo produto no catálogo
              </p>
            </div>
          </div>

          <div className="-mx-3 flex min-w-0 items-center gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0 sm:pb-0">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Salvar Rascunho</span>
            </Button>
            <Button
              className="shrink-0"
              size="sm"
              onClick={handlePublishProduct}
              disabled={createProductMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {createProductMutation.isPending ? "Publicando..." : "Publicar"}
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
