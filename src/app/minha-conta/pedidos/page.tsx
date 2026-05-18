import { vincularPedidosVisitantesAoCliente } from "@/features/autenticacao/actions/cliente/vincular-pedidos-visitantes-ao-cliente";
import { protegerFluxoCadastroCliente } from "@/features/autenticacao/queries/cadastro/proteger-fluxo-cadastro-cliente";
import { PaginaMeusPedidos } from "@/features/checkout/components/store/pedidos-cliente/pagina-meus-pedidos";
import { listarPedidosCliente } from "@/features/checkout/queries/pedidos-cliente/listar-pedidos-cliente";

export default async function MeusPedidosPage() {
  const { sessao, cadastro } = await protegerFluxoCadastroCliente();

  await vincularPedidosVisitantesAoCliente({
    usuarioId: sessao.usuario.id,
    email: sessao.usuario.email,
    documento: cadastro.perfil?.documento,
  });

  const pedidos = await listarPedidosCliente({
    usuarioId: sessao.usuario.id,
  });

  return <PaginaMeusPedidos pedidos={pedidos} />;
}
