import { PaginaConfiguracaoPrecificacao } from "@/features/precificacao/components/admin/configuracao-pagamento/pagina-configuracao-precificacao";
import { buscarConfiguracaoPagamentoAtiva } from "@/features/precificacao/server";

export default async function PrecificacaoAdminPage() {
  const configuracaoPagamento = await buscarConfiguracaoPagamentoAtiva();

  return (
    <PaginaConfiguracaoPrecificacao
      configuracaoPagamento={configuracaoPagamento}
    />
  );
}
