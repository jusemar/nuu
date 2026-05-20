import { redirect } from "next/navigation";
import { RegioesEntregaPropriaPage } from "@/features/admin/logistics/entrega-propria/components/admin/regioes-entrega-propria-page";
import { listarRegioesEntregaPropriaPorCidade } from "@/features/admin/logistics/entrega-propria/queries/admin-entrega-propria.queries";

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
  const city = getParam(resolvedSearchParams, "city");

  if (!stateUf) {
    redirect("/admin/logistics/entrega-propria");
  }

  if (!city) {
    redirect(`/admin/logistics/entrega-propria/cidades?state=${stateUf}`);
  }

  const regioes = await listarRegioesEntregaPropriaPorCidade(stateUf, city);

  return (
    <RegioesEntregaPropriaPage
      stateUf={stateUf}
      city={city}
      regioes={regioes}
    />
  );
}
