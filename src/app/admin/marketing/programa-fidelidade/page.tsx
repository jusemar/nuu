import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import {
  buscarProgramaFidelidade,
  PaginaProgramaFidelidadeAdmin,
} from "@/features/programa-fidelidade";

export default async function ProgramaFidelidadePage() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.FIDELIDADE.ADMINISTRAR);
  const estado = await buscarProgramaFidelidade();

  return <PaginaProgramaFidelidadeAdmin {...estado} />;
}
