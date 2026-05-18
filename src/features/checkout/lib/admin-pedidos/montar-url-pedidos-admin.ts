import type { FiltrosPedidosAdmin } from "../../schemas/admin-pedidos.schema";

export function montarUrlPedidosAdmin(
  filtros: FiltrosPedidosAdmin,
  sobrescrever: Partial<FiltrosPedidosAdmin>,
) {
  const params = new URLSearchParams();
  const proximosFiltros = {
    ...filtros,
    ...sobrescrever,
  };

  Object.entries(proximosFiltros).forEach(([chave, valor]) => {
    if (valor === undefined || valor === "" || valor === null) {
      return;
    }

    params.set(chave, String(valor));
  });

  const queryString = params.toString();

  return queryString ? `/admin/orders?${queryString}` : "/admin/orders";
}
