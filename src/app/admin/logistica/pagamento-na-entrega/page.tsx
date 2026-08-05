import { PaginaPagamentoNaEntregaAdmin } from "@/features/pagamento-na-entrega/components/admin/pagina-pagamento-na-entrega-admin";
import { listarConfiguracoesPagamentoNaEntregaServico } from "@/features/pagamento-na-entrega/queries/admin/listar-configuracoes-pagamento-na-entrega-servico";

export const metadata = {
  title: "Pagamento na Entrega | Logística",
};

/**
 * A rota só carrega os dados e entrega ao componente da feature — nenhuma regra de negócio
 * vive em `app/`, conforme a arquitetura do projeto.
 */
export default async function PagamentoNaEntregaLogisticaPage() {
  const painel = await listarConfiguracoesPagamentoNaEntregaServico();

  return <PaginaPagamentoNaEntregaAdmin painel={painel} />;
}
