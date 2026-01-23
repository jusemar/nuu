"use client"

import { Folder, Home, Plus, ChevronRight, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SubcategoryNode } from "./SubcategoryNode"

// Tipo para os itens de subcategoria
export type SubcategoryItem = {
  id: string
  name: string
  level: number
  parent?: string
  childrenCount?: number
  expanded?: boolean
}

// Props que o componente recebe
interface SubcategoriesCardProps {
  subcategories: SubcategoryItem[]
  expandedItems: string[]
  toggleExpand: (id: string) => void
  getLevelColor: (level: number) => string
  getLevelBadge: (level: number) => React.ReactNode
  categoryName: string
  directSubcategories: number
  totalSubcategories: number
}

export function SubcategoriesCard({
  subcategories,
  expandedItems,
  toggleExpand,
  getLevelColor,
  getLevelBadge,
  categoryName,
  directSubcategories,
  totalSubcategories
}: SubcategoriesCardProps) {
  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Gerenciador de Subcategorias
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              {/* Badge com contagem de subcategorias diretas */}
              <Badge variant="secondary" className="font-normal">
                {directSubcategories} subcategorias diretas
              </Badge>
              <span className="text-gray-400">•</span>
              {/* Contagem total de subcategorias */}
              <span>{totalSubcategories} no total</span>
              <span className="text-gray-400">•</span>
              {/* Indicação do limite de níveis */}
              <span>Máximo 4 níveis</span>
            </CardDescription>
          </div>
          {/* Botão para adicionar nova subcategoria */}
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Subcategoria
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Breadcrumb de navegação */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded">
          <Home className="h-3 w-3" />
          <span>Home</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium">{categoryName || "Categoria"}</span>
          <ChevronRight className="h-3 w-3" />
          <span>Subcategorias</span>
        </div>

        {/* Árvore de Subcategorias - Renderiza apenas itens de nível 1 (sem pai) */}
        <div className="space-y-1">
          {subcategories
            .filter(item => !item.parent) // Filtra apenas subcategorias de nível 1
            .map(item => (
              <div key={item.id}>
                <SubcategoryNode
                  item={item}
                  subcategories={subcategories}
                  expandedItems={expandedItems}
                  toggleExpand={toggleExpand}
                  getLevelColor={getLevelColor}
                  getLevelBadge={getLevelBadge}
                />
              </div>
            ))}
        </div>

        {/* Mensagem quando não há subcategorias */}
        {subcategories.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">Nenhuma subcategoria</h3>
            <p className="text-sm text-gray-500 mb-4">
              Adicione subcategorias para organizar seus produtos
            </p>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira subcategoria
            </Button>
          </div>
        )}

        {/* Legenda das cores dos níveis */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Nível 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Nível 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Nível 3</span>
          </div>
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span>Arrastar para reordenar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}