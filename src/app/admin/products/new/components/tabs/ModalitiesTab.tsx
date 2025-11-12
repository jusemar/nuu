// src/app/admin/products/new/components/tabs/ModalitiesTab.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function ModalitiesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modalidades de Venda</CardTitle>
        <CardDescription>Configure as diferentes formas de vender este produto</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estoque Próprio */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center space-x-2">
            <Switch id="stockAvailable" />
            <Label htmlFor="stockAvailable" className="font-semibold">Estoque Próprio</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stockAvailablePrice">Preço (R$)</Label>
              <Input id="stockAvailablePrice" type="number" placeholder="0.00" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockAvailableDays">Prazo (dias)</Label>
              <Input id="stockAvailableDays" type="number" placeholder="0" />
            </div>
          </div>
        </div>

        {/* Dropshipping */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center space-x-2">
            <Switch id="dropshipping" />
            <Label htmlFor="dropshipping" className="font-semibold">Dropshipping</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dropshippingPrice">Preço (R$)</Label>
              <Input id="dropshippingPrice" type="number" placeholder="0.00" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dropshippingDays">Prazo (dias)</Label>
              <Input id="dropshippingDays" type="number" placeholder="0" />
            </div>
          </div>
        </div>

        {/* Pré-venda */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center space-x-2">
            <Switch id="preSale" />
            <Label htmlFor="preSale" className="font-semibold">Pré-venda</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preSalePrice">Preço (R$)</Label>
              <Input id="preSalePrice" type="number" placeholder="0.00" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preSaleDays">Prazo (dias)</Label>
              <Input id="preSaleDays" type="number" placeholder="0" />
            </div>
          </div>
        </div>

        {/* Sob Encomenda */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center space-x-2">
            <Switch id="orderBasis" />
            <Label htmlFor="orderBasis" className="font-semibold">Sob Encomenda</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderBasisPrice">Preço (R$)</Label>
              <Input id="orderBasisPrice" type="number" placeholder="0.00" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderBasisDays">Prazo (dias)</Label>
              <Input id="orderBasisDays" type="number" placeholder="0" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}