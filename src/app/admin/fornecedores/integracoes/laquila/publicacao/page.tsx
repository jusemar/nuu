import { redirect } from "next/navigation";

import { buscarUltimaImportacaoApiLaquila } from "@/features/fornecedores/integracoes/laquila/queries";

/**
 * Rota antiga, mantida como redirecionamento.
 *
 * Ela existia quando a integração por API não tinha execução: havia um retrato
 * global e uma tela só. Agora cada sincronização é uma importação com id
 * próprio, então este endereço não identifica mais nada sozinho — ele leva o
 * gestor à execução mais recente, ou à tela da integração quando ainda não
 * existe nenhuma.
 */
export default async function Page() {
  const importacaoId = await buscarUltimaImportacaoApiLaquila();

  redirect(
    importacaoId
      ? `/admin/fornecedores/integracoes/laquila/importacoes/${importacaoId}/publicacao`
      : "/admin/fornecedores/integracoes/laquila",
  );
}
