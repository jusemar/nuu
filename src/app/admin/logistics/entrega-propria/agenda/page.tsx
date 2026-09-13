import { AgendaGeograficaEntregaPropriaPage } from "@/features/admin/logistics/entrega-propria/components/admin/agenda-geografica-entrega-propria-page";
import {
  listarAgendaGeograficaEntregaPropriaAdmin,
  type NivelAgendaGeograficaAdmin,
} from "@/features/admin/logistics/entrega-propria/queries/agenda-geografica-entrega-propria.queries";

const NIVEIS = new Set<NivelAgendaGeograficaAdmin>([
  "cidade",
  "regiao",
  "bairro",
  "cep",
]);

export default async function AgendaGeograficaPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string; busca?: string; pagina?: string }>;
}) {
  const parametros = await searchParams;
  const nivel = NIVEIS.has(parametros.nivel as NivelAgendaGeograficaAdmin)
    ? (parametros.nivel as NivelAgendaGeograficaAdmin)
    : "cidade";
  const busca = parametros.busca?.trim().slice(0, 100) ?? "";
  const paginaInformada = Number(parametros.pagina);
  const pagina = Number.isInteger(paginaInformada) ? paginaInformada : 1;
  const resultado = await listarAgendaGeograficaEntregaPropriaAdmin(nivel, {
    busca,
    pagina,
  });

  return (
    <AgendaGeograficaEntregaPropriaPage
      nivel={nivel}
      busca={busca}
      resultado={resultado}
    />
  );
}
