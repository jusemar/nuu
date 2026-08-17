import {
  buscarProgramaFidelidade,
  PaginaProgramaFidelidadeAdmin,
} from "@/features/programa-fidelidade";

export default async function ProgramaFidelidadePage() {
  const estado = await buscarProgramaFidelidade();

  return <PaginaProgramaFidelidadeAdmin {...estado} />;
}
