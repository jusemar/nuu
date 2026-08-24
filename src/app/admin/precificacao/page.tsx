import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { PaginaConfiguracaoPrecificacao } from "@/features/precificacao/components/admin/configuracao-pagamento/pagina-configuracao-precificacao";
import { buscarConfiguracaoPagamentoAtiva } from "@/features/precificacao/server";

export default async function PrecificacaoAdminPage() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.PRECIFICACAO.ADMINISTRAR);
  const configuracaoPagamento = await buscarConfiguracaoPagamentoAtiva();

  return (
    <PaginaConfiguracaoPrecificacao
      configuracaoPagamento={configuracaoPagamento}
    />
  );
}
