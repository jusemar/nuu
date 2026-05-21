"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  DollarSign,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Info,
  Layers,
  MoreHorizontal,
  Package,
  Plus,
  Ruler,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  buildVariantSku,
  centsToCurrencyInput,
  createMissingVariants,
  currencyInputToCents,
  getCombinationFormula,
  summarizeVariantEditor,
  variantHasCompleteDimensions,
} from "@/features/products";
import type {
  ProductAttributeInput,
  ProductVariantFormInput,
} from "@/features/products";

import type { ProductFormData } from "../../data/product-form-data";

type VariantsTabProps = {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
};

type DraftAttribute = {
  name: string;
  value: string;
};

type BulkDraft = {
  price: string;
  stock: string;
  weight: string;
  height: string;
  width: string;
  length: string;
};

function formatPrice(cents: number) {
  if (!cents) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function toNullableInteger(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function getVariantKey(variant: ProductVariantFormInput, index: number) {
  return variant.id || `${variant.sku}-${index}`;
}

function getVariantStatus(variant: ProductVariantFormInput) {
  if (!variant.isActive) {
    return {
      label: "Inativa",
      className: "border-slate-200 bg-slate-100 text-slate-600",
      icon: EyeOff,
    };
  }

  if (!variant.sku.trim() || !Number(variant.priceInCents || 0)) {
    return {
      label: "Incompleta",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      icon: AlertTriangle,
    };
  }

  if (Number(variant.stockQuantity ?? 0) <= 0) {
    return {
      label: "Sem estoque",
      className: "border-rose-200 bg-rose-50 text-rose-700",
      icon: Box,
    };
  }

  if (!variantHasCompleteDimensions(variant)) {
    return {
      label: "Sem frete",
      className: "border-sky-200 bg-sky-50 text-sky-700",
      icon: Ruler,
    };
  }

  return {
    label: "Pronta",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  };
}

function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "green" | "amber" | "rose" | "blue" | "violet";
}) {
  const tones = {
    slate: "from-slate-50 to-white text-slate-900",
    green: "from-emerald-50 to-white text-emerald-900",
    amber: "from-amber-50 to-white text-amber-900",
    rose: "from-rose-50 to-white text-rose-900",
    blue: "from-sky-50 to-white text-sky-900",
    violet: "from-violet-50 to-white text-violet-900",
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-gradient-to-br p-3 ${tones[tone]}`}
    >
      <p className="text-[11px] font-medium tracking-wide uppercase opacity-70">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function ValueChip({
  value,
  onRemove,
}: {
  value: string;
  onRemove: () => void;
}) {
  return (
    <span className="group inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pr-1 pl-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300">
      {value}
      <button
        type="button"
        onClick={onRemove}
        className="grid h-4 w-4 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function VariantsTab({ data, onChange }: VariantsTabProps) {
  const [draftAttribute, setDraftAttribute] = useState<DraftAttribute>({
    name: "",
    value: "",
  });
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [bulkDraft, setBulkDraft] = useState<BulkDraft>({
    price: "",
    stock: "",
    weight: "",
    height: "",
    width: "",
    length: "",
  });

  const attributes = data.attributes || [];
  const variants = data.variants || [];
  const summary = useMemo(() => summarizeVariantEditor(variants), [variants]);
  const formula = useMemo(
    () => getCombinationFormula(attributes),
    [attributes],
  );
  const possibleNewVariants = useMemo(
    () =>
      createMissingVariants({
        baseSku: data.sku,
        attributes,
        variants,
      }),
    [attributes, data.sku, variants],
  );

  const selectedVariants = variants.filter((variant, index) =>
    selectedVariantIds.includes(getVariantKey(variant, index)),
  );
  const allSelected =
    variants.length > 0 && selectedVariantIds.length === variants.length;

  function updateAttributes(nextAttributes: ProductAttributeInput[]) {
    onChange({ attributes: nextAttributes });
  }

  function updateVariants(nextVariants: ProductVariantFormInput[]) {
    onChange({ variants: nextVariants });
  }

  function updateVariant(
    variantId: string | undefined,
    index: number,
    updates: Partial<ProductVariantFormInput>,
  ) {
    updateVariants(
      variants.map((variant, currentIndex) =>
        currentIndex === index && variant.id === variantId
          ? { ...variant, ...updates }
          : variant,
      ),
    );
  }

  function addAttribute() {
    const name = draftAttribute.name.trim();
    const value = draftAttribute.value.trim();
    if (!name || !value) return;

    const existingAttribute = attributes.find(
      (attribute) => attribute.name.toLowerCase() === name.toLowerCase(),
    );

    if (existingAttribute) {
      updateAttributes(
        attributes.map((attribute) =>
          attribute === existingAttribute
            ? {
                ...attribute,
                values: Array.from(new Set([...attribute.values, value])),
              }
            : attribute,
        ),
      );
    } else {
      updateAttributes([
        ...attributes,
        {
          id: `attr-${Date.now()}`,
          name,
          values: [value],
        },
      ]);
    }

    setDraftAttribute({ name: "", value: "" });
  }

  function addAttributeValue(attributeId: string) {
    const value = draftValues[attributeId]?.trim();
    if (!value) return;

    updateAttributes(
      attributes.map((attribute) =>
        attribute.id === attributeId
          ? {
              ...attribute,
              values: Array.from(new Set([...attribute.values, value])),
            }
          : attribute,
      ),
    );
    setDraftValues((current) => ({ ...current, [attributeId]: "" }));
  }

  function generateVariants() {
    if (possibleNewVariants.length === 0) return;
    updateVariants([...variants, ...possibleNewVariants]);
  }

  function toggleVariantSelection(variantId: string) {
    setSelectedVariantIds((current) =>
      current.includes(variantId)
        ? current.filter((id) => id !== variantId)
        : [...current, variantId],
    );
  }

  function applyBulkUpdate(updates: Partial<ProductVariantFormInput>) {
    if (selectedVariantIds.length === 0) return;

    updateVariants(
      variants.map((variant, index) =>
        selectedVariantIds.includes(getVariantKey(variant, index))
          ? { ...variant, ...updates }
          : variant,
      ),
    );
  }

  function applyBulkSku() {
    if (selectedVariantIds.length === 0) return;

    updateVariants(
      variants.map((variant, index) =>
        selectedVariantIds.includes(getVariantKey(variant, index))
          ? {
              ...variant,
              sku: buildVariantSku(data.sku, variant.attributes || {}),
            }
          : variant,
      ),
    );
  }

  if (data.productKind !== "variable") {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Variantes
          </CardTitle>
          <CardDescription>
            Ative produto com variantes para cadastrar combinações vendáveis.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-sm">
              <Layers className="h-5 w-5 text-slate-500" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              Produto simples ativo
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              O produto simples continua usando preço, SKU, estoque e dimensões
              do produto pai.
            </p>
            <Button
              type="button"
              className="mt-4 bg-slate-900 hover:bg-slate-800"
              onClick={() => onChange({ productKind: "variable" })}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Ativar produto com variantes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="h-5 w-5" />
                  Variantes do produto
                </CardTitle>
                <Badge className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50">
                  Produto variável
                </Badge>
              </div>
              <CardDescription className="mt-1">
                Cada variante é um item vendável com SKU, preço, estoque, peso,
                dimensões, imagem e status próprios.
              </CardDescription>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-slate-500" />
                <span>
                  Preço, SKU, estoque, peso e dimensões são controlados pelas
                  variantes.
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
            <StatCard label="Variantes" value={summary.total} />
            <StatCard label="Ativas" value={summary.active} tone="green" />
            <StatCard
              label="Sem preço"
              value={summary.missingPrice}
              tone={summary.missingPrice ? "amber" : "slate"}
            />
            <StatCard
              label="Sem estoque"
              value={summary.missingStock}
              tone={summary.missingStock ? "amber" : "slate"}
            />
            <StatCard
              label="Sem dimensões"
              value={summary.missingDimensions}
              tone={summary.missingDimensions ? "rose" : "slate"}
            />
            <StatCard
              label="Padrão"
              value={
                summary.defaultVariant
                  ? summary.defaultVariant.name || "Definida"
                  : "Pendente"
              }
              tone={summary.defaultVariant ? "violet" : "amber"}
            />
          </div>

          {summary.issues.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500 text-white">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-950">
                    Existem pendências antes de publicar este produto variável
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {summary.issues.map((issue) => (
                      <Badge
                        key={issue.type}
                        variant="outline"
                        className="border-amber-200 bg-white text-amber-800"
                      >
                        {issue.count} {issue.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              Estrutura mínima das variantes está completa.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Atributos</CardTitle>
              <CardDescription>
                Defina atributos específicos deste produto, como cor, tamanho,
                voltagem, sabor ou modelo.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateAttributes([
                  ...attributes,
                  {
                    id: `attr-${Date.now()}`,
                    name: "Novo atributo",
                    values: [],
                  },
                ])
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar atributo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <Label>Nome do atributo</Label>
              <Input
                placeholder="Ex: Cor"
                value={draftAttribute.name}
                onChange={(event) =>
                  setDraftAttribute((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Primeiro valor</Label>
              <Input
                placeholder="Ex: Preto"
                value={draftAttribute.value}
                onChange={(event) =>
                  setDraftAttribute((current) => ({
                    ...current,
                    value: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addAttribute();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={addAttribute}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>

          {attributes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-sm">
                <Layers className="h-5 w-5 text-slate-500" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                Sem atributos ainda
              </h3>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Comece adicionando um atributo como Cor, Tamanho ou Voltagem.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attributes.map((attribute) => (
                <div
                  key={attribute.id}
                  className="group rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-slate-400 shadow-sm">
                      <Tag className="h-4 w-4" />
                    </div>
                    <Input
                      value={attribute.name}
                      placeholder="Nome do atributo"
                      onChange={(event) =>
                        updateAttributes(
                          attributes.map((item) =>
                            item.id === attribute.id
                              ? { ...item, name: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="border-transparent bg-transparent text-sm font-semibold shadow-none focus-visible:ring-0"
                    />
                    <Badge variant="secondary" className="shrink-0">
                      {attribute.values.length} valores
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateAttributes(
                          attributes.filter((item) => item.id !== attribute.id),
                        )
                      }
                      className="opacity-70 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 pl-11">
                    {attribute.values.map((value) => (
                      <ValueChip
                        key={value}
                        value={value}
                        onRemove={() =>
                          updateAttributes(
                            attributes.map((item) =>
                              item.id === attribute.id
                                ? {
                                    ...item,
                                    values: item.values.filter(
                                      (itemValue) => itemValue !== value,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    ))}
                    <Input
                      placeholder="Adicionar valor + Enter"
                      value={draftValues[attribute.id || ""] || ""}
                      onChange={(event) =>
                        setDraftValues((current) => ({
                          ...current,
                          [attribute.id || ""]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addAttributeValue(attribute.id || "");
                        }
                      }}
                      className="h-8 w-48 rounded-full border-dashed bg-transparent text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white">
                <Wand2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {formula.total} combinações possíveis
                </p>
                <p className="text-[11px] text-slate-500">{formula.label}</p>
                {variants.length > 0 ? (
                  <p className="mt-1 text-[11px] text-amber-600">
                    Alterações nos atributos não apagam variantes existentes;
                    apenas combinações faltantes serão criadas.
                  </p>
                ) : null}
              </div>
            </div>
            <Button
              type="button"
              className="bg-slate-900 hover:bg-slate-800"
              disabled={possibleNewVariants.length === 0}
              onClick={generateVariants}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar combinações
              {possibleNewVariants.length > 0
                ? ` (${possibleNewVariants.length})`
                : ""}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="border-b">
          <CardTitle>Variantes geradas</CardTitle>
          <CardDescription>
            Edite preço, estoque, peso e dimensões inline. Use ações em massa
            para acelerar cadastros grandes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {variants.length === 0 ? (
            <div className="m-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
              <Sparkles className="h-6 w-6 text-slate-400" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Nenhuma variante gerada
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Defina atributos acima e clique em Gerar combinações.
              </p>
            </div>
          ) : (
            <>
              <div
                className={`flex flex-wrap items-center gap-2 border-b px-4 py-3 text-xs transition ${
                  selectedVariantIds.length > 0
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-100 bg-slate-50/70 text-slate-600"
                }`}
              >
                {selectedVariantIds.length > 0 ? (
                  <>
                    <span className="font-semibold">
                      {selectedVariantIds.length} selecionada(s)
                    </span>
                    <div className="mx-1 hidden h-4 w-px bg-white/20 md:block" />
                    <Input
                      placeholder="Preço"
                      value={bulkDraft.price}
                      onChange={(event) =>
                        setBulkDraft((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                      className="h-8 w-24 border-white/20 bg-white/10 text-white placeholder:text-white/60"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        applyBulkUpdate({
                          priceInCents: currencyInputToCents(bulkDraft.price),
                        })
                      }
                    >
                      <DollarSign className="mr-1 h-3.5 w-3.5" />
                      Aplicar preço
                    </Button>
                    <Input
                      placeholder="Estoque"
                      value={bulkDraft.stock}
                      onChange={(event) =>
                        setBulkDraft((current) => ({
                          ...current,
                          stock: event.target.value,
                        }))
                      }
                      className="h-8 w-24 border-white/20 bg-white/10 text-white placeholder:text-white/60"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        applyBulkUpdate({
                          stockQuantity:
                            toNullableInteger(bulkDraft.stock) ?? 0,
                        })
                      }
                    >
                      <Box className="mr-1 h-3.5 w-3.5" />
                      Aplicar estoque
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        applyBulkUpdate({
                          weightInGrams: toNullableInteger(bulkDraft.weight),
                          heightInCm: toNullableInteger(bulkDraft.height),
                          widthInCm: toNullableInteger(bulkDraft.width),
                          lengthInCm: toNullableInteger(bulkDraft.length),
                        })
                      }
                    >
                      <Ruler className="mr-1 h-3.5 w-3.5" />
                      Aplicar peso/dimensões
                    </Button>
                    <div className="grid grid-cols-4 gap-1">
                      {(["weight", "height", "width", "length"] as const).map(
                        (field) => (
                          <Input
                            key={field}
                            placeholder={
                              field === "weight"
                                ? "g"
                                : field === "height"
                                  ? "A"
                                  : field === "width"
                                    ? "L"
                                    : "C"
                            }
                            value={bulkDraft[field]}
                            onChange={(event) =>
                              setBulkDraft((current) => ({
                                ...current,
                                [field]: event.target.value,
                              }))
                            }
                            className="h-8 w-14 border-white/20 bg-white/10 text-center text-white placeholder:text-white/60"
                          />
                        ),
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={applyBulkSku}
                    >
                      <Wand2 className="mr-1 h-3.5 w-3.5" />
                      Gerar SKUs
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => applyBulkUpdate({ isActive: true })}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Ativar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => applyBulkUpdate({ isActive: false })}
                    >
                      <EyeOff className="mr-1 h-3.5 w-3.5" />
                      Desativar
                    </Button>
                    <button
                      type="button"
                      onClick={() => setSelectedVariantIds([])}
                      className="ml-auto rounded px-2 py-1 text-white/70 hover:bg-white/10"
                    >
                      Limpar seleção
                    </button>
                  </>
                ) : (
                  <>
                    <span>{variants.length} variantes geradas</span>
                    <div className="mx-1 h-4 w-px bg-slate-200" />
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {summary.active} ativas
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {summary.issues.length} tipos de pendência
                    </span>
                    <span className="ml-auto hidden text-slate-400 lg:inline">
                      Ações em massa aparecem ao selecionar variantes.
                    </span>
                  </>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1280px] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] tracking-wide text-slate-500 uppercase">
                      <th className="border-b px-4 py-3 text-left">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(checked) =>
                            setSelectedVariantIds(
                              checked
                                ? variants.map((variant, index) =>
                                    getVariantKey(variant, index),
                                  )
                                : [],
                            )
                          }
                        />
                      </th>
                      <th className="border-b px-3 py-3 text-left">Padrão</th>
                      <th className="border-b px-3 py-3 text-left">Imagem</th>
                      <th className="border-b px-3 py-3 text-left">
                        Combinação
                      </th>
                      <th className="border-b px-3 py-3 text-left">SKU</th>
                      <th className="border-b px-3 py-3 text-right">Preço</th>
                      <th className="border-b px-3 py-3 text-right">Estoque</th>
                      <th className="border-b px-3 py-3 text-right">
                        Peso (g)
                      </th>
                      <th className="border-b px-3 py-3 text-right">
                        A/L/C (cm)
                      </th>
                      <th className="border-b px-3 py-3 text-left">Status</th>
                      <th className="border-b px-3 py-3 text-right">Ativo</th>
                      <th className="border-b px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, index) => {
                      const variantKey = getVariantKey(variant, index);
                      const selected = selectedVariantIds.includes(variantKey);
                      const status = getVariantStatus(variant);
                      const StatusIcon = status.icon;

                      return (
                        <tr
                          key={variantKey}
                          className={`group transition ${
                            selected
                              ? "bg-slate-900/[0.03]"
                              : "hover:bg-slate-50/80"
                          } ${variant.isDefault ? "shadow-[inset_3px_0_0_#f59e0b]" : ""}`}
                        >
                          <td className="border-b border-slate-100 px-4 py-3 align-middle">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() =>
                                toggleVariantSelection(variantKey)
                              }
                            />
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 align-middle">
                            <button
                              type="button"
                              onClick={() =>
                                updateVariants(
                                  variants.map((item, itemIndex) => ({
                                    ...item,
                                    isDefault: itemIndex === index,
                                  })),
                                )
                              }
                              className={`grid h-8 w-8 place-items-center rounded-md transition ${
                                variant.isDefault
                                  ? "bg-amber-50 text-amber-500"
                                  : "text-slate-300 hover:bg-slate-100 hover:text-amber-500"
                              }`}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  variant.isDefault ? "fill-amber-400" : ""
                                }`}
                              />
                            </button>
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 align-middle">
                            <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
                              {variant.imageUrl ? (
                                <img
                                  src={variant.imageUrl}
                                  alt={variant.name || variant.sku}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-slate-400">
                                  <ImageIcon className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 align-middle">
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(variant.attributes || {}).map(
                                  ([name, value]) => (
                                    <span
                                      key={name}
                                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700"
                                    >
                                      <span className="text-slate-400">
                                        {name}:
                                      </span>
                                      {value}
                                    </span>
                                  ),
                                )}
                              </div>
                              {variant.isDefault ? (
                                <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                                  Variante padrão
                                </Badge>
                              ) : null}
                            </div>
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 align-middle">
                            <Input
                              value={variant.sku}
                              onChange={(event) =>
                                updateVariant(variant.id, index, {
                                  sku: event.target.value,
                                })
                              }
                              className="h-9 font-mono text-xs"
                            />
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 text-right align-middle">
                            <Input
                              value={centsToCurrencyInput(variant.priceInCents)}
                              placeholder="0,00"
                              onChange={(event) =>
                                updateVariant(variant.id, index, {
                                  priceInCents: currencyInputToCents(
                                    event.target.value,
                                  ),
                                })
                              }
                              className="h-9 text-right"
                            />
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 text-right align-middle">
                            <Input
                              type="number"
                              value={variant.stockQuantity ?? ""}
                              onChange={(event) =>
                                updateVariant(variant.id, index, {
                                  stockQuantity: event.target.value,
                                })
                              }
                              className="h-9 text-right"
                            />
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 text-right align-middle">
                            <Input
                              type="number"
                              value={variant.weightInGrams ?? ""}
                              onChange={(event) =>
                                updateVariant(variant.id, index, {
                                  weightInGrams: event.target.value,
                                })
                              }
                              className="h-9 text-right"
                            />
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 text-right align-middle">
                            <div className="grid grid-cols-3 gap-1">
                              <Input
                                type="number"
                                value={variant.heightInCm ?? ""}
                                onChange={(event) =>
                                  updateVariant(variant.id, index, {
                                    heightInCm: event.target.value,
                                  })
                                }
                                className="h-9 text-center"
                              />
                              <Input
                                type="number"
                                value={variant.widthInCm ?? ""}
                                onChange={(event) =>
                                  updateVariant(variant.id, index, {
                                    widthInCm: event.target.value,
                                  })
                                }
                                className="h-9 text-center"
                              />
                              <Input
                                type="number"
                                value={variant.lengthInCm ?? ""}
                                onChange={(event) =>
                                  updateVariant(variant.id, index, {
                                    lengthInCm: event.target.value,
                                  })
                                }
                                className="h-9 text-center"
                              />
                            </div>
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 align-middle">
                            <Badge
                              variant="outline"
                              className={`gap-1 ${status.className}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 text-right align-middle">
                            <Switch
                              checked={variant.isActive}
                              onCheckedChange={(checked) =>
                                updateVariant(variant.id, index, {
                                  isActive: checked,
                                })
                              }
                            />
                          </td>
                          <td className="border-b border-slate-100 px-4 py-3 text-right align-middle">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="opacity-70 group-hover:opacity-100"
                                onClick={() =>
                                  updateVariant(variant.id, index, {
                                    imageUrl: variant.imageUrl || "",
                                  })
                                }
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-rose-600 opacity-70 group-hover:opacity-100 hover:bg-rose-50"
                                onClick={() =>
                                  updateVariants(
                                    variants.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-4 py-3 text-xs text-slate-500">
                <span>
                  Mostrando {variants.length} de {variants.length} variantes
                </span>
                <span>
                  {selectedVariants.length > 0
                    ? `${selectedVariants.length} selecionada(s)`
                    : `${attributes.length} atributos configurados`}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
