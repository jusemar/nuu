import { Suspense } from "react";

import { RotasProdutosRepresentante } from "@/features/products/components/admin/representantes/rotas-produtos-representante";
import { buscarPerfilProdutosAdmin } from "@/features/products/queries/representantes/buscar-perfil-produtos-admin";

export default async function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await buscarPerfilProdutosAdmin();
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 sm:p-4">
      {perfil.representante ? (
        <Suspense fallback={<p role="status">Carregando produtos…</p>}>
          <RotasProdutosRepresentante perfilInicial={perfil} />
        </Suspense>
      ) : (
        children
      )}
    </div>
  );
}
