"use client";

import { AlertTriangle, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BasicTab } from "@/app/admin/products/new/components/tabs/BasicTab";
import { EntregaTab } from "@/app/admin/products/new/components/tabs/EntregaTab";
import { PricingTab } from "@/app/admin/products/new/components/tabs/PricingTab";
import { SellerTab } from "@/app/admin/products/new/components/tabs/SellerTab";
import { SeoTab } from "@/app/admin/products/new/components/tabs/SeoTab";
import { VariantsTab } from "@/app/admin/products/new/components/tabs/VariantsTab";
import { WarrantyTab } from "@/app/admin/products/new/components/tabs/WarrantyTab";
import {
  type ProductFormData,
  initialProductData,
} from "@/app/admin/products/new/data/product-form-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShippingTab } from "@/features/admin/products/components/ShippingTab";
import type { ProductKind } from "@/features/products";

export type DadosFornecedorParaRascunhoProduto = {
  id: string;
  nome: string;
  codigo?: string | null;
  ean?: string | null;
  ncm?: string | null;
  preco?: string | null;
  estoque?: number | null;
  imagens?: string[];
  pesoBruto?: string | null;
  alturaCaixa?: string | null;
  larguraCaixa?: string | null;
  comprimentoCaixa?: string | null;
  complemento?: string | null;
};

type ModalRascunhoProdutoFornecedorProps = {
  aberto: boolean;
  item: DadosFornecedorParaRascunhoProduto | null;
  dadosSalvos?: ProductFormData | null;
  aoAlterarAbertura: (aberto: boolean) => void;
  aoSalvarRascunho: (dados: ProductFormData) => void;
};

function gerarSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizarPreco(valor?: string | null) {
  if (!valor) return "";

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero.toFixed(2) : "";
}

function converterPrecoParaCentavos(valor?: string | null) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
}

function converterKgParaGramas(valor?: string | null) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.round(numero * 1000) : null;
}

function converterMedida(valor?: string | null) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.round(numero) : null;
}

function montarDadosIniciais(
  item: DadosFornecedorParaRascunhoProduto | null,
  dadosSalvos?: ProductFormData | null,
): ProductFormData {
  if (dadosSalvos) return dadosSalvos;

  const nome = item?.nome ?? "";
  const codigo = item?.codigo ?? "";
  const preco = normalizarPreco(item?.preco);
  const imagens = (item?.imagens ?? []).filter(Boolean).map((url, indice) => ({
    id: `${item?.id ?? "fornecedor"}-imagem-${indice}`,
    url,
    preview: url,
    isPrimary: indice === 0,
    altText: nome,
  }));

  return {
    ...initialProductData,
    name: nome,
    slug: gerarSlug(nome),
    sku: codigo,
    productCode: item?.ean ?? codigo,
    ncmCode: item?.ncm ?? "",
    cardShortText: item?.complemento?.slice(0, 80) ?? "",
    description: item?.complemento
      ? `<p>${item.complemento}</p>`
      : initialProductData.description,
    isActive: false,
    productKind: "simple" as ProductKind,
    images: imagens,
    variants: item
      ? [
          {
            sku: codigo,
            name: nome,
            attributes: {},
            priceInCents: converterPrecoParaCentavos(item.preco),
            comparePriceInCents: null,
            stockQuantity: item.estoque ?? 0,
            weightInGrams: converterKgParaGramas(item.pesoBruto),
            heightInCm: converterMedida(item.alturaCaixa),
            widthInCm: converterMedida(item.larguraCaixa),
            lengthInCm: converterMedida(item.comprimentoCaixa),
            imageUrl: imagens[0]?.url ?? null,
            classificacoesLogisticasIds: [],
            isActive: false,
            isDefault: true,
          },
        ]
      : [],
    pricing: {
      costPrice: preco,
      mainCardPriceType: "stock",
      modalities: {
        stock: {
          price: preco,
          deliveryText: "",
          promo: { active: false, type: "normal", price: "" },
        },
        preSale: {
          price: "",
          deliveryText: "",
          promo: { active: false, type: "normal", price: "" },
        },
        dropshipping: {
          price: preco,
          deliveryText: "",
          promo: { active: false, type: "normal", price: "" },
        },
        orderBasis: {
          price: "",
          deliveryText: "",
          promo: { active: false, type: "normal", price: "" },
        },
      },
    },
    dimensoesFreteExterno: {
      pesoEmKg: item?.pesoBruto ?? "",
      alturaEmCm: item?.alturaCaixa ?? "",
      larguraEmCm: item?.larguraCaixa ?? "",
      comprimentoEmCm: item?.comprimentoCaixa ?? "",
    },
  };
}

export function ModalRascunhoProdutoFornecedor({
  aberto,
  item,
  dadosSalvos,
  aoAlterarAbertura,
  aoSalvarRascunho,
}: ModalRascunhoProdutoFornecedorProps) {
  const dadosIniciais = useMemo(
    () => montarDadosIniciais(item, dadosSalvos),
    [dadosSalvos, item],
  );
  const [produto, setProduto] = useState<ProductFormData>(dadosIniciais);
  const chaveRascunho = `fornecedor-rascunho-${item?.id ?? "novo"}`;

  useEffect(() => {
    if (aberto) setProduto(dadosIniciais);
  }, [aberto, dadosIniciais]);

  const atualizarProduto = (updates: Partial<ProductFormData>) => {
    setProduto((atual) => ({ ...atual, ...updates }));
  };

  const abas = [
    {
      label: "Básico",
      valor: "basic",
      conteudo: <BasicTab data={produto} onChange={atualizarProduto} />,
    },
    {
      label: "Preços",
      valor: "pricing",
      conteudo: <PricingTab data={produto} onChange={atualizarProduto} />,
    },
    {
      label: "Frete",
      valor: "shipping",
      conteudo: (
        <ShippingTab
          data={produto}
          onChange={(updates) =>
            setProduto((atual) => ({
              ...atual,
              shipping: { ...atual.shipping, ...updates },
            }))
          }
        />
      ),
    },
    {
      label: "Entrega",
      valor: "entrega",
      conteudo: (
        <EntregaTab
          data={produto.entrega ?? {}}
          dimensoesFrete={produto.dimensoesFreteExterno}
          aoAlterarDimensoes={(dimensoes) =>
            atualizarProduto({ dimensoesFreteExterno: dimensoes })
          }
          onChange={(updates) =>
            setProduto((atual) => ({
              ...atual,
              entrega: { ...atual.entrega, ...updates },
            }))
          }
        />
      ),
    },
    {
      label: "Garantia",
      valor: "warranty",
      conteudo: <WarrantyTab data={produto} onChange={atualizarProduto} />,
    },
    {
      label: "Variantes",
      valor: "variants",
      conteudo: (
        <VariantsTab
          data={produto}
          draftKey={chaveRascunho}
          onChange={atualizarProduto}
        />
      ),
    },
    {
      label: "Vendedor",
      valor: "seller",
      conteudo: <SellerTab data={produto} onChange={atualizarProduto} />,
    },
    {
      label: "SEO",
      valor: "seo",
      conteudo: <SeoTab data={produto} onChange={atualizarProduto} />,
    },
  ];

  return (
    <Dialog open={aberto} onOpenChange={aoAlterarAbertura}>
      <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[94vh] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] sm:rounded-xl xl:w-[min(1480px,calc(100vw-2rem))] xl:max-w-[min(1480px,calc(100vw-2rem))]">
        <DialogHeader className="border-b px-4 py-4 sm:px-6">
          <DialogTitle>Cadastrar novo produto</DialogTitle>
          <DialogDescription>
            Dados preenchidos a partir do fornecedor. Revise antes de salvar
            como rascunho.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Este produto será salvo como rascunho e não ficará visível na
              loja.
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-50/60 p-3 sm:p-5">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="sticky top-0 z-10 flex h-auto w-full justify-start overflow-x-auto rounded-lg border bg-white p-1 shadow-xs">
              {abas.map((aba) => (
                <TabsTrigger
                  key={aba.valor}
                  value={aba.valor}
                  className="min-w-max justify-start px-3 py-2 text-sm"
                >
                  {aba.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="min-w-0 [&_*]:max-w-full">
              {abas.map((aba) => (
                <TabsContent key={aba.valor} value={aba.valor} className="mt-0">
                  {aba.conteudo}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>

        <DialogFooter className="border-t bg-white px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => aoAlterarAbertura(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => {
              aoSalvarRascunho({ ...produto, isActive: false });
              aoAlterarAbertura(false);
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar rascunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
