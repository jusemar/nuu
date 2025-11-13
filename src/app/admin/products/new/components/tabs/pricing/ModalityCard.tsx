"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Zap, Calendar } from "lucide-react"
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
}

const DateTimePicker = ({ 
  date, 
  onSelect,
  placeholder = "Selecione data e hora"
}: {
  date: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
}) => {
  const [open, setOpen] = useState(false)
  const [selectedTime, setSelectedTime] = useState("23:59")

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes, 0, 0)
      onSelect(newDate)
    } else {
      onSelect(selectedDate)
    }
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    if (date) {
      const [hours, minutes] = time.split(":").map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)
      onSelect(newDate)
    } else if (time) {
      const today = new Date()
      const [hours, minutes] = time.split(":").map(Number)
      today.setHours(hours, minutes, 0, 0)
      onSelect(today)
    }
  }

  useEffect(() => {
    if (date) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      setSelectedTime(`${hours}:${minutes}`)
    }
  }, [date])

  const timeOptions = [
    "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", 
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
  ]

  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1 min-w-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between font-normal h-9 text-sm min-w-[120px]"
            >
              {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Data"}
              <Calendar className="w-4 h-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              locale={ptBR}
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 min-w-0">
        <Select value={selectedTime} onValueChange={handleTimeChange}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Hora" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function ModalityCard({ 
  type, 
  label, 
  icon, 
  description,
  modalities,
  updateModality,
  updatePromo,
  togglePromo 
}: ModalityCardProps) {
  const isPromoActive = modalities[type as keyof typeof modalities].promo.active

  return (
    <Card className="border-gray-200 hover:border-gray-300 transition-colors">
      <CardContent className="p-4">
        {/* Header - Sempre Visível */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 shrink-0 mt-1">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-base">{label}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
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
                value={modalities[type as keyof typeof modalities].price}
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
              placeholder="Ex: 2-3 dias p/ entrega" // ← PLACEHOLDER MOSTRANDO EXEMPLO
              value={modalities[type as keyof typeof modalities].deliveryText}
              onChange={(e) => updateModality(type, 'deliveryText', e.target.value)}
              className="text-sm h-10 border-gray-300 focus:border-blue-500"
            />

          </div>
        </div>

        {/* Seção de Promoção - Controlada apenas pelo Switch */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isPromoActive ? 'text-orange-500' : 'text-gray-400'}`} />
              <Label className="text-sm font-medium text-gray-700 cursor-pointer" onClick={() => togglePromo(type)}>
                Promoção
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isPromoActive}
                onCheckedChange={() => togglePromo(type)}
                className="data-[state=checked]:bg-orange-500"
              />
            </div>
          </div>

          {/* Conteúdo da Promoção - Visível apenas quando ativa */}
          {isPromoActive && (
            <div className="space-y-4 bg-orange-50/50 p-4 rounded-lg border border-orange-200">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Tipo de Promoção</Label>
                <RadioGroup
                  value={modalities[type as keyof typeof modalities].promo.type}
                  onValueChange={(value) => updatePromo(type, 'type', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id={`${type}-normal`} />
                    <Label htmlFor={`${type}-normal`} className="text-sm font-normal cursor-pointer">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Normal
                      </Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flash" id={`${type}-flash`} />
                    <Label htmlFor={`${type}-flash`} className="text-sm font-normal cursor-pointer">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        Relâmpago
                      </Badge>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Preço Promocional</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={modalities[type as keyof typeof modalities].promo.price}
                      onChange={(e) => updatePromo(type, 'price', e.target.value)}
                      className="pl-8 text-sm h-10 border-orange-300 focus:border-orange-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Validade da Oferta
                  </Label>
                  <DateTimePicker
                    date={modalities[type as keyof typeof modalities].promo.endDate}
                    onSelect={(date) => updatePromo(type, 'endDate', date)}
                  />
                  {modalities[type as keyof typeof modalities].promo.endDate && (
                    <p className="text-xs text-gray-600 mt-1">
                      Promoção válida até {format(
                        modalities[type as keyof typeof modalities].promo.endDate as Date, 
                        "dd/MM/yyyy 'às' HH:mm", 
                        { locale: ptBR }
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}