import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { agendasGeograficasEntregaPropria } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import {
  montarItensAgendaGeografica,
  type NivelAgendaGeograficaAdmin,
} from "../lib/montar-itens-agenda-geografica";
import { listarDestinosEntregaPropriaProduto } from "./admin-entrega-propria.queries";

export type { NivelAgendaGeograficaAdmin };

/** Leitura paginada da Agenda Geográfica (Cidade/Região/Bairro/CEP). */
export async function listarAgendaGeograficaEntregaPropriaAdmin(
  nivel: NivelAgendaGeograficaAdmin,
  opcoes: { busca?: string; pagina?: number; porPagina?: number } = {},
) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.VISUALIZAR);
  const [destinos, agendas] = await Promise.all([
    listarDestinosEntregaPropriaProduto(),
    db.query.agendasGeograficasEntregaPropria.findMany({
      where: eq(agendasGeograficasEntregaPropria.ativa, true),
      with: { datasBloqueadas: { columns: { data: true } } },
    }),
  ]);

  return montarItensAgendaGeografica({
    nivel,
    destinos,
    agendas: agendas.map((agenda) => ({
      ...agenda,
      datasBloqueadas: agenda.datasBloqueadas.map((item) => item.data),
    })),
    ...opcoes,
  });
}
