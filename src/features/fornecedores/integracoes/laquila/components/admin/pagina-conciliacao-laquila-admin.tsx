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
    status: "pronto" as const,
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
    status: "pendencia" as const,
    pendenciasObrigatorias: ["Categoria obrigatória", "Marca obrigatória"],
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
    status: "alerta" as const,
    alertas: ["Sem imagem recebida"],
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
    status: "ignorado" as const,
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
