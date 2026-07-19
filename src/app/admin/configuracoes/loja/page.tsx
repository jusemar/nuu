import { FormularioConfiguracaoLoja } from "@/features/configuracoes-loja/components/admin/formulario-configuracao-loja";
import { buscarConfiguracaoLoja } from "@/features/configuracoes-loja/queries/buscar-configuracao-loja";

export default async function ConfiguracoesLojaPage() {
  const configuracao = await buscarConfiguracaoLoja();

  return (
    <FormularioConfiguracaoLoja
      nomeComercialInicial={configuracao.nomeComercial}
    />
  );
}
