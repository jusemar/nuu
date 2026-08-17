import { protegerFluxoCadastroCliente } from "@/features/autenticacao/queries/cadastro/proteger-fluxo-cadastro-cliente";
import { PaginaProgramaFidelidadeCliente } from "@/features/programa-fidelidade/components/store/pagina-programa-fidelidade-cliente";
import { buscarProgramaFidelidadeCliente } from "@/features/programa-fidelidade/queries/buscar-programa-fidelidade-cliente";
import { historicoFidelidadeClienteSchema } from "@/features/programa-fidelidade/schemas/historico-fidelidade-cliente.schema";

export default async function ProgramaFidelidadeClientePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sessao } = await protegerFluxoCadastroCliente();

  const parametros = await searchParams;
  const filtros = historicoFidelidadeClienteSchema.parse({
    pagina: parametros.pagina,
    porPagina: parametros.porPagina,
  });
  const resultado = await buscarProgramaFidelidadeCliente({
    usuarioId: sessao.usuario.id,
    filtros,
  });

  return <PaginaProgramaFidelidadeCliente resultado={resultado} />;
}
