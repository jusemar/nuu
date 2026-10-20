import type { Metadata } from "next";

import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";
import { PaginaCatalogoRecompensas } from "@/features/programa-fidelidade/components/store/recompensa/pagina-catalogo-recompensas";
import { buscarProgramaFidelidadeCliente } from "@/features/programa-fidelidade/queries/buscar-programa-fidelidade-cliente";
import { listarRecompensasPublicas } from "@/features/programa-fidelidade/queries/catalogo/listar-recompensas-publicas";
import { historicoFidelidadeClienteSchema } from "@/features/programa-fidelidade/schemas/historico-fidelidade-cliente.schema";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Troque seus pontos | Nooo",
    description: "Use seus pontos para resgatar produtos selecionados.",
  };
}

export default async function TroqueSeusPontosPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const parametros = await searchParams;
  const pagina = Number(parametros.pagina ?? 1);
  const sessao = await buscarSessaoCliente();
  const [catalogo, fidelidade] = await Promise.all([
    listarRecompensasPublicas(pagina),
    sessao ? buscarProgramaFidelidadeCliente({
      usuarioId: sessao.usuario.id,
      filtros: historicoFidelidadeClienteSchema.parse({ pagina: 1, porPagina: 10 }),
    }) : Promise.resolve(null),
  ]);
  return (
    <PaginaCatalogoRecompensas
      catalogo={catalogo}
      saldoDisponivel={fidelidade?.saldos.disponiveis ?? null}
      programaAtivo={fidelidade?.configuracao?.ativo ?? true}
    />
  );
}
