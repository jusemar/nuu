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
// IMPORT DO NOVO COMPONENTE
import { ProductImageGallery, UploadedImage } from "../image-upload/ProductImageGallery"
import { useCategories } from '@/hooks/admin/queries/use-categories'

export function BasicTab() {
  const { data: categories, isLoading } = useCategories()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    brand: '',
    sku: '',
    isActive: true,
    collection: '',
    tags: [] as string[],
    productType: '',
    productCode: '',
    ncmCode: '',
    images: [] as UploadedImage[] // ✅ NOVO CAMPO PARA IMAGENS
  })

  const [tagInput, setTagInput] = useState('')

  // Geração automática do SKU
  const generateSku = () => {
    const categoryCode = formData.categoryId?.slice(0, 3).toUpperCase() || 'GEN'
    const brandCode = formData.brand?.slice(0, 4).toUpperCase() || 'PROD'
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${categoryCode}-${brandCode}-${randomNum}`
  }

  useEffect(() => {
    if (formData.categoryId && formData.brand && !formData.sku) {
      setFormData(prev => ({ ...prev, sku: generateSku() }))
    }
  }, [formData.categoryId, formData.brand, formData.sku])

  const addTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    e.preventDefault()
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  // ✅ FUNÇÃO PARA LIDAR COM MUDANÇAS NAS IMAGENS
  const handleImagesChange = (images: UploadedImage[]) => {
    setFormData(prev => ({ ...prev, images }))
  }

  return (
    <div className="space-y-6">
      {/* LAYOUT PRINCIPAL COM COLUNAS DESIGUAIS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUNA PRINCIPAL (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          {/* CARD INFORMAÇÕES PRINCIPAIS */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
              <CardDescription>Dados essenciais para identificação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Linha Única: Nome e Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input 
                    id="name" 
                    placeholder="Smartphone Galaxy Pro" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input 
                    id="slug" 
                    placeholder="smartphone-pro" 
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  placeholder="Descreva as características principais do produto..."
                />
              </div>
            </CardContent>
          </Card>

          {/* ✅ CARD GALERIA DE IMAGENS - AGORA FUNCIONAL! */}
          <ProductImageGallery 
            onImagesChange={handleImagesChange}
            maxFiles={10}
          />

          {/* CARD CÓDIGOS ESPECÍFICOS */}
          <Card>
            <CardHeader>
              <CardTitle>Códigos de Identificação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tipo de Identificação e Código na mesma linha */}
                <div className="space-y-2 md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm">Tipo</Label>
                      <Select 
                        value={formData.productType} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, productType: value }))}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="isbn">ISBN</SelectItem>
                          <SelectItem value="upc">UPC</SelectItem>
                          <SelectItem value="ean">EAN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label className="text-sm">Código</Label>
                      <Input 
                        placeholder="Código correspondente" 
                        value={formData.productCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, productCode: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                {/* NCM */}
                <div className="space-y-2">
                  <Label className="text-sm">Código NCM</Label>
                  <Input 
                    placeholder="8517.12.00" 
                    value={formData.ncmCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, ncmCode: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA LATERAL (1/3) */}
        <div className="space-y-6">
          {/* CARD ORGANIZAÇÃO */}
          <Card>
            <CardHeader>
              <CardTitle>Organização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Arquivo */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="archived" className="text-sm font-medium">Arquivado</Label>
                  <p className="text-xs text-gray-500">Produto removido do catálogo</p>
                </div>
                <Switch 
                  id="archived"
                  checked={!formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !checked }))}
                />
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <div className="flex gap-2">
                  <Input 
                    id="sku" 
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    className="flex-1 text-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, sku: generateSku() }))}
                    className="px-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    title="Gerar novo SKU"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
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

              {/* Marca */}
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input 
                  id="brand" 
                  placeholder="Samsung, Nike, Apple..." 
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="text-sm"
                />
              </div>

              {/* Collection */}
              <div className="space-y-2">
                <Label htmlFor="collection">Coleção</Label>
                <Input 
                  id="collection" 
                  placeholder="Verão 2024, Black Friday..." 
                  value={formData.collection}
                  onChange={(e) => setFormData(prev => ({ ...prev, collection: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* CARD TAGS */}
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
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border min-h-[60px]">
                    {formData.tags.map(tag => (
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