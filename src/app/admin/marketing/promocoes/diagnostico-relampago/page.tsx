import { PaginaDiagnosticoOfertasRelampagoAdmin } from "@/features/promocoes/components/admin/pagina-diagnostico-ofertas-relampago-admin";
import { diagnosticarOfertasRelampagoAdmin } from "@/features/promocoes/queries";

export default async function DiagnosticoOfertasRelampagoAdminPage() {
  const resultado = await diagnosticarOfertasRelampagoAdmin();

  return <PaginaDiagnosticoOfertasRelampagoAdmin resultado={resultado} />;
}
