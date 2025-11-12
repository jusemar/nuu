// src/app/admin/products/new/components/tabs/FinancialTab.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function FinancialTab() {
  return (
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
}