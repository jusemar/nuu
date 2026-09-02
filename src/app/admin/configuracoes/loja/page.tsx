import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { FormularioBarraAvisos } from "@/features/configuracoes-loja/components/admin/formulario-barra-avisos";
import { FormularioConfiguracaoLoja } from "@/features/configuracoes-loja/components/admin/formulario-configuracao-loja";
import { buscarBarraAvisos } from "@/features/configuracoes-loja/queries/buscar-barra-avisos";
import { buscarConfiguracaoLoja } from "@/features/configuracoes-loja/queries/buscar-configuracao-loja";

export default async function ConfiguracoesLojaPage() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOJA_CONFIGURACOES.ADMINISTRAR);
  const [configuracao, barraAvisos] = await Promise.all([
    buscarConfiguracaoLoja(),
    buscarBarraAvisos(),
  ]);

  return (
    <div className="space-y-6">
      <FormularioConfiguracaoLoja
        nomeComercialInicial={configuracao.nomeComercial}
        logoCabecalhoUrlInicial={configuracao.logoCabecalhoUrl}
        logoRodapeUrlInicial={configuracao.logoRodapeUrl}
      />
      <div className="mx-auto w-full max-w-4xl">
        <FormularioBarraAvisos configuracao={barraAvisos} />
      </div>
    </div>
  );
}
