// src/app/admin/products/new/components/tabs/PricingTab.tsx
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Package, Clock, Zap, Calendar, ChevronDownIcon } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function PricingTab() {
  const [costPrice, setCostPrice] = useState('')
  const [modalities, setModalities] = useState({
    stock: { 
      active: false, 
      price: '', 
      deliveryText: '', 
      promo: { 
        active: false, 
        type: 'normal', 
        price: '', 
        endDate: undefined as Date | undefined
      } 
    },
    preSale: { 
      active: false, 
      price: '', 
      deliveryText: '', 
      promo: { 
        active: false, 
        type: 'normal', 
        price: '', 
        endDate: undefined as Date | undefined
      } 
    },
    dropshipping: { 
      active: false, 
      price: '', 
      deliveryText: '', 
      promo: { 
        active: false, 
        type: 'normal', 
        price: '', 
        endDate: undefined as Date | undefined
      } 
    },
    orderBasis: { 
      active: false, 
      price: '', 
      deliveryText: '', 
      promo: { 
        active: false, 
        type: 'normal', 
        price: '', 
        endDate: undefined as Date | undefined
      } 
    }
  })

  const [expandedModality, setExpandedModality] = useState<string | null>(null)

  const calculateMargin = () => {
    if (!costPrice || !modalities.stock.price) return '0%'
    const cost = parseFloat(costPrice)
    const sale = parseFloat(modalities.stock.price)
    const margin = ((sale - cost) / cost) * 100
    return isNaN(margin) ? '0%' : `${margin.toFixed(1)}%`
  }

  const updateModality = (type: string, field: string, value: any) => {
    setModalities(prev => ({
      ...prev,
      [type]: { ...prev[type as keyof typeof prev], [field]: value }
    }))
  }

  const updatePromo = (type: string, field: string, value: any) => {
    setModalities(prev => ({
      ...prev,
      [type]: { 
        ...prev[type as keyof typeof prev], 
        promo: { ...prev[type as keyof typeof prev].promo, [field]: value }
      }
    }))
  }

  const toggleModality = (type: string) => {
    const newActive = !modalities[type as keyof typeof modalities].active
    updateModality(type, 'active', newActive)
    setExpandedModality(newActive ? type : null)
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

    // Opções de horários pré-definidos
    const timeOptions = [
      "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", 
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
      "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
    ]

    return (
      <div className="flex gap-2 w-full">
        {/* Date Picker */}
        <div className="flex-1 min-w-0">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-normal h-9 text-sm min-w-[120px]"
              >
                {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Data"}
                <ChevronDownIcon className="w-4 h-4" />
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

        {/* Time Picker com Select */}
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

  const ModalityCard = ({ type, label, icon, description }: { 
    type: string, 
    label: string, 
    icon: React.ReactNode,
    description: string 
  }) => {
    const isActive = modalities[type as keyof typeof modalities].active
    const isExpanded = expandedModality === type

    return (
      <Card className={`transition-all duration-200 ${isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
        <CardContent className="p-4">
          {/* Header Compacto */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-white rounded-lg border shrink-0">
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 truncate">{label}</h3>
                <p className="text-sm text-gray-500 truncate">{description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {isActive && (
                <button
                  onClick={() => setExpandedModality(isExpanded ? null : type)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors shrink-0"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
              <Switch
                checked={isActive}
                onCheckedChange={() => toggleModality(type)}
                className="shrink-0"
              />
            </div>
          </div>

          {/* Conteúdo Expandido */}
          {isActive && isExpanded && (
            <div className="mt-4 space-y-4 pl-11">
              {/* Preço e Prazo - Layout Compacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 shrink-0" />
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
                      className="pl-8 text-sm h-9"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 shrink-0" />
                    Prazo de Entrega
                  </Label>
                  <Input
                    placeholder="Ex: 2-3 dias"
                    value={modalities[type as keyof typeof modalities].deliveryText}
                    onChange={(e) => updateModality(type, 'deliveryText', e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
              </div>

              {/* Promoção */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 shrink-0" />
                    Promoção
                  </Label>
                  <Switch
                    checked={modalities[type as keyof typeof modalities].promo.active}
                    onCheckedChange={(checked) => updatePromo(type, 'active', checked)}
                    className="shrink-0"
                  />
                </div>

                {modalities[type as keyof typeof modalities].promo.active && (
                  <div className="space-y-4 bg-white p-4 rounded-lg border">
                    {/* Tipo de Promoção */}
                    <div className="space-y-2">
                      <Label className="text-sm">Tipo de Promoção</Label>
                      <RadioGroup
                        value={modalities[type as keyof typeof modalities].promo.type}
                        onValueChange={(value) => updatePromo(type, 'type', value)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="normal" id={`${type}-normal`} />
                          <Label htmlFor={`${type}-normal`} className="text-sm font-normal">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Normal
                            </Badge>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="flash" id={`${type}-flash`} />
                          <Label htmlFor={`${type}-flash`} className="text-sm font-normal">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700">
                              Relâmpago
                            </Badge>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Preço Promocional e Validade - Layout Ajustado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Preço Promocional</Label>
                        <div className="relative max-w-[180px]">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            value={modalities[type as keyof typeof modalities].promo.price}
                            onChange={(e) => updatePromo(type, 'price', e.target.value)}
                            className="pl-8 text-sm h-9"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 shrink-0" />
                          Validade da Oferta
                        </Label>
                        <DateTimePicker
                          date={modalities[type as keyof typeof modalities].promo.endDate}
                          onSelect={(date) => updatePromo(type, 'endDate', date)}
                          placeholder="Selecione data e hora"
                        />
                        {modalities[type as keyof typeof modalities].promo.endDate && (
                          <p className="text-xs text-gray-500 mt-1">
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
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* CARD CUSTO E MARGEM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custo e Margem</CardTitle>
          <CardDescription>Configure o preço de custo para cálculo da margem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
            <div className="space-y-2">
              <Label>Preço de Custo</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Margem de Lucro</Label>
              <Input
                value={calculateMargin()}
                disabled
                className="bg-gray-50 font-medium h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODALIDADES DE VENDA - LAYOUT HORIZONTAL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modalidades de Venda</CardTitle>
          <CardDescription>Configure diferentes formas de vender este produto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ModalityCard
              type="stock"
              label="Estoque Próprio"
              icon={<Package className="w-5 h-5 text-blue-600" />}
              description="Pronto para envio imediato"
            />

            <ModalityCard
              type="preSale"
              label="Pré-venda"
              icon={<Calendar className="w-5 h-5 text-purple-600" />}
              description="Reserva antecipada"
            />

            <ModalityCard
              type="dropshipping"
              label="Dropshipping"
              icon={<Package className="w-5 h-5 text-green-600" />}
              description="Enviado pelo fornecedor"
            />

            <ModalityCard
              type="orderBasis"
              label="Sob Encomenda"
              icon={<Clock className="w-5 h-5 text-orange-600" />}
              description="Produzido sob demanda"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}