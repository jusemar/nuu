// src/app/admin/products/new/components/tabs/SellerTab.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SellerTab() {
  return (
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
}