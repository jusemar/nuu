// src/app/admin/products/new/components/tabs/SeoTab.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SeoTab() {
  return (
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