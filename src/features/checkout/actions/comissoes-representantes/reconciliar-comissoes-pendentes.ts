import "server-only";

import { sql } from "drizzle-orm";

import { dbTransacional } from "@/db/transaction";

import { processarComissoesPedidoSeguro } from "./processar-comissoes-pedido";
/** Executado pelo reconciliador existente; não consulta gateways nem refaz a atribuição. */
export async function reconciliarComissoesPendentes() {
  try {
    const pedidos = await dbTransacional.execute<{ id: string }>(
      sql`select distinct p.id from checkout_pedidos p join checkout_item_comissoes c on c.pedido_id=p.id where (p.status in ('canceled','refunded') or (p.pagamento_status='paid' and p.status in ('paid','processing','shipped','delivered'))) and not exists(select 1 from checkout_item_comissao_eventos e where e.comissao_id=c.id and e.tipo=case when p.status='refunded' then 'estornada' when p.status='canceled' then 'cancelada' else 'confirmada' end) limit 100`,
    );
    let processados = 0;
    for (const pedido of pedidos.rows)
      if (
        await dbTransacional.transaction((tx) =>
          processarComissoesPedidoSeguro(tx, pedido.id),
        )
      )
        processados++;
    return { processados };
  } catch {
    console.error("[comissoes:reconciliacao-pendente]");
    return { processados: 0 };
  }
}
