// src/features/admin/categories/form/CategoryForm/BasicInfoCard.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Link as LinkIcon } from "lucide-react"

interface BasicInfoCardProps {
  data: {
    name: string
    slug: string
    description: string
    isActive: boolean
  }
  onDataChange: (data: Partial<BasicInfoCardProps['data']>) => void
  onSlugChange?: (slug: string) => void
}

export function BasicInfoCard({ 
  data, 
  onDataChange,
  onSlugChange 
}: BasicInfoCardProps) {
  
  return (
    <div className="space-y-6">
      {/* Card Informações Básicas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-medium">Nome da Categoria *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => onDataChange({ name: e.target.value })}
              placeholder="Ex: Eletrônicos, Colchões, Automotivo..."
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="font-medium">Slug (URL)</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  id="slug"
                  value={data.slug}
                  onChange={(e) => {
                    const value = e.target.value
                    onDataChange({ slug: value })
                    onSlugChange?.(value)
                  }}
                  placeholder="eletronicos, colchoes, automotivo"
                />
              </div>
              <LinkIcon className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500">
              Preview: <span className="font-mono">/categorias/{data.slug || 'nome'}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => onDataChange({ description: e.target.value })}
              placeholder="Descreva esta categoria para os clientes..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem da Categoria</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium">Clique para upload</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG até 2MB</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="isActive" className="font-medium">Status</Label>
            <Switch
              id="isActive"
              checked={data.isActive}
              onCheckedChange={(checked) => onDataChange({ isActive: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Card SEO */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">SEO & Meta Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="metaTitle">Meta Título</Label>
              <span className="text-xs text-gray-500">{data.metaTitle?.length || 0}/60</span>
            </div>
            <Input
              id="metaTitle"
              value={data.metaTitle || ""}
              onChange={(e) => onDataChange({ metaTitle: e.target.value })}
              placeholder="Ex: Compre Eletrônicos de Qualidade"
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="metaDescription">Meta Descrição</Label>
              <span className="text-xs text-gray-500">{data.metaDescription?.length || 0}/160</span>
            </div>
            <Textarea
              id="metaDescription"
              value={data.metaDescription || ""}
              onChange={(e) => onDataChange({ metaDescription: e.target.value })}
              placeholder="Encontre os melhores produtos eletrônicos..."
              rows={3}
              maxLength={160}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}