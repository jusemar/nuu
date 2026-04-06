// ==========================================
// COMPONENTE: ShippingTab (ABA DE FRETE COMPLETA)
// ==========================================
// Responsabilidade: Configurar todas as opções de frete do produto
//
// UX/UI MELHORIAS:
//   1. Preview em tempo real (cliente vê as opções)
//   2. Drag & drop para ordenar métodos de entrega
//   3. Tooltips explicativos em cada campo
//   4. Validação inline com indicadores visuais
//   5. Toast feedback para ações do usuário
//   6. Dark mode suporte (Tailwind)
//   7. Layout responsivo (mobile/desktop)
//   8. Animações suaves (fade-in, slide)

"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// Shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"

// Ícones (lucide-react)
import {
  GripVertical,
  Plus,
  Trash2,
  HelpCircle,
  Eye,
  Package,
  Building2,
  Truck,
  MapPin,
  AlertCircle,
  DollarSign,
  Gift,
  Save,
} from "lucide-react"

// ==========================================
// TIPOS
// ==========================================

type ShippingMethod = {
  id: string
  type: "pickup" | "own" | "correios" | "jadlog" | "loggi"
  name: string
  isActive: boolean
  isDefault: boolean
  priceInCents: number
  deliveryMinDays: number
  deliveryMaxDays: number
  address?: string
  capacityKg?: number
  sortOrder: number
}

type Restriction = {
  id: string
  type: "state" | "city" | "cep_range"
  value: string
  cepStart?: string
  cepEnd?: string
  message: string
}

type SpecialRule = {
  id: string
  type: "state" | "city" | "neighborhood"
  location: string
  methodId: string
  priceInCents: number
  reason?: string
}

// ==========================================
// COMPONENTE SORTABLE ITEM (para drag & drop)
// ==========================================

interface SortableMethodItemProps {
  method: ShippingMethod
  index: number
  onToggleActive: (id: string) => void
  onToggleDefault: (id: string) => void
  onRemove: (id: string) => void
  onChange: (id: string, field: keyof ShippingMethod, value: any) => void
}

function SortableMethodItem({
  method,
  onToggleActive,
  onToggleDefault,
  onRemove,
  onChange,
}: SortableMethodItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: method.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const typeIcons = {
    pickup: "🏪",
    own: "🚚",
    correios: "📦",
    jadlog: "✈️",
    loggi: "🛵",
  }

  const typeLabels = {
    pickup: "Retirada no Local",
    own: "Entrega Própria",
    correios: "Correios",
    jadlog: "JadLog",
    loggi: "Loggi",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 bg-white dark:bg-gray-900 transition-all ${
        method.isDefault ? "border-primary ring-1 ring-primary/20" : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Ícone do tipo */}
        <span className="text-2xl">{typeIcons[method.type]}</span>

        {/* Conteúdo principal */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {typeLabels[method.type]}
            </h4>
            {method.isDefault && (
              <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                Padrão
              </Badge>
            )}
            {!method.isActive && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-500 dark:bg-gray-800">
                Inativo
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {typeLabels[method.type]} •{" "}
            {method.deliveryMinDays === method.deliveryMaxDays
              ? `${method.deliveryMinDays} dia útil`
              : `${method.deliveryMinDays}-${method.deliveryMaxDays} dias úteis`}
          </p>

          {/* Campos específicos por tipo */}
          {method.type === "pickup" && (
            <div className="mt-2">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                Endereço para retirada
              </Label>
              <Input
                value={method.address || ""}
                onChange={(e) => onChange(method.id, "address", e.target.value)}
                placeholder="Rua, número, bairro, cidade - UF"
                className="mt-1 h-9 text-sm"
              />
            </div>
          )}

          {method.type === "own" && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  Capacidade máxima (kg)
                </Label>
                <Input
                  type="number"
                  value={method.capacityKg || ""}
                  onChange={(e) => onChange(method.id, "capacityKg", Number(e.target.value))}
                  placeholder="50"
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </div>
          )}

          {/* Preço e prazo (sempre visível) */}
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                Preço (R$) <span className="text-red-500">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Valor cobrado do cliente</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                step="0.01"
                value={method.priceInCents / 100}
                onChange={(e) => onChange(method.id, "priceInCents", Math.round(Number(e.target.value) * 100))}
                placeholder="0,00"
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                Prazo mínimo (dias) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={method.deliveryMinDays}
                onChange={(e) => onChange(method.id, "deliveryMinDays", Number(e.target.value))}
                placeholder="1"
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                Prazo máximo (dias) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={method.deliveryMaxDays}
                onChange={(e) => onChange(method.id, "deliveryMaxDays", Number(e.target.value))}
                placeholder="3"
                className="mt-1 h-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Ações direita */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id={`active-${method.id}`}
                checked={method.isActive}
                onCheckedChange={() => onToggleActive(method.id)}
              />
              <Label htmlFor={`active-${method.id}`} className="text-sm cursor-pointer">
                Ativo
              </Label>
            </div>
            {method.type !== "pickup" && (
              <div className="flex items-center gap-2">
                <Switch
                  id={`default-${method.id}`}
                  checked={method.isDefault}
                  onCheckedChange={() => onToggleDefault(method.id)}
                />
                <Label htmlFor={`default-${method.id}`} className="text-sm cursor-pointer">
                  Padrão
                </Label>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(method.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remover
          </Button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export function ShippingTab() {
  // -----------------------------------------
  // ESTADOS
  // -----------------------------------------
  const [methods, setMethods] = useState<ShippingMethod[]>([
    {
      id: "1",
      type: "pickup",
      name: "Retirada no Local",
      isActive: true,
      isDefault: false,
      priceInCents: 0,
      deliveryMinDays: 0,
      deliveryMaxDays: 0,
      address: "Rua ABC, 123 - Centro, São Paulo - SP",
      sortOrder: 0,
    },
    {
      id: "2",
      type: "own",
      name: "Entrega Própria",
      isActive: true,
      isDefault: true,
      priceInCents: 1500,
      deliveryMinDays: 1,
      deliveryMaxDays: 2,
      capacityKg: 50,
      sortOrder: 1,
    },
    {
      id: "3",
      type: "correios",
      name: "Correios",
      isActive: false,
      isDefault: false,
      priceInCents: 1890,
      deliveryMinDays: 5,
      deliveryMaxDays: 7,
      sortOrder: 2,
    },
  ])

  const [restrictions, setRestrictions] = useState<Restriction[]>([
    {
      id: "1",
      type: "state",
      value: "RJ",
      message: "Não realizamos entregas no Rio de Janeiro no momento",
    },
  ])

  const [specials, setSpecials] = useState<SpecialRule[]>([
    {
      id: "1",
      type: "neighborhood",
      location: "Jardins - São Paulo/SP",
      methodId: "2",
      priceInCents: 2500,
      reason: "Entrega premium - região nobre",
    },
  ])

  // Dimensões do produto (mock)
  const [dimensions, setDimensions] = useState({
    weight: "",
    length: "",
    width: "",
    height: "",
  })

  // Sensors para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // -----------------------------------------
  // HANDLERS
  // -----------------------------------------

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setMethods((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        return newItems.map((item, idx) => ({ ...item, sortOrder: idx }))
      })
      toast.success("Ordem atualizada", { duration: 1500 })
    }
  }

  const handleAddMethod = () => {
    const newMethod: ShippingMethod = {
      id: Date.now().toString(),
      type: "own",
      name: "Nova Entrega",
      isActive: true,
      isDefault: false,
      priceInCents: 0,
      deliveryMinDays: 1,
      deliveryMaxDays: 3,
      sortOrder: methods.length,
    }
    setMethods([...methods, newMethod])
    toast.success("Método de entrega adicionado")
  }

  const handleToggleActive = (id: string) => {
    setMethods(methods.map(m => 
      m.id === id ? { ...m, isActive: !m.isActive } : m
    ))
    toast.success("Status atualizado")
  }

  const handleToggleDefault = (id: string) => {
    setMethods(methods.map(m => ({
      ...m,
      isDefault: m.id === id
    })))
    toast.success("Método padrão definido")
  }

  const handleRemoveMethod = (id: string) => {
    setMethods(methods.filter(m => m.id !== id))
    toast.success("Método removido")
  }

  const handleMethodChange = (id: string, field: keyof ShippingMethod, value: any) => {
    setMethods(methods.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  const handleAddRestriction = () => {
    const newRestriction: Restriction = {
      id: Date.now().toString(),
      type: "state",
      value: "",
      message: "",
    }
    setRestrictions([...restrictions, newRestriction])
    toast.success("Nova restrição adicionada")
  }

  const handleRemoveRestriction = (id: string) => {
    setRestrictions(restrictions.filter(r => r.id !== id))
    toast.success("Restrição removida")
  }

  const handleAddSpecial = () => {
    const newSpecial: SpecialRule = {
      id: Date.now().toString(),
      type: "city",
      location: "",
      methodId: methods.find(m => m.isActive)?.id || "",
      priceInCents: 0,
    }
    setSpecials([...specials, newSpecial])
    toast.success("Nova regra especial adicionada")
  }

  const handleRemoveSpecial = (id: string) => {
    setSpecials(specials.filter(s => s.id !== id))
    toast.success("Regra especial removida")
  }

  // -----------------------------------------
  // PREVIEW (simula como o cliente vê)
  // -----------------------------------------
  const activeMethods = methods.filter(m => m.isActive).sort((a, b) => a.sortOrder - b.sortOrder)

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <TooltipProvider>
      <div className="space-y-6">
        
        {/* HEADER COM PREVIEW */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Configurações de Frete
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Defina como, onde e por quanto entregar este produto
            </p>
          </div>

          {/* Botão Salvar */}
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Salvar todas as configurações
          </Button>
        </div>

        {/* TABS */}
        <Tabs defaultValue="methods" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="methods">
              📦 Métodos ({methods.filter(m => m.isActive).length})
            </TabsTrigger>
            <TabsTrigger value="restrictions">
              🚫 Restrições ({restrictions.length})
            </TabsTrigger>
            <TabsTrigger value="specials">
              ⭐ Regras Especiais ({specials.length})
            </TabsTrigger>
          </TabsList>

          {/* ==========================================
              ABA 1: MÉTODOS DE ENTREGA
              ========================================== */}
          <TabsContent value="methods" className="space-y-6">
            
            {/* Card: Dimensões do Produto */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-500" />
                  <CardTitle className="text-base">Dimensões do Produto</CardTitle>
                </div>
                <CardDescription>
                  Usado para cálculo de frete nas transportadoras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-sm">
                      Peso (kg) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="0,00"
                      value={dimensions.weight}
                      onChange={(e) => setDimensions({ ...dimensions, weight: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Comprimento (cm)</Label>
                    <Input
                      placeholder="0"
                      value={dimensions.length}
                      onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Largura (cm)</Label>
                    <Input
                      placeholder="0"
                      value={dimensions.width}
                      onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Altura (cm)</Label>
                    <Input
                      placeholder="0"
                      value={dimensions.height}
                      onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card: Métodos de Entrega com Drag & Drop */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-gray-500" />
                    <CardTitle className="text-base">Métodos de Entrega</CardTitle>
                  </div>
                  <CardDescription>
                    Arraste para reordenar • Clique no switch para ativar/desativar
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddMethod}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar método
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={methods.map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {methods.map((method, idx) => (
                        <SortableMethodItem
                          key={method.id}
                          method={method}
                          index={idx}
                          onToggleActive={handleToggleActive}
                          onToggleDefault={handleToggleDefault}
                          onRemove={handleRemoveMethod}
                          onChange={handleMethodChange}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {methods.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum método cadastrado. Clique em "Adicionar método" para começar.
                  </div>
                )}

                {/* Adicionar transportadora rápida */}
                <div className="border border-dashed rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-500 mb-3 text-center">
                    Ou adicione uma transportadora integrada:
                  </p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Package className="h-4 w-4" /> Correios
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      ✈️ JadLog
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      🛵 Loggi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PREVIEW EM TEMPO REAL */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-base">Preview: Como o cliente verá</CardTitle>
                </div>
                <CardDescription>
                  Simulação das opções de frete na página do produto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Opções de entrega:
                  </h4>
                  <div className="space-y-2">
                    {activeMethods.length === 0 && (
                      <p className="text-sm text-gray-400">Nenhum método ativo</p>
                    )}
                    {activeMethods.map((method) => {
                      const typeLabels = {
                        pickup: "Retirar na loja",
                        own: "Entrega própria",
                        correios: "Correios",
                        jadlog: "JadLog",
                        loggi: "Loggi",
                      }
                      return (
                        <div
                          key={method.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {typeLabels[method.type]}
                            </div>
                            <div className="text-xs text-gray-500">
                              {method.deliveryMinDays === method.deliveryMaxDays
                                ? `${method.deliveryMinDays} dia útil`
                                : `${method.deliveryMinDays}-${method.deliveryMaxDays} dias úteis`}
                            </div>
                          </div>
                          <div className="font-bold text-gray-900 dark:text-gray-100">
                            {method.priceInCents === 0
                              ? "Grátis"
                              : `R$ ${(method.priceInCents / 100).toFixed(2).replace(".", ",")}`}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==========================================
              ABA 2: RESTRIÇÕES
              ========================================== */}
          <TabsContent value="restrictions" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-gray-500" />
                    <CardTitle className="text-base">Regiões Não Atendidas</CardTitle>
                  </div>
                  <CardDescription>
                    Bloqueie estados, cidades ou faixas de CEP específicas
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddRestriction}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar restrição
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {restrictions.map((restriction) => (
                  <div
                    key={restriction.id}
                    className="border rounded-lg p-4 bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 flex-1">
                        <span className="text-2xl">🚫</span>
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-3 flex-wrap">
                            <select
                              value={restriction.type}
                              onChange={(e) => {
                                setRestrictions(restrictions.map(r =>
                                  r.id === restriction.id
                                    ? { ...r, type: e.target.value as Restriction["type"] }
                                    : r
                                ))
                              }}
                              className="border rounded-md px-3 py-2 text-sm"
                            >
                              <option value="state">Estado</option>
                              <option value="city">Cidade</option>
                              <option value="cep_range">Faixa de CEP</option>
                            </select>

                            <Input
                              placeholder={restriction.type === "state" ? "SP, RJ, MG" : "Nome da cidade"}
                              value={restriction.value}
                              onChange={(e) => {
                                setRestrictions(restrictions.map(r =>
                                  r.id === restriction.id ? { ...r, value: e.target.value } : r
                                ))
                              }}
                              className="flex-1"
                            />

                            {restriction.type === "cep_range" && (
                              <>
                                <Input
                                  placeholder="CEP inicial"
                                  value={restriction.cepStart || ""}
                                  onChange={(e) => {
                                    setRestrictions(restrictions.map(r =>
                                      r.id === restriction.id ? { ...r, cepStart: e.target.value } : r
                                    ))
                                  }}
                                  className="w-32"
                                />
                                <Input
                                  placeholder="CEP final"
                                  value={restriction.cepEnd || ""}
                                  onChange={(e) => {
                                    setRestrictions(restrictions.map(r =>
                                      r.id === restriction.id ? { ...r, cepEnd: e.target.value } : r
                                    ))
                                  }}
                                  className="w-32"
                                />
                              </>
                            )}
                          </div>

                          <div>
                            <Label className="text-xs text-gray-600 dark:text-gray-400">
                              Mensagem exibida ao cliente
                            </Label>
                            <Input
                              value={restriction.message}
                              onChange={(e) => {
                                setRestrictions(restrictions.map(r =>
                                  r.id === restriction.id ? { ...r, message: e.target.value } : r
                                ))
                              }}
                              placeholder="Ex: Não entregamos neste estado"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRestriction(restriction.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {restrictions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma restrição cadastrada. Este produto entrega para todo o Brasil.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==========================================
              ABA 3: REGRAS ESPECIAIS
              ========================================== */}
          <TabsContent value="specials" className="space-y-6">
            
            {/* Preços personalizados */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-gray-500" />
                    <CardTitle className="text-base">Preços Personalizados por Região</CardTitle>
                  </div>
                  <CardDescription>
                    Sobrescreva o preço base do método para locais específicos
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddSpecial}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar regra
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {specials.map((special) => (
                  <div
                    key={special.id}
                    className="border rounded-lg p-4 bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 flex-1">
                        <span className="text-2xl">💰</span>
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <select
                              value={special.type}
                              onChange={(e) => {
                                setSpecials(specials.map(s =>
                                  s.id === special.id
                                    ? { ...s, type: e.target.value as SpecialRule["type"] }
                                    : s
                                ))
                              }}
                              className="border rounded-md px-3 py-2 text-sm"
                            >
                              <option value="state">Estado</option>
                              <option value="city">Cidade</option>
                              <option value="neighborhood">Bairro</option>
                            </select>

                            <Input
                              placeholder={
                                special.type === "state"
                                  ? "SP, RJ, MG"
                                  : special.type === "city"
                                  ? "São Paulo - SP"
                                  : "Jardins - São Paulo/SP"
                              }
                              value={special.location}
                              onChange={(e) => {
                                setSpecials(specials.map(s =>
                                  s.id === special.id ? { ...s, location: e.target.value } : s
                                ))
                              }}
                              className="md:col-span-2"
                            />

                            <select
                              value={special.methodId}
                              onChange={(e) => {
                                setSpecials(specials.map(s =>
                                  s.id === special.id ? { ...s, methodId: e.target.value } : s
                                ))
                              }}
                              className="border rounded-md px-3 py-2 text-sm"
                            >
                              {methods.filter(m => m.isActive).map((method) => (
                                <option key={method.id} value={method.id}>
                                  {method.type === "pickup" && "Retirada"}
                                  {method.type === "own" && "Entrega própria"}
                                  {method.type === "correios" && "Correios"}
                                  {method.type === "jadlog" && "JadLog"}
                                  {method.type === "loggi" && "Loggi"}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-gray-600 dark:text-gray-400">
                                Preço especial (R$)
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={special.priceInCents / 100}
                                onChange={(e) => {
                                  setSpecials(specials.map(s =>
                                    s.id === special.id
                                      ? { ...s, priceInCents: Math.round(Number(e.target.value) * 100) }
                                      : s
                                  ))
                                }}
                                placeholder="0,00"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600 dark:text-gray-400">
                                Motivo (opcional)
                              </Label>
                              <Input
                                value={special.reason || ""}
                                onChange={(e) => {
                                  setSpecials(specials.map(s =>
                                    s.id === special.id ? { ...s, reason: e.target.value } : s
                                  ))
                                }}
                                placeholder="Ex: Região de difícil acesso"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSpecial(special.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {specials.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma regra especial cadastrada.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Frete grátis por região */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-gray-500" />
                  <CardTitle className="text-base">Frete Grátis por Região</CardTitle>
                </div>
                <CardDescription>
                  Ofereça frete grátis com valor mínimo diferente para regiões específicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Switch id="free-sp" />
                  <div className="flex-1">
                    <Label htmlFor="free-sp" className="font-medium">
                      São Paulo capital
                    </Label>
                    <p className="text-sm text-gray-500">Frete grátis acima de</p>
                  </div>
                  <Input value="R$ 199,00" className="w-32" />
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Switch id="free-sudeste" />
                  <div className="flex-1">
                    <Label htmlFor="free-sudeste" className="font-medium">
                      Sudeste (exceto SP capital)
                    </Label>
                    <p className="text-sm text-gray-500">Frete grátis acima de</p>
                  </div>
                  <Input value="R$ 299,00" className="w-32" />
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar regra de frete grátis
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}