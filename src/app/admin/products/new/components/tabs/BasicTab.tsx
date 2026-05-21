// src/app/admin/products/new/components/tabs/BasicTab.tsx
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Box,
  CheckCircle2,
  DollarSign,
  Info,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Ruler,
  Tag,
  X,
} from "lucide-react";
import { useCategories } from "@/hooks/admin/queries/use-categories";
import { useSlugGenerator } from "@/hooks/forms/useSlugGenerator";
import { useSkuGenerator } from "@/hooks/forms/useSkuGenerator";
import {
  ProductImageGallery,
  UploadedImage,
} from "../image-upload/ProductImageGallery";
import { StoreProductFlags } from "@/components/admin/store-product-flags";
import { CategoryTreeSelector } from "@/features/admin/products/components/CategoryTreeSelector";
import type { ProductKind } from "@/features/products";

interface BasicTabProps {
  data: {
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    brand: string;
    sku: string;
    isActive: boolean;
    collection: string;
    tags: string[];
    productKind: ProductKind;
    productType: string;
    productCode: string;
    ncmCode: string;
    images?: UploadedImage[];
    cardShortText: string;
    storeProductFlags: string[];
  };
  onChange: (updates: any) => void;
}

export function BasicTab({ data, onChange }: BasicTabProps) {
  const { data: categories, isLoading } = useCategories();
  const { generateSlug } = useSlugGenerator();
  const { generateSku } = useSkuGenerator();
  const [tagInput, setTagInput] = useState("");

  // Geração automática do SKU
  useEffect(() => {
    if (data.categoryId && data.brand && !data.sku) {
      const newSku = generateSku({
        categoryId: data.categoryId,
        categoryName: categories?.find((cat) => cat.id === data.categoryId)
          ?.name,
        brand: data.brand,
      });
      onChange({ sku: newSku });
    }
  }, [
    data.categoryId,
    data.brand,
    data.sku,
    categories,
    generateSku,
    onChange,
  ]);

  const addTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    e.preventDefault();
    if (tagInput.trim() && !data.tags.includes(tagInput.trim())) {
      onChange({ tags: [...data.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange({ tags: data.tags.filter((tag) => tag !== tagToRemove) });
  };

  const handleImagesChange = (images: UploadedImage[]) => {
    onChange({ images });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* CARD INFORMAÇÕES PRINCIPAIS */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
              <CardDescription>
                Dados essenciais para identificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    placeholder="Smartphone Galaxy Pro"
                    value={data.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      onChange({
                        name: name,
                        slug: generateSlug(name),
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="smartphone-pro"
                    value={data.slug}
                    onChange={(e) => onChange({ slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {/* 🆕 SEÇÕES DA LOJA - NOVA SEÇÃO */}
                <StoreProductFlags
                  value={data.storeProductFlags || []}
                  onChange={(flags) => onChange({ storeProductFlags: flags })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="cardShortText">Descrição Curta para Card</Label>
                <div className="space-y-1">
                  <Input
                    id="cardShortText"
                    placeholder="Breve descrição para o card do produto (máx. 80 caracteres)"
                    value={data.cardShortText || ""}
                    onChange={(e) =>
                      onChange({ cardShortText: e.target.value })
                    }
                    maxLength={80}
                    className="text-sm"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Usado no card da loja</span>
                    <span>{data.cardShortText?.length || 0}/80</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <RichTextEditor
                  value={data.description}
                  onChange={(value) => onChange({ description: value })}
                  placeholder="Descreva as características principais do produto..."
                />
              </div>
            </CardContent>
          </Card>

          {/* GALERIA DE IMAGENS */}
          <ProductImageGallery
            onImagesChange={handleImagesChange}
            maxFiles={10}
            initialImages={data.images}
          />
        </div>

        {/* COLUNA LATERAL */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="archived" className="text-sm font-medium">
                    Arquivado
                  </Label>
                  <p className="text-xs text-gray-500">
                    Produto removido do catálogo
                  </p>
                </div>
                <Switch
                  id="archived"
                  checked={!data.isActive}
                  onCheckedChange={(checked) =>
                    onChange({ isActive: !checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    value={data.sku}
                    onChange={(e) => onChange({ sku: e.target.value })}
                    className="flex-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newSku = generateSku({
                        categoryId: data.categoryId,
                        categoryName: categories?.find(
                          (cat) => cat.id === data.categoryId,
                        )?.name,
                        brand: data.brand,
                      });
                      onChange({ sku: newSku });
                    }}
                    className="rounded-md border border-gray-300 px-2 transition-colors hover:bg-gray-50"
                    title="Gerar novo SKU"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <CategoryTreeSelector
                  value={data.categoryId}
                  onChange={(categoryId) => onChange({ categoryId })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  placeholder="Samsung, Nike, Apple..."
                  value={data.brand}
                  onChange={(e) => onChange({ brand: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection">Coleção</Label>
                <Input
                  id="collection"
                  placeholder="Verão 2024, Black Friday..."
                  value={data.collection}
                  onChange={(e) => onChange({ collection: e.target.value })}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipo de Produto</CardTitle>
              <CardDescription>
                Define onde preço, SKU, estoque e dimensões serão controlados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    value: "simple" as const,
                    icon: Package,
                    title: "Produto simples",
                    description:
                      "Um único item vendável com preço, estoque e dimensões próprios.",
                    items: ["1 SKU", "1 preço", "1 estoque"],
                  },
                  {
                    value: "variable" as const,
                    icon: Layers,
                    title: "Produto com variantes",
                    description:
                      "Cada combinação vendável controla SKU, preço, estoque e dimensões.",
                    items: [
                      "SKU por variante",
                      "preço por variante",
                      "dimensões por variante",
                    ],
                  },
                ].map((option) => {
                  const active = data.productKind === option.value;
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange({ productKind: option.value })}
                      className={`relative rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-slate-900 bg-slate-900/[0.02] shadow-[0_0_0_4px_rgba(15,23,42,0.04)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition ${
                              active
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {option.title}
                              </p>
                              {active ? (
                                <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-900 text-white">
                                  <CheckCircle2 className="h-3 w-3" />
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {option.items.map((item) => (
                          <Badge
                            key={item}
                            variant="secondary"
                            className="text-[11px]"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {data.productKind === "variable" ? (
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-white">
                      <Info className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Controlado pelas variantes
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Este produto usa variantes. Preço, SKU, estoque, peso e
                        dimensões são definidos em cada variante.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { label: "Preço", icon: DollarSign },
                          { label: "Estoque", icon: Box },
                          { label: "SKU", icon: Tag },
                          { label: "Peso", icon: Ruler },
                          { label: "Dimensões", icon: Ruler },
                        ].map((item) => (
                          <span
                            key={item.label}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600"
                          >
                            <item.icon className="h-3 w-3 text-slate-400" />
                            {item.label}
                            <span className="text-slate-300">→</span>
                            <span className="text-slate-900">por variante</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag(e)}
                    className="flex-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="rounded-md bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
                    title="Adicionar tag"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {data.tags.length > 0 && (
                  <div className="flex min-h-[60px] flex-wrap gap-2 rounded-lg border bg-gray-50 p-3">
                    {data.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1 py-1 text-xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-500 transition-colors hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <p>
                  <Label htmlFor="ncmCode">Código NCM</Label>
                </p>
                <Input
                  id="ncmCode"
                  placeholder="8517.12.00"
                  value={data.ncmCode}
                  onChange={(e) => onChange({ ncmCode: e.target.value })}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
