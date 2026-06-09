import { PaginaEstabilidadeMigracaoRelampagoAdmin } from "@/features/promocoes/components/admin/pagina-estabilidade-migracao-relampago-admin";
import { verificarEstabilidadeMigracaoRelampagoAdmin } from "@/features/promocoes/queries";

export default async function EstabilidadeMigracaoRelampagoAdminPage() {
  const resultado = await verificarEstabilidadeMigracaoRelampagoAdmin();

  return <PaginaEstabilidadeMigracaoRelampagoAdmin resultado={resultado} />;
}
