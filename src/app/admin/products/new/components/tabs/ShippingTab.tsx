// src/app/admin/products/new/components/tabs/ShippingTab.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function ShippingTab() {
  return (
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
}