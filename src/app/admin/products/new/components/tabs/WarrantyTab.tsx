"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

interface WarrantyTabProps {
  data: {
    warranty?: {
      period?: string
      provider?: string
      terms?: string
    }
  }
  onChange: (updates: any) => void
}

export function WarrantyTab({ data, onChange }: WarrantyTabProps) {
  const warrantyData = data.warranty || {}

  const handleWarrantyChange = (updates: any) => {
    onChange({ 
      warranty: { ...warrantyData, ...updates } 
    })
  }

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
            <Select 
              value={warrantyData.period} 
              onValueChange={(value) => handleWarrantyChange({ period: value })}
            >
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
            <Input 
              id="warrantyProvider" 
              placeholder="Ex: Fabricante, Loja, etc." 
              value={warrantyData.provider || ''}
              onChange={(e) => handleWarrantyChange({ provider: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="warrantyTerms">Termos da Garantia</Label>
          <RichTextEditor
            value={warrantyData.terms || ''}
            onChange={(value) => handleWarrantyChange({ terms: value })}
            placeholder="Descreva os termos e condições da garantia..."
          />
        </div>
      </CardContent>
    </Card>
  )
}