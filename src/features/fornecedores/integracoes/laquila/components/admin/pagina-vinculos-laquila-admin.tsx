import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabelaVinculosFornecedor } from "@/features/fornecedores/components/admin/tabela-vinculos-fornecedor";

const produtosDaLojaMock = [
  {
    id: "produto-loja-1",
    nome: "Amortecedor dianteiro premium",
    sku: "AMT-001",
    categoria: "Suspensão",
    preco: "219.9",
  },
  {
    id: "produto-loja-2",
    nome: "Kit suporte do bico injetor",
    sku: "KIT-110012",
    categoria: "Injeção",
    preco: "84.9",
    jaVinculado: true,
  },
  {
    id: "produto-loja-3",
    nome: "Pastilha de freio dianteira",
    sku: "PST-4450",
    categoria: "Freios",
    preco: "139.9",
  },
  {
    id: "produto-loja-4",
    nome: "Filtro de óleo blindado",
    sku: "FLT-7781",
    categoria: "Filtros",
    preco: "42.5",
  },
];

const itensLaquilaMock = [
  {
    id: "laquila-24250",
    produtoRecebido: {
      nome: "AMORTECEDOR DIANTEIRO",
      codigo: "24250",
      ean: "7890000242501",
      ncm: "87088000",
      preco: "189.9",
      estoque: 100,
      imagens: ["https://placehold.co/640x480?text=Amortecedor"],
      pesoBruto: "3.2",
      alturaCaixa: "18",
      larguraCaixa: "14",
      comprimentoCaixa: "54",
      complemento: "Suspensão · Amortecedores",
    },
    status: "aguardando" as const,
    produtoLoja: null,
  },
  {
    id: "laquila-110012",
    produtoRecebido: {
      nome: "JUNCAO SUPORTE DO BICO",
      codigo: "110012",
      ean: "7890001100125",
      ncm: "84099190",
      preco: "7.55",
      estoque: 100,
      imagens: ["https://placehold.co/640x480?text=Suporte+Bico"],
      pesoBruto: "0.12",
      alturaCaixa: "4",
      larguraCaixa: "6",
      comprimentoCaixa: "8",
      complemento: "Injeção · Suportes",
    },
    status: "vinculado" as const,
    produtoLoja: produtosDaLojaMock[1],
  },
  {
    id: "laquila-77881",
    produtoRecebido: {
      nome: "FILTRO OLEO MOTOR",
      codigo: "77881",
      ean: "7890000778819",
      ncm: "84212300",
      preco: "31.2",
      estoque: 46,
      imagens: ["https://placehold.co/640x480?text=Filtro+Oleo"],
      pesoBruto: "0.38",
      alturaCaixa: "11",
      larguraCaixa: "9",
      comprimentoCaixa: "9",
      complemento: "Filtros · Motor",
    },
    status: "aguardando" as const,
    produtoLoja: null,
  },
  {
    id: "laquila-4450",
    produtoRecebido: {
      nome: "PASTILHA FREIO DIANTEIRA",
      codigo: "4450",
      ean: "7890000044501",
      ncm: "87083090",
      preco: "96.4",
      estoque: 12,
      imagens: ["https://placehold.co/640x480?text=Pastilha+Freio"],
      pesoBruto: "1.1",
      alturaCaixa: "7",
      larguraCaixa: "12",
      comprimentoCaixa: "18",
      complemento: "Freios · Pastilhas",
    },
    status: "aguardando" as const,
    produtoLoja: null,
  },
];

export function PaginaVinculosLaquilaAdmin() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
            <Link href="/admin/fornecedores/integracoes/laquila/mapeamento">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para mapeamento
            </Link>
          </Button>

          <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Vínculos — Laquila
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Relacione os produtos recebidos da API com produtos existentes da
            loja.
          </p>
        </div>

        <Badge
          variant="outline"
          className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <CheckCircle2 className="h-3 w-3" />
          API Laquila
        </Badge>
      </section>

      <TabelaVinculosFornecedor
        tipoOrigem="api"
        titulo="Vinculação de produtos"
        subtitulo="Revise quais itens da API Laquila correspondem a produtos já existentes na loja."
        labelProdutoRecebido="Produto da API"
        itens={itensLaquilaMock}
        produtosDaLoja={produtosDaLojaMock}
        textoAcaoPrincipal="Continuar para conciliação"
        hrefAcaoPrincipal="/admin/fornecedores/integracoes/laquila/conciliacao"
      />
    </main>
  );
}
