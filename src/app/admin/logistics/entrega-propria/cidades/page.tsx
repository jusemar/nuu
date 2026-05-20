import { redirect } from "next/navigation";
import { CidadesEntregaPropriaPage } from "@/features/admin/logistics/entrega-propria/components/admin/cidades-entrega-propria-page";
import {
  buscarNomeEstadoEntregaPropria,
  listarCidadesEntregaPropria,
} from "@/features/admin/logistics/entrega-propria/queries/admin-entrega-propria.queries";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const stateUf = getParam(resolvedSearchParams, "state")?.toUpperCase();

  if (!stateUf) {
    redirect("/admin/logistics/entrega-propria");
  }

  const [stateName, cidades] = await Promise.all([
    buscarNomeEstadoEntregaPropria(stateUf),
    listarCidadesEntregaPropria(stateUf),
  ]);

  return (
    <CidadesEntregaPropriaPage
      stateUf={stateUf}
      stateName={stateName ?? stateUf}
      cidades={cidades}
    />
  );
}
