import { PaginaAceiteConvite } from "@/features/administradores/components/publico/pagina-aceite-convite";
import { validarConvitePublico } from "@/features/administradores/queries/validar-convite-publico";

type PaginaConviteAdministrativoProps = {
  params: Promise<{ token: string }>;
};

export default async function PaginaConviteAdministrativo({
  params,
}: PaginaConviteAdministrativoProps) {
  const { token } = await params;
  const convite = await validarConvitePublico(token);

  return <PaginaAceiteConvite convite={convite} token={token} />;
}
