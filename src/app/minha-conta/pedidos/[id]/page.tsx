import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { buscarSessaoCliente } from "@/features/autenticacao/queries/sessao/buscar-sessao-cliente";
import { vincularPedidosVisitantesAoCliente } from "@/features/autenticacao/actions/cliente/vincular-pedidos-visitantes-ao-cliente";
import { PaginaDetalhePedidoCliente } from "@/features/checkout/components/store/pedidos-cliente/pagina-detalhe-pedido-cliente";
import { buscarPedidoClientePorId } from "@/features/checkout/queries/pedidos-cliente/buscar-pedido-cliente";

type DetalhePedidoClientePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DetalhePedidoClientePage({
  params,
}: DetalhePedidoClientePageProps) {
  const sessao = await buscarSessaoCliente();

  if (!sessao) {
    redirect("/?login=necessario");
  }

  const { id } = await params;

  if (!z.uuid().safeParse(id).success) {
    notFound();
  }

  await vincularPedidosVisitantesAoCliente({
    usuarioId: sessao.usuario.id,
    email: sessao.usuario.email,
  });

  const pedido = await buscarPedidoClientePorId({
    pedidoId: id,
    usuarioId: sessao.usuario.id,
  });

  if (!pedido) {
    notFound();
  }

  return <PaginaDetalhePedidoCliente pedido={pedido} />;
}
