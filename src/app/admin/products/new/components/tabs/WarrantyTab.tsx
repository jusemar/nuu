// src/app/admin/products/new/components/tabs/WarrantyTab.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function WarrantyTab() {
  return (
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
}