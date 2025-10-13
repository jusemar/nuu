// src/components/admin/category-form.tsx
"use client"

import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useCategoryForm } from "@/hooks/forms/use-category-form"

export function CategoryForm() {
  const { 
    formData, 
    setFormData, 
    isLoading, 
    handleSubmit,
    generateSlug 
  } = useCategoryForm()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Categoria</h1>
          <p className="text-muted-foreground">
            Adicione uma nova categoria ao seu catálogo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal - Informações básicas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Informações principais da categoria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Categoria *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Eletrônicos, Roupas, etc."
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                      if (!formData.slug) {
                        generateSlug(e.target.value)
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="ex: eletronicos"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    URL amigável para a categoria. Será usado na navegação.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva esta categoria..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Categoria ativa</Label>
                </div>
              </CardContent>
            </Card>

            {/* Card SEO */}
            <Card>
              <CardHeader>
                <CardTitle>Otimização para SEO</CardTitle>
                <CardDescription>
                  Configure as meta tags para melhorar a visibilidade nos mecanismos de busca
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Título</Label>
                  <Input
                    id="metaTitle"
                    placeholder="Título para SEO (máx. 60 caracteres)"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                    maxLength={60}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Descrição</Label>
                  <Textarea
                    id="metaDescription"
                    placeholder="Descrição para SEO (máx. 160 caracteres)"
                    rows={3}
                    value={formData.metaDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                    maxLength={160}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna lateral - Ações */}
          <div className="space-y-6">
            {/* Card Status */}
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="status">Status</Label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    formData.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                <div className="pt-4 space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="sm"
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Salvando..." : "Salvar Categoria"}
                  </Button>
                  
                  <Button variant="outline" className="w-full" size="sm" type="button">
                    Salvar e Adicionar Outra
                  </Button>
                  
                  <Button variant="outline" className="w-full" size="sm" asChild>
                    <Link href="/admin/categories">
                      Cancelar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card Informações Adicionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Preencha todas as informações necessárias para criar uma nova categoria em seu catálogo.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}