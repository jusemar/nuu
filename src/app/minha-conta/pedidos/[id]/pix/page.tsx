import { notFound } from "next/navigation";
import { z } from "zod";

import { vincularPedidosVisitantesAoCliente } from "@/features/autenticacao/actions/cliente/vincular-pedidos-visitantes-ao-cliente";
import { protegerFluxoCadastroCliente } from "@/features/autenticacao/queries/cadastro/proteger-fluxo-cadastro-cliente";
import { PagamentoPixPendente } from "@/features/checkout/components/store/checkout-visitante/pagamento-pix-pendente";
import { buscarPixPedidoClientePorId } from "@/features/checkout/queries/pedidos-cliente/buscar-pix-pedido-cliente";

type PixPedidoClientePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PixPedidoClientePage({
  params,
}: PixPedidoClientePageProps) {
  const { sessao, cadastro } = await protegerFluxoCadastroCliente();
  const { id } = await params;

  if (!z.uuid().safeParse(id).success) notFound();

  await vincularPedidosVisitantesAoCliente({
    usuarioId: sessao.usuario.id,
    email: sessao.usuario.email,
    documento: cadastro.perfil?.documento,
  });

  const pix = await buscarPixPedidoClientePorId({
    pedidoId: id,
    usuarioId: sessao.usuario.id,
  });

  if (!pix) notFound();

  return (
    <PagamentoPixPendente
      numeroPedido={pix.numeroPedido}
      totalEmCentavos={pix.totalEmCentavos}
      qrCode={pix.qrCode}
      copiaECola={pix.copiaECola}
      expiresAt={pix.expiresAt?.toISOString() ?? null}
      pedidoId={pix.pedidoId}
      status={pix.pagamentoStatus}
      createdAt={pix.createdAt.toISOString()}
      paidAt={pix.paidAt?.toISOString() ?? null}
      agoraInicial={new Date().toISOString()}
    />
  );
}
