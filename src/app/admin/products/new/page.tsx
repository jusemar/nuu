"use client"

import Link from "next/link"
import { ArrowLeft, Save, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCreateProduct } from '@/hooks/admin/mutations/products/useCreateProduct'
import { useState } from "react"
import { ProductFormData, initialProductData } from './data/product-form-data'

// Import das abas
import { BasicTab } from './components/tabs/BasicTab'
import { PricingTab } from './components/tabs/PricingTab'
import { ShippingTab } from '../../../../features/admin/products/components/ShippingTab'
import { EntregaTab } from './components/tabs/EntregaTab'
import { WarrantyTab } from './components/tabs/WarrantyTab'
import { VariantsTab } from './components/tabs/VariantsTab'
import { SellerTab } from './components/tabs/SellerTab'
import { SeoTab } from './components/tabs/SeoTab'

export default function NewProductPage() {
  const createProductMutation = useCreateProduct({
    onSuccess: () => {
      // RESETA O FORMULÁRIO APÓS SUCESSO
      setProductData(initialProductData)
    }
  })
  
  const [productData, setProductData] = useState<ProductFormData>(initialProductData)

  const tabs = [
  {
    name: '📝 Básico',
    value: 'basic',
    component: <BasicTab 
      data={productData} 
      onChange={(updates: Partial<ProductFormData>) => setProductData(prev => ({...prev, ...updates}))} 
    />
  },
  {
    name: '💲 Preços',
    value: 'pricing', 
    component: <PricingTab 
      data={productData}
      onChange={(updates: Partial<ProductFormData>) => setProductData(prev => ({...prev, ...updates}))}
    />
  },
{
    name: '🚚 Frete',
    value: 'shipping', 
    component: <ShippingTab 
      data={productData.shipping ?? {}}
      onChange={(updates: Partial<{ [key: string]: any }>) => setProductData(prev => ({...prev, shipping: updates}))}
    />
  },
  {
    name: '📦 Entrega',
    value: 'entrega',
    component: <EntregaTab 
      data={productData.entrega ?? {}}
      onChange={(updates: Partial<{ permiteRetirada?: boolean; modeloRetiradaId?: string | null; prazoCustom?: string; }>) => setProductData(prev => ({...prev, entrega: updates}))}
    />
  },
   {
    name: '🛡️ Garantia',
    value: 'warranty',
    component: <WarrantyTab 
      data={productData}
      onChange={(updates: Partial<ProductFormData>) => setProductData(prev => ({...prev, ...updates}))}
    />
  },
  {
    name: '🎨 Variantes',
    value: 'variants',
    component: <VariantsTab />
  },
 {
    name: '👥 Vendedor',
    value: 'seller',
    component: <SellerTab 
      data={productData}
      onChange={(updates: Partial<ProductFormData>) => setProductData(prev => ({...prev, ...updates}))}
    />
  },
  {
    name: '🔍 SEO',
    value: 'seo',
    component: <SeoTab 
      data={productData}
      onChange={(updates: Partial<ProductFormData>) => setProductData(prev => ({...prev, ...updates}))}
    />
  }
]

  const handlePublishProduct = async () => {    
    try {

         console.log('Dados sendo enviados:', productData)
      if (!productData.categoryId) {
        alert('Selecione uma categoria antes de salvar!')
        return
      }
      
      await createProductMutation.mutateAsync(productData)
      
    } catch (error) {
      console.error('Erro ao publicar produto:', error)
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-screen">
      {/* HEADER FIXO COM AÇÕES */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/products">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Novo Produto</h1>
              <p className="text-muted-foreground">Cadastre um novo produto no catálogo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button 
              size="sm" 
              onClick={handlePublishProduct}
              disabled={createProductMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {createProductMutation.isPending ? "Publicando..." : "Publicar Produto"}
            </Button>
          </div>
        </div>
      </div>

      {/* CONTEÚDO COM ABAS VERTICAIS COMPACTAS */}
      <div className="flex-1 p-6">
        <div className="w-full">
          <Tabs defaultValue="basic" className="flex flex-row gap-4">
            <TabsList className="bg-background h-full flex-col rounded-none border-l p-0 w-48">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary h-10 w-full justify-start rounded-none border-0 border-l-2 border-transparent data-[state=active]:shadow-none px-3 text-left text-sm"
                >
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1">
              {tabs.map(tab => (
                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                  {tab.component}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}