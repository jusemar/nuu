"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Zap, Calendar, Crown } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ModalityCardProps {
  type: string
  label: string
  icon: React.ReactNode
  description: string
  modalities: any
  updateModality: (type: string, field: string, value: any) => void
  updatePromo: (type: string, field: string, value: any) => void
  togglePromo: (type: string) => void 
  isMainCard: boolean
  onSelectMainCard: () => void
}

// ... (DateTimePicker component permanece igual)

export function ModalityCard({ 
  type, 
  label, 
  icon, 
  description,
  modalities,
  updateModality,
  updatePromo,
  togglePromo,
  isMainCard,
  onSelectMainCard
}: ModalityCardProps) {
  const currentModality = modalities?.[type];
 

  return (
    <Card className={`border-gray-200 hover:border-gray-300 transition-colors ${
      isMainCard ? 'ring-2 ring-blue-500 border-blue-300' : ''
    }`}>
      <CardContent className="p-4">
        {/* Header - Com Seleção de Preço Principal */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 shrink-0 mt-1">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-base">{label}</h3>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              </div>
              
              {/* ✅ RADIO BUTTON PARA SELEÇÃO PRINCIPAL */}
              <div className="flex items-center gap-2 ml-3 shrink-0">
                {isMainCard && (
                  <Badge variant="default" className="bg-blue-600 text-white text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Principal
                  </Badge>
                )}

         <RadioGroup value={isMainCard ? type : ""}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem 
      value={type}
      id={`main-card-${type}`}
      onClick={onSelectMainCard}
      className="h-4 w-4 text-blue-600"
    />
    <Label htmlFor={`main-card-${type}`}>
      Card principal
    </Label>
  </div>
</RadioGroup>

              </div>
            </div>
          </div>
        </div>

        {/* Campos de Preço e Prazo - Sempre Visíveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Preço de Venda
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={currentModality?.price || ''}
                onChange={(e) => updateModality(type, 'price', e.target.value)}
                className="pl-8 text-sm h-10 border-gray-300 focus:border-blue-500"
              />

            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Prazo de Entrega
            </Label>
            <Input
              placeholder="Ex: 2-3 dias p/ entrega"
              value={currentModality?.deliveryText || ''}
              onChange={(e) => updateModality(type, 'deliveryText', e.target.value)}
              className="text-sm h-10 border-gray-300 focus:border-blue-500"
            />
          </div>
        </div>

        {/* ... (resto do código permanece igual) */}
      </CardContent>
    </Card>
  )
}