import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabelaMapeamentoCamposFornecedor } from "@/features/fornecedores/components/admin/tabela-mapeamento-campos-fornecedor";

const opcoesDestinoLaquila = [
  { valor: "codigo_fornecedor", label: "Código fornecedor" },
  { valor: "nome_produto", label: "Nome do produto" },
  { valor: "ean_gtin", label: "EAN/GTIN" },
  { valor: "ncm", label: "NCM" },
  { valor: "categoria_fornecedor", label: "Categoria da loja" },
  { valor: "marca_fornecedor", label: "Marca da loja" },
  { valor: "grupo_origem", label: "Grupo origem" },
  { valor: "subgrupo_origem", label: "Subgrupo origem" },
  { valor: "imagens", label: "Imagens" },
  { valor: "preco_fornecedor", label: "Preço fornecedor" },
  { valor: "estoque_fornecedor", label: "Estoque fornecedor" },
  { valor: "peso", label: "Peso" },
  { valor: "altura", label: "Altura" },
  { valor: "largura", label: "Largura" },
  { valor: "comprimento", label: "Comprimento" },
];

const linhasMapeamentoLaquila = [
  {
    id: "cd_item",
    nomeOrigem: "cd_item",
    descricaoOrigem: "Identificador do item no fornecedor",
    amostra: "24250",
    campoDestino: "codigo_fornecedor",
    situacao: "detectado_automaticamente",
    confianca: 96,
  },
  {
    id: "descricao",
    nomeOrigem: "descricao",
    descricaoOrigem: "Descrição principal recebida",
    amostra: "AMORTECEDOR DIANTEIRO",
    campoDestino: "nome_produto",
    situacao: "detectado_automaticamente",
    confianca: 94,
  },
  {
    id: "cd_ean",
    nomeOrigem: "cd_ean",
    descricaoOrigem: "Código de barras",
    amostra: "7891234567890",
    campoDestino: "ean_gtin",
    situacao: "detectado_automaticamente",
    confianca: 92,
  },
  {
    id: "NCM",
    nomeOrigem: "NCM",
    descricaoOrigem: "Classificação fiscal",
    amostra: "87089990",
    campoDestino: "ncm",
    situacao: "detectado_automaticamente",
    confianca: 90,
  },
  {
    id: "ds_grupo",
    nomeOrigem: "ds_grupo",
    descricaoOrigem: "Agrupamento comercial",
    amostra: "Suspensão",
    campoDestino: "grupo_origem",
    situacao: "automatico",
    confianca: 86,
  },
  {
    id: "ds_sgrupo",
    nomeOrigem: "ds_sgrupo",
    descricaoOrigem: "Subgrupo comercial",
    amostra: "Amortecedores",
    campoDestino: "subgrupo_origem",
    situacao: "automatico",
    confianca: 84,
  },
  {
    id: "lista_fotos",
    nomeOrigem: "lista_fotos",
    descricaoOrigem: "URLs de fotos recebidas",
    amostra: "https://cdn.laquila.com.br/imagens/24250-1.jpg",
    campoDestino: "imagens",
    situacao: "automatico",
    confianca: 78,
  },
  {
    id: "vl_preco",
    nomeOrigem: "vl_preco",
    descricaoOrigem: "Preço retornado pelo saldo",
    amostra: "189.90",
    campoDestino: "preco_fornecedor",
    situacao: "pendente",
    confianca: 68,
  },
  {
    id: "qt_saldo",
    nomeOrigem: "qt_saldo",
    descricaoOrigem: "Quantidade disponível",
    amostra: "100",
    campoDestino: "estoque_fornecedor",
    situacao: "pendente",
    confianca: 68,
  },
  {
    id: "peso_bruto",
    nomeOrigem: "peso_bruto",
    descricaoOrigem: "Peso bruto recebido",
    amostra: "1.24",
    campoDestino: "peso",
    situacao: "automatico",
    confianca: 82,
  },
  {
    id: "altura_caixa",
    nomeOrigem: "altura_caixa",
    descricaoOrigem: "Altura da embalagem",
    amostra: "12",
    campoDestino: "altura",
    situacao: "automatico",
    confianca: 80,
  },
  {
    id: "largura_caixa",
    nomeOrigem: "largura_caixa",
    descricaoOrigem: "Largura da embalagem",
    amostra: "18",
    campoDestino: "largura",
    situacao: "automatico",
    confianca: 80,
  },
  {
    id: "comprimento_caixa",
    nomeOrigem: "comprimento_caixa",
    descricaoOrigem: "Comprimento da embalagem",
    amostra: "32",
    campoDestino: "comprimento",
    situacao: "automatico",
    confianca: 80,
  },
];

export function PaginaMapeamentoLaquilaAdmin() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-xs sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
            <Link href="/admin/fornecedores/integracoes/laquila/produtos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para recebidos
            </Link>
          </Button>

          <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">
            Mapeamento — Laquila
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Relacione os campos recebidos da API com os campos usados pela loja.
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

      <TabelaMapeamentoCamposFornecedor
        tipoOrigem="api"
        titulo="Mapeamento — Laquila"
        subtitulo="Base visual para revisar Campo da API → Campo da loja antes de seguir para vínculos."
        labelPrimeiraColuna="Campo da API"
        labelAmostra="Exemplo recebido"
        linhas={linhasMapeamentoLaquila}
        opcoesDestino={opcoesDestinoLaquila}
        textoAcaoPrincipal="Continuar para vínculos"
        tipoBotaoAcaoPrincipal="button"
        hrefAcaoPrincipal="/admin/fornecedores/integracoes/laquila/vinculos"
        textoRodape="Prévia visual. O mapeamento real será salvo em etapa posterior."
        estadoVazio="Nenhum campo da API disponível para mapear."
      />
    </main>
  );
}
