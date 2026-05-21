// src/app/admin/products/new/components/tabs/PricingTab.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Package,
  Calendar,
  Clock,
} from "lucide-react";
import { ModalityCard } from "./pricing/ModalityCard";
import { useSingleSelection } from "@/hooks/admin/forms/useSingleSelection";
import { summarizeVariantEditor } from "@/features/products";
import type { ProductVariantFormInput } from "@/features/products";

interface PricingTabProps {
  data: {
    pricing?: {
      costPrice?: string;
      modalities?: {
        [key: string]: {
          price: string;
          deliveryText: string;
          promo: {
            active: boolean;
            type: string;
            price: string;
            endDate?: Date;
          };
        };
      };
      mainCardPriceType?: string;
    };
    productKind?: string;
    variants?: ProductVariantFormInput[];
  };
  onChange: (updates: any) => void;
}

export function PricingTab({ data, onChange }: PricingTabProps) {
  const pricingData = data.pricing || {};
  const variablePricingStats = summarizeVariantEditor(data.variants || []);

  if (data.productKind === "variable") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
            <CardTitle className="text-lg">Preços por Variante</CardTitle>
            <CardDescription>
              Este produto usa variantes. Os preços vendáveis são definidos na
              aba Variantes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-3 text-emerald-950">
                <p className="text-xs text-gray-500">Menor preço</p>
                <p className="text-lg font-semibold">
                  R$ {(variablePricingStats.minPriceInCents / 100).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border bg-gradient-to-br from-sky-50 to-white p-3 text-sky-950">
                <p className="text-xs text-gray-500">Maior preço</p>
                <p className="text-lg font-semibold">
                  R$ {(variablePricingStats.maxPriceInCents / 100).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <p className="text-xs text-gray-500">Variantes</p>
                <p className="text-lg font-semibold">
                  {variablePricingStats.total}
                </p>
              </div>
              <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-white p-3 text-amber-950">
                <p className="text-xs text-gray-500">Sem preço</p>
                <p className="text-lg font-semibold">
                  {variablePricingStats.missingPrice}
                </p>
              </div>
              <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-white p-3 text-violet-950">
                <p className="text-xs text-gray-500">Padrão</p>
                <p className="truncate text-lg font-semibold">
                  {variablePricingStats.defaultVariant
                    ? variablePricingStats.defaultVariant.name || "Definida"
                    : "Pendente"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Os preços são controlados pelas variantes.
                </p>
                <p className="mt-1 text-xs">
                  Edite cada preço diretamente na tabela da aba Variantes. O
                  preço do produto pai não deve ser usado como fonte principal
                  quando o produto é variável.
                </p>
              </div>
            </div>

            {variablePricingStats.missingPrice > 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                {variablePricingStats.missingPrice} variante(s) ativa(s) ainda
                sem preço.
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Todas as variantes ativas possuem preço.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const initialModalities = {
    stock: {
      price: "",
      deliveryText: "",
      promo: {
        active: false,
        type: "normal",
        price: "",
        endDate: undefined,
      },
    },
    preSale: {
      price: "",
      deliveryText: "",
      promo: {
        active: false,
        type: "normal",
        price: "",
        endDate: undefined,
      },
    },
    dropshipping: {
      price: "",
      deliveryText: "",
      promo: {
        active: false,
        type: "normal",
        price: "",
        endDate: undefined,
      },
    },
    orderBasis: {
      price: "",
      deliveryText: "",
      promo: {
        active: false,
        type: "normal",
        price: "",
        endDate: undefined,
      },
    },
  };

  const modalities = pricingData.modalities || initialModalities;
  const costPrice = pricingData.costPrice || "";

  const { selectedValue, selectValue, isSelected } = useSingleSelection<string>(
    {
      initialValue: pricingData.mainCardPriceType,
    },
  );

  useEffect(() => {
    if (selectedValue !== pricingData.mainCardPriceType) {
      handlePricingChange({ mainCardPriceType: selectedValue });
    }
  }, [selectedValue, pricingData.mainCardPriceType]);

  const calculateMargin = () => {
    const stockPrice = modalities?.stock?.price;
    if (!costPrice || !stockPrice) return "0%";

    const cost = parseFloat(costPrice);
    const sale = parseFloat(stockPrice);
    if (isNaN(cost) || isNaN(sale)) return "0%";

    const margin = ((sale - cost) / cost) * 100;
    return `${margin.toFixed(1)}%`;
  };

  const handlePricingChange = (updates: any) => {
    onChange({
      pricing: { ...pricingData, ...updates },
    });
  };

  const updateModality = (type: string, field: string, value: any) => {
    const updatedModalities = {
      ...modalities,
      [type]: {
        ...modalities[type as keyof typeof modalities],
        [field]: value,
      },
    };
    handlePricingChange({ modalities: updatedModalities });
  };

  const updatePromo = (type: string, field: string, value: any) => {
    const updatedModalities = {
      ...modalities,
      [type]: {
        ...modalities[type as keyof typeof modalities],
        promo: {
          ...modalities[type as keyof typeof modalities].promo,
          [field]: value,
        },
      },
    };
    handlePricingChange({ modalities: updatedModalities });
  };

  const togglePromo = (type: string) => {
    const newActive = !modalities[type as keyof typeof modalities].promo.active;
    updatePromo(type, "active", newActive);
  };

  return (
    <div className="space-y-6">
      {/* CARD CUSTO E MARGEM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custo e Margem</CardTitle>
          <CardDescription>
            Configure o preço de custo para cálculo da margem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid max-w-md grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium">Preço de Custo</Label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500">
                  R$
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) =>
                    handlePricingChange({ costPrice: e.target.value })
                  }
                  className="h-10 border-gray-300 pl-8 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Margem de Lucro</Label>
              <Input
                value={calculateMargin()}
                disabled
                className="h-10 border-gray-300 bg-gray-50 font-medium"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODALIDADES DE VENDA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modalidades de Venda</CardTitle>
          <CardDescription>
            Todas as modalidades disponíveis para este produto
            <br />
            <span className="text-sm text-blue-600">
              • Selecione qual preço aparecerá no card da loja
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ModalityCard
              type="stock"
              label="Estoque Próprio"
              icon={<Package className="h-5 w-5 text-blue-600" />}
              description="Produto em estoque para envio rápido"
              modalities={modalities}
              updateModality={updateModality}
              updatePromo={updatePromo}
              togglePromo={togglePromo}
              isMainCard={isSelected("stock")}
              onSelectMainCard={() => selectValue("stock")}
            />

            <ModalityCard
              type="preSale"
              label="Pré-venda"
              icon={<Calendar className="h-5 w-5 text-purple-600" />}
              description="Venda antecipada com data de entrega futura"
              modalities={modalities}
              updateModality={updateModality}
              updatePromo={updatePromo}
              togglePromo={togglePromo}
              isMainCard={isSelected("preSale")}
              onSelectMainCard={() => selectValue("preSale")}
            />

            <ModalityCard
              type="dropshipping"
              label="Dropshipping"
              icon={<Package className="h-5 w-5 text-green-600" />}
              description="Enviado diretamente pelo fornecedor"
              modalities={modalities}
              updateModality={updateModality}
              updatePromo={updatePromo}
              togglePromo={togglePromo}
              isMainCard={isSelected("dropshipping")}
              onSelectMainCard={() => selectValue("dropshipping")}
            />

            <ModalityCard
              type="orderBasis"
              label="Sob Encomenda"
              icon={<Clock className="h-5 w-5 text-orange-600" />}
              description="Produzido especialmente para o cliente"
              modalities={modalities}
              updateModality={updateModality}
              updatePromo={updatePromo}
              togglePromo={togglePromo}
              isMainCard={isSelected("orderBasis")}
              onSelectMainCard={() => selectValue("orderBasis")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
