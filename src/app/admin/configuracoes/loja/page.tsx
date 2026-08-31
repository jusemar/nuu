import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { FormularioConfiguracaoLoja } from "@/features/configuracoes-loja/components/admin/formulario-configuracao-loja";
import { buscarConfiguracaoLoja } from "@/features/configuracoes-loja/queries/buscar-configuracao-loja";

export default async function ConfiguracoesLojaPage() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOJA_CONFIGURACOES.ADMINISTRAR);
  const configuracao = await buscarConfiguracaoLoja();

  return (
    <FormularioConfiguracaoLoja
      nomeComercialInicial={configuracao.nomeComercial}
      logoCabecalhoUrlInicial={configuracao.logoCabecalhoUrl}
      logoRodapeUrlInicial={configuracao.logoRodapeUrl}
    />
  );
}
