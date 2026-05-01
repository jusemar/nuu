// Página: Retirada Local — Admin
// Server Component — busca dados no servidor e passa via props

import { buscarModelosRetirada } from "@/features/admin/logistica/queries/retirada";
import { ConfigRetiradaLocalPage } from "@/features/admin/logistica/components/retirada-local/ConfigRetiradaLocalPage";

export default async function RetiradaLocalRoute() {
  const modelos = await buscarModelosRetirada();

  return <ConfigRetiradaLocalPage modelosInicial={modelos} />;
}