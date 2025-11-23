"use client"

import Link from "next/link"
import { ArrowLeft, Save, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUpdateProduct } from '@/hooks/admin/mutations/products/useUpdateProduct'
import { useProductId } from '@/hooks/admin/queries/products/use-Product-Id'
import { useState, useEffect } from "react"
import { ProductFormData, initialProductData } from '../../new/data/product-form-data'
import { useParams } from "next/navigation"

// Import das abas
import { BasicTab } from '../../new/components/tabs/BasicTab'
import { PricingTab } from '../../new/components/tabs/PricingTab'
import { ShippingTab } from '../../new/components/tabs/ShippingTab'
import { WarrantyTab } from '../../new/components/tabs/WarrantyTab'
import { VariantsTab } from '../../new/components/tabs/VariantsTab'
import { SellerTab } from '../../new/components/tabs/SellerTab'
import { SeoTab } from '../../new/components/tabs/SeoTab'

export default function EditProductPage() {
  const params = useParams()
  const productId = params.id as string
  
  const { data: productResponse, isLoading } = useProductId(productId)
  const updateProductMutation = useUpdateProduct()
  
  const [productData, setProductData] = useState<ProductFormData>(initialProductData)

  useEffect(() => {
  if (productResponse?.success && productResponse.data) {
    setProductData({
      name: productResponse.data.name,
      slug: productResponse.data.slug,
      description: productResponse.data.description,
      cardShortText: productResponse.data.cardShortText || '',
      categoryId: productResponse.data.categoryId,
      brand: productResponse.data.brand || '',
      sku: productResponse.data.sku,
      isActive: productResponse.data.isActive ?? true,
      collection: productResponse.data.collection || '',
      tags: productResponse.data.tags || [],
      productType: productResponse.data.productType || '',
      productCode: productResponse.data.productCode || '',
      ncmCode: productResponse.data.ncmCode || '',
      metaTitle: productResponse.data.metaTitle || '',
      metaDescription: productResponse.data.metaDescription || '',
      canonicalUrl: productResponse.data.canonicalUrl || '',
      images: [] // ajuste conforme suas imagens
    })
  }
}, [productResponse])


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
      name: '🛡️ Garantia',
      value: 'warranty',
      component: <WarrantyTab 
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

  const handleUpdateProduct = async () => {    
    try {
      if (!productData.categoryId) {
        alert('Selecione uma categoria antes de salvar!')
        return
      }
      
      await updateProductMutation.mutateAsync({
        id: productId,
        data: productData
      })
      
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col min-h-screen p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Carregando produto...</h1>
          </div>
        </div>
      </div>
    )
  }

  if (!productResponse?.success) {
    return (
      <div className="flex flex-1 flex-col min-h-screen p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Produto não encontrado</h1>
            <p className="text-muted-foreground">O produto que você está tentando editar não existe.</p>
          </div>
        </div>
      </div>
    )
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
              <h1 className="text-2xl font-bold">Editar Produto</h1>
              <p className="text-muted-foreground">{productData.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              size="sm" 
              onClick={handleUpdateProduct}
              disabled={updateProductMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProductMutation.isPending ? "Atualizando..." : "Atualizar Produto"}
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