// Página: Retirada Local — Admin
// Server Component — busca dados no servidor e passa via props

import { buscarModelosRetirada } from "@/features/admin/logistica/queries/retirada";
import { ConfigRetiradaLocalPage } from "@/features/admin/logistica/components/retirada-local/ConfigRetiradaLocalPage";
import { NavegacaoLogisticaOperacional } from "@/features/admin/logistica/components/operacao/navegacao-logistica-operacional";

export default async function RetiradaLocalRoute() {
  const modelos = await buscarModelosRetirada();

  return (
    <div className="space-y-6">
      <NavegacaoLogisticaOperacional />
      <ConfigRetiradaLocalPage modelosInicial={modelos} />
    </div>
  );
}
