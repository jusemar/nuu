import { notFound } from "next/navigation";
import { RegiaoBairrosEntregaPropriaPage } from "@/features/admin/logistics/entrega-propria/components/admin/regiao-bairros-entrega-propria-page";
import { buscarRegiaoEntregaPropriaDetalhe } from "@/features/admin/logistics/entrega-propria/queries/admin-entrega-propria.queries";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const regiaoId = Number(id);

  if (!Number.isInteger(regiaoId)) {
    notFound();
  }

  const regiao = await buscarRegiaoEntregaPropriaDetalhe(regiaoId);

  if (!regiao) {
    notFound();
  }

  return <RegiaoBairrosEntregaPropriaPage regiao={regiao} />;
}
