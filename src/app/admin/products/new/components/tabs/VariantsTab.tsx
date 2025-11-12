// src/app/admin/products/new/components/tabs/VariantsTab.tsx
"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Trash2, 
  Copy, 
  Palette, 
  Ruler, 
  Package, 
  Image as ImageIcon,
  Layers,
  Eye,
  EyeOff
} from "lucide-react"

interface VariantAttribute {
  id: string
  name: string
  values: string[]
}

interface Variant {
  id: string
  sku: string
  price: string
  comparePrice: string
  cost: string
  stock: number
  weight: string
  attributes: { [key: string]: string }
  image: string
  isActive: boolean
}

export function VariantsTab() {
  const [attributes, setAttributes] = useState<VariantAttribute[]>([
    { id: '1', name: 'Cor', values: ['Preto', 'Branco', 'Azul'] },
    { id: '2', name: 'Tamanho', values: ['P', 'M', 'G', 'GG'] }
  ])

  const [variants, setVariants] = useState<Variant[]>([
    {
      id: '1',
      sku: 'TSHIRT-BLACK-P',
      price: '49.90',
      comparePrice: '59.90',
      cost: '25.00',
      stock: 50,
      weight: '0.2',
      attributes: { 'Cor': 'Preto', 'Tamanho': 'P' },
      image: '',
      isActive: true
    },
    {
      id: '2',
      sku: 'TSHIRT-BLACK-M',
      price: '49.90',
      comparePrice: '59.90',
      cost: '25.00',
      stock: 30,
      weight: '0.2',
      attributes: { 'Cor': 'Preto', 'Tamanho': 'M' },
      image: '',
      isActive: true
    }
  ])

  const [newAttribute, setNewAttribute] = useState({ name: '', value: '' })

  const addAttribute = () => {
    if (newAttribute.name && newAttribute.value) {
      const existingAttr = attributes.find(attr => 
        attr.name.toLowerCase() === newAttribute.name.toLowerCase()
      )

      if (existingAttr) {
        // Adiciona valor ao atributo existente
        setAttributes(attrs =>
          attrs.map(attr =>
            attr.id === existingAttr.id
              ? { ...attr, values: [...attr.values, newAttribute.value] }
              : attr
          )
        )
      } else {
        // Cria novo atributo
        setAttributes(attrs => [
          ...attrs,
          {
            id: Date.now().toString(),
            name: newAttribute.name,
            values: [newAttribute.value]
          }
        ])
      }
      setNewAttribute({ name: '', value: '' })
    }
  }

  const removeAttribute = (attributeId: string, valueIndex: number) => {
    setAttributes(attrs =>
      attrs.map(attr =>
        attr.id === attributeId
          ? {
              ...attr,
              values: attr.values.filter((_, index) => index !== valueIndex)
            }
          : attr
      ).filter(attr => attr.values.length > 0)
    )
  }

  const generateVariants = () => {
    // Simulação de geração de variantes baseada nos atributos
    const generatedVariants: Variant[] = []
    
    // Lógica para combinar atributos e gerar variantes
    if (attributes.length > 0) {
      const sampleVariant: Variant = {
        id: Date.now().toString(),
        sku: `SKU-${Date.now()}`,
        price: '0.00',
        comparePrice: '0.00',
        cost: '0.00',
        stock: 0,
        weight: '0.0',
        attributes: {},
        image: '',
        isActive: true
      }
      generatedVariants.push(sampleVariant)
    }

    setVariants(prev => [...prev, ...generatedVariants])
  }

  const updateVariant = (variantId: string, field: string, value: any) => {
    setVariants(prev =>
      prev.map(variant =>
        variant.id === variantId ? { ...variant, [field]: value } : variant
      )
    )
  }

  const duplicateVariant = (variantId: string) => {
    const variant = variants.find(v => v.id === variantId)
    if (variant) {
      const newVariant = {
        ...variant,
        id: Date.now().toString(),
        sku: `${variant.sku}-COPY`
      }
      setVariants(prev => [...prev, newVariant])
    }
  }

  const deleteVariant = (variantId: string) => {
    setVariants(prev => prev.filter(v => v.id !== variantId))
  }

  const toggleVariantActive = (variantId: string) => {
    setVariants(prev =>
      prev.map(variant =>
        variant.id === variantId 
          ? { ...variant, isActive: !variant.isActive }
          : variant
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* ATRIBUTOS DAS VARIANTES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Atributos das Variantes
          </CardTitle>
          <CardDescription>
            Defina cores, tamanhos, materiais e outros atributos que criam variantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ADICIONAR NOVO ATRIBUTO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="attr-name" className="text-sm font-medium">
                Nome do Atributo
              </Label>
              <Input
                id="attr-name"
                placeholder="Ex: Cor, Tamanho, Material"
                value={newAttribute.name}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label htmlFor="attr-value" className="text-sm font-medium">
                Valor
              </Label>
              <Input
                id="attr-value"
                placeholder="Ex: Preto, P, Algodão"
                value={newAttribute.value}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && addAttribute()}
                className="mt-1 h-9"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addAttribute} className="h-9" disabled={!newAttribute.name || !newAttribute.value}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* LISTA DE ATRIBUTOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {attributes.map((attribute) => (
              <div key={attribute.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 capitalize">{attribute.name}</h3>
                  <Badge variant="secondary">{attribute.values.length} valores</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attribute.values.map((value, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      {value}
                      <button
                        onClick={() => removeAttribute(attribute.id, index)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* BOTÃO GERAR VARIANTES */}
          <div className="flex justify-center">
            <Button onClick={generateVariants} disabled={attributes.length === 0}>
              <Layers className="w-4 h-4 mr-2" />
              Gerar Variantes Automaticamente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LISTA DE VARIANTES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Variantes do Produto
          </CardTitle>
          <CardDescription>
            Gerencie preços, estoque e informações específicas de cada variante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Visualização em Lista</TabsTrigger>
              <TabsTrigger value="grid">Visualização em Grade</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4 mt-4">
              {variants.map((variant) => (
                <div key={variant.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Thumbnail da Imagem */}
                      <div className="w-16 h-16 bg-gray-100 border rounded-lg flex items-center justify-center">
                        {variant.image ? (
                          <img src={variant.image} alt="" className="w-full h-full object-cover rounded" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {/* Informações da Variante */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{variant.sku}</h3>
                          <div className="flex gap-1">
                            {Object.entries(variant.attributes).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                          {!variant.isActive && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Oculto
                            </Badge>
                          )}
                        </div>

                        {/* Campos Editáveis */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500">Preço</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                              <Input
                                value={variant.price}
                                onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                                className="pl-8 h-8 text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Preço Compare</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                              <Input
                                value={variant.comparePrice}
                                onChange={(e) => updateVariant(variant.id, 'comparePrice', e.target.value)}
                                className="pl-8 h-8 text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Estoque</Label>
                            <Input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => updateVariant(variant.id, 'stock', parseInt(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Peso (kg)</Label>
                            <Input
                              value={variant.weight}
                              onChange={(e) => updateVariant(variant.id, 'weight', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVariantActive(variant.id)}
                      >
                        {variant.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateVariant(variant.id)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteVariant(variant.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="grid" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {variants.map((variant) => (
                  <div key={variant.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {value}
                          </Badge>
                        ))}
                      </div>
                      <Switch
                        checked={variant.isActive}
                        onCheckedChange={() => toggleVariantActive(variant.id)}
                        size="sm"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-500">SKU</Label>
                        <Input value={variant.sku} className="h-8 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-gray-500">Preço</Label>
                          <Input value={variant.price} className="h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Estoque</Label>
                          <Input value={variant.stock} className="h-8 text-sm" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-4">
                      <Button variant="outline" size="sm" onClick={() => duplicateVariant(variant.id)}>
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteVariant(variant.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {variants.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma variante criada</h3>
              <p className="text-gray-500 mb-4">
                Adicione atributos acima e gere variantes automaticamente
              </p>
              <Button onClick={generateVariants}>
                <Layers className="w-4 h-4 mr-2" />
                Gerar Primeiras Variantes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}