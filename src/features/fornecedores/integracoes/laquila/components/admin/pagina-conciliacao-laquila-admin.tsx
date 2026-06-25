import { TabelaConciliacaoFornecedor } from "@/features/fornecedores/components/admin/tabela-conciliacao-fornecedor";

const itensConciliacaoLaquilaMock = [
  {
    id: "laquila-24250",
    produto: {
      nome: "AMORTECEDOR DIANTEIRO",
      codigo: "24250",
      preco: "189.9",
      estoque: 100,
      complemento: "Suspensão · Amortecedores",
    },
    acaoPrevista: "atualizar" as const,
    statusVinculacao: "vinculado" as const,
    status: "pronto" as const,
    regrasObrigatorias: [
      {
        campo: "categoria_fornecedor",
        label: "Categoria da loja",
        estrategia: "valor_padrao" as const,
        valorAplicado: "Suspensão",
      },
      {
        campo: "marca_fornecedor",
        label: "Marca da loja",
        estrategia: "valor_padrao" as const,
        valorAplicado: "Genérico",
      },
    ],
    regrasImportantes: [
      {
        campo: "ncm",
        label: "NCM",
        estrategia: "valor_padrao" as const,
        valorAplicado: "8708.80.00",
      },
    ],
    configuracaoPreco: {
      modalidade: "Dropshipping" as const,
      valorAplicado: "189.9",
      prazo: "3 a 5 dias úteis",
      cardPrincipal: true,
      origem: "Preço complementar 00006",
    },
  },
  {
    id: "laquila-110012",
    produto: {
      nome: "JUNCAO SUPORTE DO BICO",
      codigo: "110012",
      preco: "7.55",
      estoque: 100,
      complemento: "sem categoria · sem marca",
    },
    acaoPrevista: "criar" as const,
    statusVinculacao: "novo" as const,
    status: "pendencia" as const,
    pendenciasObrigatorias: ["Categoria obrigatória", "Marca obrigatória"],
    regrasObrigatorias: [
      {
        campo: "categoria_fornecedor",
        label: "Categoria da loja",
        estrategia: "conciliacao" as const,
        observacao: "Não enviada pela API. Será preenchida item a item.",
        bloqueiaPublicacao: true,
      },
      {
        campo: "marca_fornecedor",
        label: "Marca da loja",
        estrategia: "conciliacao" as const,
        observacao: "Não enviada pela API. Será preenchida item a item.",
        bloqueiaPublicacao: true,
      },
    ],
    regrasImportantes: [
      {
        campo: "ean_gtin",
        label: "EAN/GTIN",
        estrategia: "conciliacao" as const,
        observacao: "Pode ser resolvido depois sem bloquear agora.",
      },
    ],
    configuracaoPreco: {
      modalidade: "Dropshipping" as const,
      valorAplicado: "7.55",
      prazo: "3 a 5 dias úteis",
      cardPrincipal: true,
      origem: "Preço complementar 00006",
    },
  },
  {
    id: "laquila-77881",
    produto: {
      nome: "FILTRO OLEO MOTOR",
      codigo: "77881",
      preco: "31.2",
      estoque: 46,
      complemento: "Filtros · sem marca",
    },
    acaoPrevista: "criar" as const,
    statusVinculacao: "novo" as const,
    status: "alerta" as const,
    alertas: ["Sem imagem recebida"],
    regrasObrigatorias: [
      {
        campo: "categoria_fornecedor",
        label: "Categoria da loja",
        estrategia: "valor_padrao" as const,
        valorAplicado: "Filtros",
      },
      {
        campo: "marca_fornecedor",
        label: "Marca da loja",
        estrategia: "rascunho" as const,
        observacao: "Produto ficará como rascunho até a marca ser preenchida.",
      },
    ],
    regrasImportantes: [
      {
        campo: "imagens",
        label: "Imagem principal",
        estrategia: "ignorar" as const,
        observacao: "Não bloqueia publicação, mas fica como alerta visual.",
      },
    ],
    configuracaoPreco: {
      modalidade: "Sob encomenda" as const,
      valorAplicado: "31.2",
      prazo: "7 a 10 dias úteis",
      cardPrincipal: true,
      origem: "Preço complementar 00006",
    },
  },
  {
    id: "laquila-4450",
    produto: {
      nome: "PASTILHA FREIO DIANTEIRA",
      codigo: "4450",
      preco: "96.4",
      estoque: 12,
      complemento: "Freios · Pastilhas",
    },
    acaoPrevista: "ignorar" as const,
    statusVinculacao: "ignorado" as const,
    status: "ignorado" as const,
    regrasObrigatorias: [],
    regrasImportantes: [],
    configuracaoPreco: null,
    motivoIgnorado: "Marcado como ignorado na vinculação",
  },
];

export function PaginaConciliacaoLaquilaAdmin() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <TabelaConciliacaoFornecedor
        tipoOrigem="api"
        fornecedor="Laquila"
        titulo="Conciliação — Laquila"
        subtitulo="Revise os itens antes da publicação e corrija pendências obrigatórias."
        hrefVoltar="/admin/fornecedores/integracoes/laquila/vinculos"
        hrefProximaEtapa="/admin/fornecedores/integracoes/laquila/publicacao"
        itens={itensConciliacaoLaquilaMock}
      />
    </main>
  );
}
