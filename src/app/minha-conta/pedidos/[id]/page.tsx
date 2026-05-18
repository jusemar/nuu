import { notFound } from "next/navigation";
import { z } from "zod";

import { vincularPedidosVisitantesAoCliente } from "@/features/autenticacao/actions/cliente/vincular-pedidos-visitantes-ao-cliente";
import { protegerFluxoCadastroCliente } from "@/features/autenticacao/queries/cadastro/proteger-fluxo-cadastro-cliente";
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
  const { sessao, cadastro } = await protegerFluxoCadastroCliente();

  const { id } = await params;

  if (!z.uuid().safeParse(id).success) {
    notFound();
  }

  await vincularPedidosVisitantesAoCliente({
    usuarioId: sessao.usuario.id,
    email: sessao.usuario.email,
    documento: cadastro.perfil?.documento,
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
