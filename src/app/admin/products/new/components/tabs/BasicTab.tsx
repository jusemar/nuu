// src/app/admin/products/new/components/tabs/BasicTab.tsx
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X, RefreshCw, Plus } from "lucide-react"
import { useCategories } from '@/hooks/admin/queries/use-categories'
import { useSlugGenerator } from '@/hooks/forms/useSlugGenerator'
import { useSkuGenerator } from '@/hooks/forms/useSkuGenerator'
import { ProductImageGallery, UploadedImage } from "../image-upload/ProductImageGallery"

interface BasicTabProps {
  data: {
    name: string
    slug: string
    description: string
    categoryId: string
    brand: string
    sku: string
    isActive: boolean
    collection: string
    tags: string[]
    productType: string
    productCode: string
    ncmCode: string
    images: UploadedImage[]
  }
  onChange: (updates: any) => void
}

export function BasicTab({ data, onChange }: BasicTabProps) {
  const { data: categories, isLoading } = useCategories()
  const { generateSlug } = useSlugGenerator()
  const { generateSku } = useSkuGenerator()
  const [tagInput, setTagInput] = useState('')

  // Geração automática do SKU
  useEffect(() => {
    if (data.categoryId && data.brand && !data.sku) {
      const newSku = generateSku({
        categoryId: data.categoryId,
        categoryName: categories?.find(cat => cat.id === data.categoryId)?.name,
        brand: data.brand
      })
      onChange({ sku: newSku })
    }
  }, [data.categoryId, data.brand, data.sku, categories, generateSku, onChange])

  const addTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    e.preventDefault()
    if (tagInput.trim() && !data.tags.includes(tagInput.trim())) {
      onChange({ tags: [...data.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange({ tags: data.tags.filter(tag => tag !== tagToRemove) })
  }

  const handleImagesChange = (images: UploadedImage[]) => {
    onChange({ images })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* CARD INFORMAÇÕES PRINCIPAIS */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
              <CardDescription>Dados essenciais para identificação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input 
                    id="name" 
                    placeholder="Smartphone Galaxy Pro" 
                    value={data.name}
                    onChange={(e) => {
                      const name = e.target.value
                      onChange({ 
                        name: name,
                        slug: generateSlug(name)
                      })
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input 
                    id="slug" 
                    placeholder="smartphone-pro" 
                    value={data.slug}
                    onChange={(e) => onChange({ slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <RichTextEditor
                  value={data.description}
                  onChange={(value) => onChange({ description: value })}
                  placeholder="Descreva as características principais do produto..."
                />
              </div>
            </CardContent>
          </Card>

          {/* GALERIA DE IMAGENS */}
         <ProductImageGallery         
            onImagesChange={handleImagesChange}
            maxFiles={10}
          />

          {/* CARD CÓDIGOS ESPECÍFICOS */}      
            <Card>
              <CardHeader>
                <CardTitle>Debug - Estado das Imagens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <button 
                    type="button"
                    onClick={() => {
                      // Adiciona uma imagem de teste ao productData
                      const testImage: UploadedImage = {
                        id: 'test-' + Date.now(),
                        url: 'https://via.placeholder.com/300',
                        preview: 'https://via.placeholder.com/300',
                        isPrimary: data.images.length === 0, 
                        altText: 'Imagem de teste'                        
                      }
                      onChange({ images: [...data.images, testImage] })
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Adicionar Imagem de Teste ao Estado
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      // Limpa todas as imagens
                      onChange({ images: [] })
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded ml-2"
                  >
                    Limpar Imagens
                  </button>
                  
                  <div className="mt-2 text-sm">
                    <div>Total de imagens no estado: {data.images.length}</div>
                    {data.images.map(img => (
                      <div key={img.id} className="text-xs text-gray-600">
                        - {img.url} {img.isPrimary ? '(PRINCIPAL)' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>


        </div>

        {/* COLUNA LATERAL */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="archived" className="text-sm font-medium">Arquivado</Label>
                  <p className="text-xs text-gray-500">Produto removido do catálogo</p>
                </div>
                <Switch 
                  id="archived"
                  checked={!data.isActive}
                  onCheckedChange={(checked) => onChange({ isActive: !checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <div className="flex gap-2">
                  <Input 
                    id="sku" 
                    value={data.sku}
                    onChange={(e) => onChange({ sku: e.target.value })}
                    className="flex-1 text-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const newSku = generateSku({
                        categoryId: data.categoryId,
                        categoryName: categories?.find(cat => cat.id === data.categoryId)?.name,
                        brand: data.brand
                      })
                      onChange({ sku: newSku })
                    }}
                    className="px-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    title="Gerar novo SKU"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={data.categoryId} 
                  onValueChange={(value) => onChange({ categoryId: value })}
                  required
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione a categoria"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input 
                  id="brand" 
                  placeholder="Samsung, Nike, Apple..." 
                  value={data.brand}
                  onChange={(e) => onChange({ brand: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection">Coleção</Label>
                <Input 
                  id="collection" 
                  placeholder="Verão 2024, Black Friday..." 
                  value={data.collection}
                  onChange={(e) => onChange({ collection: e.target.value })}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Digite uma tag" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag(e)}
                    className="flex-1 text-sm"
                  />
                  <button 
                    type="button"
                    onClick={addTag}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    title="Adicionar tag"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border min-h-[60px]">
                    {data.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 py-1 text-xs">
                        {tag}
                        <button 
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}