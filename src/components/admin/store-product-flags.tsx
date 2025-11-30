// src/components/admin/store-product-flags.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface StoreProductFlagsProps {
  value: string[]
  onChange: (flags: string[]) => void
}

export function StoreProductFlags({ value, onChange }: StoreProductFlagsProps) {
  const toggleFlag = (flag: string) => {
    const newFlags = value.includes(flag) ? value.filter((f) => f !== flag) : [...value, flag]
    onChange(newFlags)
  }

  const sections = [
    {
      id: "general",
      icon: "📦",
      title: "Catálogo",
      description: "Lista geral",
      color: "border-gray-200 bg-gray-50 hover:bg-gray-100",
      activeColor: "border-gray-500 bg-gray-500/5",
      badgeColor: "bg-gray-100 text-gray-800",
      isDefault: true,
    },
    {
      id: "new",
      icon: "🆕",
      title: "Novidades",
      description: "Novos",
      color: "border-blue-200 bg-blue-50 hover:bg-blue-100",
      activeColor: "border-blue-500 bg-blue-500/5",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    {
      id: "sale",
      icon: "🔥",
      title: "Ofertas",
      description: "Relâmpago",
      color: "border-orange-200 bg-orange-50 hover:bg-orange-100",
      activeColor: "border-orange-500 bg-orange-500/5",
      badgeColor: "bg-orange-100 text-orange-800",
    },
    {
      id: "featured",
      icon: "⭐",
      title: "Destaques",
      description: "Promoção",
      color: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100",
      activeColor: "border-yellow-500 bg-yellow-500/5",
      badgeColor: "bg-yellow-100 text-yellow-800",
    },
    {
      id: "bestseller",
      icon: "🏆",
      title: "+ Vendidos",
      description: "Popular",
      color: "border-green-200 bg-green-50 hover:bg-green-100",
      activeColor: "border-green-500 bg-green-500/5",
      badgeColor: "bg-green-100 text-green-800",
    },
  ]

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>🏪</span>
          Seções da Loja
        </CardTitle>
        <CardDescription>Selecione onde este produto aparecerá</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 lg:gap-3">
          {sections.map((section) => {
            const isSelected = value.includes(section.id)
            const isGeneral = section.id === "general"

            return (
              <div
                key={section.id}
                className={`
                  relative p-2 lg:p-2.5 border-2 rounded-lg transition-all duration-200 cursor-pointer
                  flex-1 min-w-[120px]
                  ${isSelected ? section.activeColor : section.color}
                  hover:scale-[1.02] hover:shadow-md
                  ${isGeneral ? "border-dashed" : ""}
                  flex flex-col justify-start
                `}
                onClick={() => toggleFlag(section.id)}
              >
                <div className="flex items-start gap-1.5 lg:gap-2">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => {}}
                    className={`mt-0.5 flex-shrink-0 ${isGeneral ? "data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600" : "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-base lg:text-sm flex-shrink-0">{section.icon}</span>
                      <Label className="font-semibold text-xs lg:text-sm cursor-pointer leading-tight whitespace-nowrap">
                        {section.title}
                      </Label>
                    </div>
                    <p className="text-xs text-gray-600 leading-tight line-clamp-1">{section.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {value.length > 0 && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg border text-xs">
            <p className="text-gray-700">
              <strong>{value.length}</strong> seção(ões) selecionada(s)
              {value.includes("general") && " • Catálogo"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
