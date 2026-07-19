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
import { type ProductFormData } from "@/app/admin/products/new/data/product-form-data";
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
import { montarDadosIniciaisRascunhoProdutoFornecedor } from "@/features/fornecedores/lib/montar-dados-iniciais-rascunho-produto-fornecedor";
import type {
  DadosFornecedorParaRascunhoProduto,
  ValoresPadraoRascunhoProdutoFornecedor,
} from "@/features/fornecedores/types/mapeamento-fornecedor.types";

type ModalRascunhoProdutoFornecedorProps = {
  aberto: boolean;
  item: DadosFornecedorParaRascunhoProduto | null;
  dadosSalvos?: ProductFormData | null;
  valoresPadrao?: ValoresPadraoRascunhoProdutoFornecedor;
  aoAlterarAbertura: (aberto: boolean) => void;
  aoSalvarRascunho: (dados: ProductFormData) => boolean | Promise<boolean>;
};

function valorIdentificacao(valor?: string | null) {
  const texto = valor?.trim();
  return texto && texto.length > 0 ? texto : "-";
}

export function ModalRascunhoProdutoFornecedor({
  aberto,
  item,
  dadosSalvos,
  valoresPadrao,
  aoAlterarAbertura,
  aoSalvarRascunho,
}: ModalRascunhoProdutoFornecedorProps) {
  const dadosIniciais = useMemo(
    () =>
      montarDadosIniciaisRascunhoProdutoFornecedor(
        item,
        dadosSalvos,
        valoresPadrao,
      ),
    [dadosSalvos, item, valoresPadrao],
  );
  const [produto, setProduto] = useState<ProductFormData>(dadosIniciais);
  const [salvando, setSalvando] = useState(false);
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
      conteudo: <ShippingTab data={produto} onChange={atualizarProduto} />,
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

        <section className="grid gap-2 border-b bg-white px-4 py-3 text-sm sm:grid-cols-3 sm:px-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              SKU da loja
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {produto.sku || "Gerado pela regra interna"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Código do fornecedor
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {valorIdentificacao(item?.codigo)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              EAN/GTIN
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {valorIdentificacao(item?.ean)}
            </p>
          </div>
        </section>

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
            disabled={salvando}
            onClick={() => {
              setSalvando(true);
              Promise.resolve(aoSalvarRascunho({ ...produto, isActive: false }))
                .then((salvou) => {
                  if (salvou) aoAlterarAbertura(false);
                })
                .finally(() => setSalvando(false));
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            {salvando ? "Salvando..." : "Salvar rascunho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
