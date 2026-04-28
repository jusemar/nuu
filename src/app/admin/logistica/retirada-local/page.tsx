// Página: Retirada Local — Admin
// Server Component — busca dados no servidor e passa via props
// Regra: leitura (GET) sempre no server, nunca no client

import { buscarConfigHorario, buscarFeriados, buscarModalidades, buscarPontosColeta } from "@/features/admin/logistica/queries/retirada";
import { RetiradaLocalPage } from "@/features/admin/logistica/components/admin/RetiradaLocalPage";

export default async function RetiradaLocalRoute() {
  const [config, feriados, modalidades, pontos] = await Promise.all([
    buscarConfigHorario(),
    buscarFeriados(),
    buscarModalidades(),
    buscarPontosColeta(),
  ]);

  return (
    <RetiradaLocalPage 
      configInicial={config}
      feriadosInicial={feriados}
      modalidadesInicial={modalidades}
      pontosInicial={pontos}
    />
  );
}