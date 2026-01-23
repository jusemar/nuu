"use client"

import { Calendar, Eye, BarChart, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SubcategoryItem } from "./SubcategoriesCard"

interface SidebarCardsProps {
  categoryData: {
    isActive: boolean
    name: string
    orderIndex: number
  }
  setCategoryData: React.Dispatch<React.SetStateAction<{
    name: string
    slug: string
    description: string
    isActive: boolean
    metaTitle: string
    metaDescription: string
    orderIndex: number
  }>>
  subcategories: SubcategoryItem[]
  totalSubcategories: number
  maxLevel: number
}

export function SidebarCards({
  categoryData,
  setCategoryData,
  subcategories,
  totalSubcategories,
  maxLevel
}: SidebarCardsProps) {
  return (
    <div className="space-y-6">
      {/* Card Publicação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Publicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge variant={categoryData.isActive ? "default" : "secondary"}>
                {categoryData.isActive ? "Publicado" : "Rascunho"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Visibilidade</span>
              <span className="text-sm font-medium">Pública</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Criado em</span>
              <span className="text-sm font-medium">Hoje</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Button className="w-full">
              Publicar Agora
            </Button>
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Agendar
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-gray-600">
              Salvar como rascunho
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card Estrutura da Hierarquia */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Estrutura da Hierarquia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="font-mono text-sm bg-gray-50 p-3 rounded border">
              {categoryData.name || "Categoria"}<br/>
              {subcategories.filter(s => s.level === 1).map((item, i) => (
                <div key={item.id} className="ml-2">
                  ├─ {item.name}<br/>
                  {subcategories
                    .filter(s => s.parent === item.id)
                    .map(child => (
                      <div key={child.id} className="ml-4">
                        │  └─ {child.name}<br/>
                      </div>
                    ))}
                </div>
              ))}
            </div>
            
            <div className="text-xs text-gray-500">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-3 w-3" />
                <span>Preview da navegação</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Estatísticas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Produtos vinculados</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Subcategorias total</span>
              <span className="font-medium">{totalSubcategories}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Níveis de profundidade</span>
              <span className="font-medium">{maxLevel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ordem de exibição</span>
              <Input 
                type="number" 
                min="1" 
                max="100" 
                value={categoryData.orderIndex}
                onChange={(e) => setCategoryData(prev => ({ 
                  ...prev, 
                  orderIndex: parseInt(e.target.value) || 1 
                }))}
                className="w-16 h-8 text-center"
              />
            </div>
          </div>
          
          {maxLevel >= 4 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Máximo de 4 níveis atingido</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}