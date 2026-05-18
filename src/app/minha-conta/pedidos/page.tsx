import { redirect } from "next/navigation";

import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";
import { vincularPedidosVisitantesAoCliente } from "@/features/autenticacao/actions/cliente/vincular-pedidos-visitantes-ao-cliente";
import { PaginaMeusPedidos } from "@/features/checkout/components/store/pedidos-cliente/pagina-meus-pedidos";
import { listarPedidosCliente } from "@/features/checkout/queries/pedidos-cliente/listar-pedidos-cliente";

export default async function MeusPedidosPage() {
  const sessao = await buscarSessaoCliente();

  if (!sessao) {
    redirect("/?login=necessario");
  }

  await vincularPedidosVisitantesAoCliente({
    usuarioId: sessao.usuario.id,
    email: sessao.usuario.email,
  });

  const pedidos = await listarPedidosCliente({
    usuarioId: sessao.usuario.id,
  });

  return <PaginaMeusPedidos pedidos={pedidos} />;
}
