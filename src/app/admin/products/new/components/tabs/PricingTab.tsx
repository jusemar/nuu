// src/app/admin/products/new/components/tabs/PricingTab.tsx
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, Calendar, Clock } from "lucide-react"
import { ModalityCard } from './pricing/ModalityCard'

export function PricingTab() {
  const [costPrice, setCostPrice] = useState('')
  const [modalities, setModalities] = useState({
      stock: { 
        price: '', 
        deliveryText: '',
        promo: { 
          active: false, 
          type: 'normal', 
          price: '', 
          endDate: undefined
        } 
      },
      preSale: { 
        price: '', 
        deliveryText: '',
        promo: { 
          active: false, 
          type: 'normal', 
          price: '', 
          endDate: undefined
        } 
      },
      dropshipping: { 
        price: '', 
        deliveryText: '',
        promo: { 
          active: false, 
          type: 'normal', 
          price: '', 
          endDate: undefined
        } 
      },
      orderBasis: { 
        price: '', 
        deliveryText: '',
        promo: { 
          active: false, 
          type: 'normal', 
          price: '', 
          endDate: undefined
        } 
      }
    })
          

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

  const togglePromo = (type: string) => {
    const newActive = !modalities[type as keyof typeof modalities].promo.active
    updatePromo(type, 'active', newActive)
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
              <Label className="font-medium">Preço de Custo</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="pl-8 h-10 border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Margem de Lucro</Label>
              <Input
                value={calculateMargin()}
                disabled
                className="bg-gray-50 font-medium h-10 border-gray-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODALIDADES DE VENDA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modalidades de Venda</CardTitle>
          <CardDescription>Todas as modalidades disponíveis para este produto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ModalityCard
              type="stock"
              label="Estoque Próprio"
              icon={<Package className="w-5 h-5 text-blue-600" />}
              description="Produto em estoque para envio rápido"
              modalities={modalities}
              updateModality={updateModality}
              updatePromo={updatePromo}
              togglePromo={togglePromo}
            />

            <ModalityCard
              type="preSale"
              label="Pré-venda"
              icon={<Calendar className="w-5 h-5 text-purple-600" />}
              description="Venda antecipada com data de entrega futura"
              modalities={modalities}
              updateModality={updateModality}
              updatePromo={updatePromo}
              togglePromo={togglePromo}
            />

            <ModalityCard
              type="dropshipping"
              label="Dropshipping"
              icon={<Package className="w-5 h-5 text-green-600" />}
              description="Enviado diretamente pelo fornecedor"
              modalities={modalities}
              updateModality={updateModality}
              updatePromo={updatePromo}
              togglePromo={togglePromo}
            />

            <ModalityCard
              type="orderBasis"
              label="Sob Encomenda"
              icon={<Clock className="w-5 h-5 text-orange-600" />}
              description="Produzido especialmente para o cliente"
              modalities={modalities}
              updateModality={updateModality}
              updatePromo={updatePromo}
              togglePromo={togglePromo}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}