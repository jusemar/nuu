"use client"

import Link from "next/link"
import { ArrowLeft, Save, Eye, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

const tabs = [
  {
    name: '📝 Básico',
    value: 'basic',
    content: (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Principais</CardTitle>
            <CardDescription>Dados essenciais do produto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto *</Label>
                <Input id="name" placeholder="Ex: Smartphone Galaxy Pro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" placeholder="Ex: smartphone-galaxy-pro" />
              </div>
            </div>
            
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <RichTextEditor
                  value=""
                  onChange={(value) => console.log('Descrição:', value)}
                  placeholder="Descreva o produto detalhadamente..."
                />
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Eletrônicos</SelectItem>
                    <SelectItem value="clothing">Roupas</SelectItem>
                    <SelectItem value="home">Casa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" placeholder="Ex: Samsung, Nike, etc." />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagens do Produto</CardTitle>
            <CardDescription>Adicione imagens de alta qualidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Arraste imagens ou clique para fazer upload</p>
              <p className="text-sm text-gray-500 mb-4">PNG, JPG até 10MB</p>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Imagens
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  },
  {
    name: '💰 Financeiro',
    value: 'financial',
    content: (
      <Card>
        <CardHeader>
          <CardTitle>Preços e Custos</CardTitle>
          <CardDescription>Configure a parte financeira do produto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Preço de Custo *</Label>
              <Input id="costPrice" type="number" placeholder="0.00" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Preço de Venda *</Label>
              <Input id="salePrice" type="number" placeholder="0.00" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profitMargin">Margem de Lucro</Label>
              <Input id="profitMargin" placeholder="0%" disabled />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Promoções</h4>
              <div className="space-y-2">
                <Label htmlFor="promoPrice">Preço Promocional</Label>
                <Input id="promoPrice" type="number" placeholder="0.00" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flashSale">Oferta Relâmpago</Label>
                <div className="flex gap-2">
                  <Input id="flashSale" type="number" placeholder="Preço" step="0.01" />
                  <Input type="datetime-local" placeholder="Data fim" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Impostos</h4>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Taxa de Imposto (%)</Label>
                <Input id="taxRate" type="number" placeholder="0" step="0.1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
  {
    name: '🚚 Frete',
    value: 'shipping',
    content: (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Frete</CardTitle>
          <CardDescription>Defina regras de envio e transporte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg) *</Label>
              <Input id="weight" type="number" placeholder="0.00" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">Comprimento (cm)</Label>
              <Input id="length" type="number" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Largura (cm)</Label>
              <Input id="width" type="number" placeholder="0" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Regras de Frete</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="freeShipping" />
                <Label htmlFor="freeShipping">Frete Grátis</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="localPickup" />
                <Label htmlFor="localPickup">Retirada Local</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
  {
    name: '🛡️ Garantia',
    value: 'warranty',
    content: (
      <Card>
        <CardHeader>
          <CardTitle>Informações de Garantia</CardTitle>
          <CardDescription>Configure a política de garantia do produto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="warrantyPeriod">Período de Garantia</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                  <SelectItem value="730">2 anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warrantyProvider">Provedor da Garantia</Label>
              <Input id="warrantyProvider" placeholder="Ex: Fabricante, Loja, etc." />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="warrantyTerms">Termos da Garantia</Label>
            <div className="border rounded-lg min-h-[150px] p-4 bg-muted/20">
              <div className="text-muted-foreground text-sm">
                Descreva os termos e condições da garantia...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
  {
    name: '🎨 Variantes',
    value: 'variants',
    content: (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Variantes</CardTitle>
          <CardDescription>Crie variações de cor, tamanho, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-600 mb-2">Sistema de variantes será implementado aqui</p>
            <p className="text-sm text-gray-500">Cores, tamanhos, materiais e preços específicos</p>
          </div>
        </CardContent>
      </Card>
    )
  },
  {
    name: '👥 Vendedor',
    value: 'seller',
    content: (
      <Card>
        <CardHeader>
          <CardTitle>Informações do Vendedor</CardTitle>
          <CardDescription>Dados do fornecedor ou vendedor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sellerCode">Código do Vendedor</Label>
              <Input id="sellerCode" placeholder="Código único do fornecedor" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internalCode">Código Interno</Label>
              <Input id="internalCode" placeholder="Seu código interno" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sellerInfo">Informações do Fornecedor</Label>
            <Input id="sellerInfo" placeholder="Nome do fornecedor ou vendedor" />
          </div>
        </CardContent>
      </Card>
    )
  },
  {
    name: '🔍 SEO',
    value: 'seo',
    content: (
      <Card>
        <CardHeader>
          <CardTitle>Otimização para SEO</CardTitle>
          <CardDescription>Melhore a visibilidade nos mecanismos de busca</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Título</Label>
            <Input id="metaTitle" placeholder="Título para SEO (até 60 caracteres)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Descrição</Label>
            <Input id="metaDescription" placeholder="Descrição para SEO (até 160 caracteres)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="canonicalUrl">URL Canônica</Label>
            <Input id="canonicalUrl" placeholder="https://exemplo.com/produto" />
          </div>
        </CardContent>
      </Card>
    )
  }
]

export default function NewProductPage() {
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
            <Button size="sm">
              <Save className="w-4 h-4 mr-2" />
              Publicar Produto
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
                  {tab.content}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}