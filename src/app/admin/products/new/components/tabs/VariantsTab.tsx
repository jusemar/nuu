// src/app/admin/products/new/components/tabs/VariantsTab.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function VariantsTab() {
  return (
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
}