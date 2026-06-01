"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Loader2,
  MoreHorizontal,
  Plus,
  Ruler,
  Settings,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Upload,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { buscarResumoLogisticaProduto } from "@/features/admin/logistica/actions/produto-logistica/buscar-resumo-logistica-produto";
import {
  buildVariantSku,
  centsToCurrencyInput,
  createMissingVariants,
  currencyInputToCents,
  getCombinationFormula,
  summarizeVariantEditor,
} from "@/features/products";
import type {
  ProductAttributeInput,
  ProductVariantFormInput,
} from "@/features/products";

import type { ProductFormData } from "../../data/product-form-data";

type VariantsTabProps = {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
  draftKey?: string;
};

type ClassificacaoLogisticaDisponivel = {
  id: string;
  nome: string;
  ativo: boolean | null;
};

type DraftAttribute = {
  name: string;
  value: string;
};

type BulkDraft = {
  price: string;
  stock: string;
};

type VariantsDraft = {
  productKind: ProductFormData["productKind"];
  attributes: ProductAttributeInput[];
  variants: ProductVariantFormInput[];
  savedAt: number;
};

function buildVariantsDraftStorageKey(draftKey: string) {
  return `admin:produto:variantes:rascunho:${draftKey}`;
}

export function clearVariantsDraft(draftKey: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(buildVariantsDraftStorageKey(draftKey));
}

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

function parseDecimalValue(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getVariantKey(variant: ProductVariantFormInput, index: number) {
  return variant.id || `${variant.sku}-${index}`;
}

function hasPositiveValue(value: unknown) {
  return parseDecimalValue(value) !== null;
}

function parentHasCompleteLogistics(data: ProductFormData) {
  const dimensoes = data.dimensoesFreteExterno;
  return Boolean(
    hasPositiveValue(dimensoes?.pesoEmKg) &&
      hasPositiveValue(dimensoes?.alturaEmCm) &&
      hasPositiveValue(dimensoes?.larguraEmCm) &&
      hasPositiveValue(dimensoes?.comprimentoEmCm),
  );
}

function variantHasEffectiveDimensions(
  variant: ProductVariantFormInput,
  data: ProductFormData,
) {
  return Boolean(
    (hasPositiveValue(variant.weightInGrams) ||
      hasPositiveValue(data.dimensoesFreteExterno?.pesoEmKg)) &&
      (hasPositiveValue(variant.heightInCm) ||
        hasPositiveValue(data.dimensoesFreteExterno?.alturaEmCm)) &&
      (hasPositiveValue(variant.widthInCm) ||
        hasPositiveValue(data.dimensoesFreteExterno?.larguraEmCm)) &&
      (hasPositiveValue(variant.lengthInCm) ||
        hasPositiveValue(data.dimensoesFreteExterno?.comprimentoEmCm)),
  );
}

function getVariantStatus(
  variant: ProductVariantFormInput,
  data: ProductFormData,
) {
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

  if (!variantHasEffectiveDimensions(variant, data)) {
    return {
      label: "Sem frete",
      className: "border-sky-200 bg-sky-50 text-sky-700",
      icon: Ruler,
    };
  }

  if (
    !variantHasLogisticsOverride(variant) &&
    parentHasCompleteLogistics(data)
  ) {
    return {
      label: "Herdando",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    };
  }

  return {
    label: "Pronta",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  };
}

function variantHasLogisticsOverride(variant: ProductVariantFormInput) {
  return Boolean(
    hasPositiveValue(variant.weightInGrams) ||
      hasPositiveValue(variant.heightInCm) ||
      hasPositiveValue(variant.widthInCm) ||
      hasPositiveValue(variant.lengthInCm) ||
      (variant.classificacoesLogisticasIds?.length ?? 0) > 0,
  );
}

function getClassificacoesNames(
  ids: string[] | undefined,
  classificacoes: ClassificacaoLogisticaDisponivel[],
) {
  if (!ids?.length) return [];

  return ids.map((id) => {
    const classificacao = classificacoes.find((item) => item.id === id);
    return classificacao?.nome ?? "Classificação removida";
  });
}

function formatWeightFromKg(value: unknown) {
  const kg = parseDecimalValue(value);
  if (!kg) return "Não informado";

  const grams = Math.round(kg * 1000);
  const kgLabel = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 3,
  }).format(kg);

  return `${kgLabel} kg (${grams}g)`;
}

function formatDimensionValue(value: unknown) {
  const parsed = parseDecimalValue(value);
  if (!parsed) return "Não informado";

  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(parsed)}cm`;
}

function formatParentDimensions(data: ProductFormData) {
  const dimensoes = data.dimensoesFreteExterno;
  const partes = [
    dimensoes?.pesoEmKg ? `${dimensoes.pesoEmKg} kg` : null,
    dimensoes?.alturaEmCm ? `${dimensoes.alturaEmCm}A` : null,
    dimensoes?.larguraEmCm ? `${dimensoes.larguraEmCm}L` : null,
    dimensoes?.comprimentoEmCm ? `${dimensoes.comprimentoEmCm}C cm` : null,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" / ") : "Não informado no produto";
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

export function VariantsTab({ data, onChange, draftKey }: VariantsTabProps) {
  const [draftAttribute, setDraftAttribute] = useState<DraftAttribute>({
    name: "",
    value: "",
  });
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [bulkDraft, setBulkDraft] = useState<BulkDraft>({
    price: "",
    stock: "",
  });
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [variantesComUploadEmAndamento, setVariantesComUploadEmAndamento] =
    useState<string[]>([]);
  const [logisticsVariantIndex, setLogisticsVariantIndex] = useState<
    number | null
  >(null);
  const [ownLogisticsVariantKeys, setOwnLogisticsVariantKeys] = useState<
    string[]
  >([]);
  const [classificacoesDisponiveis, setClassificacoesDisponiveis] = useState<
    ClassificacaoLogisticaDisponivel[]
  >([]);
  const restoredDraftRef = useRef(false);

  const attributes = data.attributes || [];
  const variants = data.variants || [];
  const hasVariantsData = attributes.length > 0 || variants.length > 0;
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
  const logisticsVariant =
    logisticsVariantIndex !== null ? variants[logisticsVariantIndex] : null;
  const logisticsVariantKey =
    logisticsVariant && logisticsVariantIndex !== null
      ? getVariantKey(logisticsVariant, logisticsVariantIndex)
      : null;
  const logisticsVariantHasOwnData = logisticsVariant
    ? variantHasLogisticsOverride(logisticsVariant)
    : false;
  const logisticsVariantEditingOwn =
    Boolean(logisticsVariantKey) &&
    (logisticsVariantHasOwnData ||
      ownLogisticsVariantKeys.includes(logisticsVariantKey as string));
  const logisticsVariantInheriting =
    Boolean(logisticsVariant) && !logisticsVariantEditingOwn;
  const parentClassificationNames = getClassificacoesNames(
    data.entrega?.classificacoesLogisticasIds,
    classificacoesDisponiveis,
  );

  useEffect(() => {
    const keysAtuais = new Set(
      variants.map((variant, index) => getVariantKey(variant, index)),
    );
    setPriceDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(prev)) {
        if (keysAtuais.has(key)) next[key] = value;
      }
      return next;
    });
  }, [variants]);

  useEffect(() => {
    async function carregarClassificacoesLogisticas() {
      try {
        const resumo = await buscarResumoLogisticaProduto();
        setClassificacoesDisponiveis(resumo.tiposDisponiveis);
      } catch {
        setClassificacoesDisponiveis([]);
      }
    }
    carregarClassificacoesLogisticas();
  }, []);

  useEffect(() => {
    if (!draftKey || restoredDraftRef.current || hasVariantsData) return;
    if (typeof window === "undefined") return;

    const rawDraft = window.localStorage.getItem(
      buildVariantsDraftStorageKey(draftKey),
    );
    if (!rawDraft) {
      restoredDraftRef.current = true;
      return;
    }

    try {
      const parsedDraft = JSON.parse(rawDraft) as VariantsDraft;
      onChange({
        productKind: parsedDraft.productKind,
        attributes: parsedDraft.attributes,
        variants: parsedDraft.variants,
      });
    } catch {
      window.localStorage.removeItem(buildVariantsDraftStorageKey(draftKey));
    } finally {
      restoredDraftRef.current = true;
    }
  }, [draftKey, hasVariantsData, onChange]);

  useEffect(() => {
    if (!draftKey) return;
    if (typeof window === "undefined") return;

    if (!hasVariantsData) {
      window.localStorage.removeItem(buildVariantsDraftStorageKey(draftKey));
      return;
    }

    const draft: VariantsDraft = {
      productKind: data.productKind,
      attributes,
      variants,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(
      buildVariantsDraftStorageKey(draftKey),
      JSON.stringify(draft),
    );
  }, [attributes, data.productKind, draftKey, hasVariantsData, variants]);

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

  function startOwnLogistics(variantKey: string) {
    setOwnLogisticsVariantKeys((current) =>
      current.includes(variantKey) ? current : [...current, variantKey],
    );
  }

  function resetVariantLogistics(
    variant: ProductVariantFormInput,
    index: number,
    variantKey: string,
  ) {
    updateVariant(variant.id, index, {
      weightInGrams: null,
      heightInCm: null,
      widthInCm: null,
      lengthInCm: null,
      classificacoesLogisticasIds: [],
    });
    setOwnLogisticsVariantKeys((current) =>
      current.filter((key) => key !== variantKey),
    );
  }

  async function uploadImagemVariante(
    arquivo: File,
    variantId: string | undefined,
    index: number,
    variantKey: string,
  ) {
    setVariantesComUploadEmAndamento((prev) =>
      prev.includes(variantKey) ? prev : [...prev, variantKey],
    );

    try {
      const formData = new FormData();
      formData.append("file", arquivo);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro no upload: ${response.statusText}`);
      }

      const payload = await response.json();
      const imageUrl =
        payload?.url ??
        payload?.imageUrl ??
        payload?.data?.url ??
        Object.values(payload ?? {})[0];

      if (typeof imageUrl !== "string" || !imageUrl.trim()) {
        throw new Error("Resposta de upload sem URL válida");
      }

      updateVariant(variantId, index, {
        imageUrl,
      });
    } catch (error) {
      console.error("Erro ao enviar imagem da variante:", error);
      alert("Não foi possível enviar a imagem da variante.");
    } finally {
      setVariantesComUploadEmAndamento((prev) =>
        prev.filter((item) => item !== variantKey),
      );
    }
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
            Edite preço e estoque na tabela. Dados logísticos ficam organizados
            por variante no modal dedicado.
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
                <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-sm">
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
                      <th className="border-b px-3 py-3 text-left">
                        Imagem da variante (opcional)
                      </th>
                      <th className="border-b px-3 py-3 text-left">
                        Combinação
                      </th>
                      <th className="border-b px-3 py-3 text-left">SKU</th>
                      <th className="border-b px-3 py-3 text-right">Preço</th>
                      <th className="border-b px-3 py-3 text-right">Estoque</th>
                      <th className="border-b px-3 py-3 text-left">
                        Logística
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
                      const status = getVariantStatus(variant, data);
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
                            <div className="flex min-w-[140px] items-center gap-2">
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
                              <div className="flex flex-col gap-1">
                                <input
                                  id={`upload-variante-${variantKey}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(event) => {
                                    const arquivo = event.target.files?.[0];
                                    if (!arquivo) return;
                                    void uploadImagemVariante(
                                      arquivo,
                                      variant.id,
                                      index,
                                      variantKey,
                                    );
                                    event.target.value = "";
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(
                                      `upload-variante-${variantKey}`,
                                    ) as HTMLInputElement | null;
                                    input?.click();
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                                  disabled={variantesComUploadEmAndamento.includes(
                                    variantKey,
                                  )}
                                >
                                  {variantesComUploadEmAndamento.includes(
                                    variantKey,
                                  ) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Upload className="h-3 w-3" />
                                  )}
                                  Upload
                                </button>
                                {variant.imageUrl ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateVariant(variant.id, index, {
                                        imageUrl: null,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Remover
                                  </button>
                                ) : null}
                              </div>
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
                              type="text"
                              inputMode="decimal"
                              value={
                                priceDrafts[variantKey] ??
                                centsToCurrencyInput(variant.priceInCents)
                              }
                              placeholder="0,00"
                              onChange={(event) => {
                                const valorDigitado = event.target.value;
                                setPriceDrafts((prev) => ({
                                  ...prev,
                                  [variantKey]: valorDigitado,
                                }));
                                updateVariant(variant.id, index, {
                                  priceInCents:
                                    currencyInputToCents(valorDigitado),
                                });
                              }}
                              onBlur={() =>
                                setPriceDrafts((prev) => {
                                  const {
                                    [variantKey]: _valorRemovido,
                                    ...rest
                                  } = prev;
                                  return rest;
                                })
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  setPriceDrafts((prev) => {
                                    const {
                                      [variantKey]: _valorRemovido,
                                      ...rest
                                    } = prev;
                                    return rest;
                                  });
                                }
                              }}
                              onFocus={() =>
                                setPriceDrafts((prev) => ({
                                  ...prev,
                                  [variantKey]:
                                    prev[variantKey] ??
                                    centsToCurrencyInput(variant.priceInCents),
                                }))
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
                          <td className="border-b border-slate-100 px-3 py-3 align-middle">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => setLogisticsVariantIndex(index)}
                            >
                              <Settings className="h-3.5 w-3.5" />
                              Logística
                              {variantHasLogisticsOverride(variant) ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              ) : null}
                            </Button>
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
                                onClick={() => setLogisticsVariantIndex(index)}
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

      <Dialog
        open={logisticsVariantIndex !== null}
        onOpenChange={(open) => {
          if (!open) setLogisticsVariantIndex(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Logística da variante
            </DialogTitle>
            <DialogDescription>
              Configure apenas quando esta variante precisar sobrescrever os
              dados logísticos do produto principal.
            </DialogDescription>
          </DialogHeader>

          {logisticsVariant && logisticsVariantIndex !== null ? (
            <div className="space-y-6">
              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {logisticsVariant.name || logisticsVariant.sku}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      logisticsVariantInheriting
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-sky-200 bg-sky-50 text-sky-700"
                    }
                  >
                    {logisticsVariantInheriting
                      ? "Usando dados logísticos do produto principal"
                      : "Configuração própria da variante"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(logisticsVariant.attributes || {}).map(
                    ([name, value]) => (
                      <Badge key={name} variant="secondary">
                        {name}: {value}
                      </Badge>
                    ),
                  )}
                </div>
              </div>

              {logisticsVariantInheriting ? (
                <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <h3 className="text-sm font-semibold text-emerald-950">
                    Resumo herdado do produto principal
                  </h3>
                  <dl className="mt-3 grid gap-2 text-sm text-emerald-950 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-emerald-700">
                        Peso
                      </dt>
                      <dd>
                        {formatWeightFromKg(
                          data.dimensoesFreteExterno?.pesoEmKg,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-emerald-700">
                        Altura
                      </dt>
                      <dd>
                        {formatDimensionValue(
                          data.dimensoesFreteExterno?.alturaEmCm,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-emerald-700">
                        Largura
                      </dt>
                      <dd>
                        {formatDimensionValue(
                          data.dimensoesFreteExterno?.larguraEmCm,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-emerald-700">
                        Comprimento
                      </dt>
                      <dd>
                        {formatDimensionValue(
                          data.dimensoesFreteExterno?.comprimentoEmCm,
                        )}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium text-emerald-700">
                        Classificações
                      </dt>
                      <dd>
                        {parentClassificationNames.length > 0
                          ? parentClassificationNames.join(", ")
                          : "Nenhuma classificação no produto principal"}
                      </dd>
                    </div>
                  </dl>
                </section>
              ) : null}

              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Medidas
                  </h3>
                  <p className="text-xs text-slate-500">
                    {logisticsVariantInheriting
                      ? "Campos bloqueados enquanto a variante herda do produto principal."
                      : "Preencha apenas o que esta variante precisa sobrescrever."}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="variante-peso">Peso (g)</Label>
                    <Input
                      id="variante-peso"
                      type="number"
                      min="0"
                      step="1"
                      disabled={logisticsVariantInheriting}
                      placeholder={`Herdando: ${formatWeightFromKg(
                        data.dimensoesFreteExterno?.pesoEmKg,
                      )}`}
                      value={logisticsVariant.weightInGrams ?? ""}
                      className={
                        logisticsVariantInheriting
                          ? "bg-slate-100 text-slate-500"
                          : undefined
                      }
                      onChange={(event) =>
                        updateVariant(
                          logisticsVariant.id,
                          logisticsVariantIndex,
                          {
                            weightInGrams: event.target.value,
                          },
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variante-altura">Altura (cm)</Label>
                    <Input
                      id="variante-altura"
                      type="number"
                      min="0"
                      step="1"
                      disabled={logisticsVariantInheriting}
                      placeholder={`Herdando: ${formatDimensionValue(
                        data.dimensoesFreteExterno?.alturaEmCm,
                      )}`}
                      value={logisticsVariant.heightInCm ?? ""}
                      className={
                        logisticsVariantInheriting
                          ? "bg-slate-100 text-slate-500"
                          : undefined
                      }
                      onChange={(event) =>
                        updateVariant(
                          logisticsVariant.id,
                          logisticsVariantIndex,
                          {
                            heightInCm: event.target.value,
                          },
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variante-largura">Largura (cm)</Label>
                    <Input
                      id="variante-largura"
                      type="number"
                      min="0"
                      step="1"
                      disabled={logisticsVariantInheriting}
                      placeholder={`Herdando: ${formatDimensionValue(
                        data.dimensoesFreteExterno?.larguraEmCm,
                      )}`}
                      value={logisticsVariant.widthInCm ?? ""}
                      className={
                        logisticsVariantInheriting
                          ? "bg-slate-100 text-slate-500"
                          : undefined
                      }
                      onChange={(event) =>
                        updateVariant(
                          logisticsVariant.id,
                          logisticsVariantIndex,
                          {
                            widthInCm: event.target.value,
                          },
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variante-comprimento">
                      Comprimento (cm)
                    </Label>
                    <Input
                      id="variante-comprimento"
                      type="number"
                      min="0"
                      step="1"
                      disabled={logisticsVariantInheriting}
                      placeholder={`Herdando: ${formatDimensionValue(
                        data.dimensoesFreteExterno?.comprimentoEmCm,
                      )}`}
                      value={logisticsVariant.lengthInCm ?? ""}
                      className={
                        logisticsVariantInheriting
                          ? "bg-slate-100 text-slate-500"
                          : undefined
                      }
                      onChange={(event) =>
                        updateVariant(
                          logisticsVariant.id,
                          logisticsVariantIndex,
                          {
                            lengthInCm: event.target.value,
                          },
                        )
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Classificação logística
                  </h3>
                  <p className="text-xs text-slate-500">
                    {logisticsVariantInheriting
                      ? "As classificações abaixo ficam bloqueadas enquanto a variante herda do produto."
                      : "Marque apenas as classificações próprias desta variante."}
                  </p>
                </div>

                {classificacoesDisponiveis.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-sm text-slate-500">
                    Nenhuma classificação logística disponível.
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {classificacoesDisponiveis.map((classificacao) => {
                      const selecionada = (
                        logisticsVariant.classificacoesLogisticasIds ?? []
                      ).includes(classificacao.id);

                      return (
                        <label
                          key={classificacao.id}
                          className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
                            !logisticsVariantInheriting && classificacao.ativo
                              ? "bg-white"
                              : "bg-slate-50 text-slate-400"
                          }`}
                        >
                          <Checkbox
                            checked={selecionada}
                            disabled={
                              logisticsVariantInheriting || !classificacao.ativo
                            }
                            onCheckedChange={(checked) => {
                              const atuais =
                                logisticsVariant.classificacoesLogisticasIds ??
                                [];
                              updateVariant(
                                logisticsVariant.id,
                                logisticsVariantIndex,
                                {
                                  classificacoesLogisticasIds: checked
                                    ? Array.from(
                                        new Set([...atuais, classificacao.id]),
                                      )
                                    : atuais.filter(
                                        (id) => id !== classificacao.id,
                                      ),
                                },
                              );
                            }}
                          />
                          <span>{classificacao.nome}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-sky-100 bg-sky-50 p-4">
                <h3 className="text-sm font-semibold text-sky-950">
                  Resumo operacional
                </h3>
                <div className="mt-2 space-y-1 text-sm text-sky-900">
                  <p>
                    {logisticsVariantInheriting
                      ? "Esta variante usará o fallback logístico do produto principal."
                      : "Esta variante possui configuração logística própria."}
                  </p>
                  <p>
                    Produto principal:{" "}
                    <span className="font-medium">
                      {formatParentDimensions(data)}
                    </span>
                    .
                  </p>
                  <p>
                    Classificações do produto principal:{" "}
                    <span className="font-medium">
                      {(data.entrega?.classificacoesLogisticasIds?.length ??
                        0) > 0
                        ? `${data.entrega?.classificacoesLogisticasIds?.length} selecionada(s)`
                        : "nenhuma"}
                    </span>
                    .
                  </p>
                </div>
              </section>

              <div className="flex justify-between gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!logisticsVariantKey) return;
                    if (logisticsVariantInheriting) {
                      startOwnLogistics(logisticsVariantKey);
                      return;
                    }
                    resetVariantLogistics(
                      logisticsVariant,
                      logisticsVariantIndex,
                      logisticsVariantKey,
                    );
                  }}
                >
                  {logisticsVariantInheriting
                    ? "Usar dados próprios"
                    : "Herdar do produto"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setLogisticsVariantIndex(null)}
                >
                  Concluir
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
