import "server-only";

import { eq } from "drizzle-orm";

import { enderecosClientesTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { buscarPedidoClientePorId } from "@/features/checkout/queries/pedidos-cliente/buscar-pedido-cliente";
import { listarPedidosCliente } from "@/features/checkout/queries/pedidos-cliente/listar-pedidos-cliente";

function mascararTexto(valor: string, caracteresVisiveis = 3) {
  const inicio = valor.trim().slice(0, caracteresVisiveis);
  return inicio ? `${inicio}${"*".repeat(Math.min(8, Math.max(3, valor.length - inicio.length)))}` : "***";
}

export const fontesFerramentasProtegidasOficiais = {
  async listarPedidos(usuarioId: string, limite: number) {
    const pedidos = await listarPedidosCliente({ usuarioId });
    return pedidos.slice(0, limite).map((pedido) => ({
      criado_em: pedido.createdAt.toISOString(),
      pagamento: pedido.pagamentoStatus,
      referencia_pedido: pedido.id,
      numero_pedido: pedido.numeroPedido,
      situacao: pedido.status,
      total_em_centavos: pedido.totalEmCentavos,
    }));
  },

  async consultarPedido(usuarioId: string, pedidoId: string) {
    const pedido = await buscarPedidoClientePorId({ pedidoId, usuarioId });
    if (!pedido) return null;
    return {
      criado_em: pedido.createdAt.toISOString(),
      itens: pedido.itens.map((item) => ({
        modalidade: item.modalidade,
        nome: item.nomeProduto,
        quantidade: item.quantidade,
        variante: item.nomeVariante,
      })),
      numero_pedido: pedido.numeroPedido,
      pagamento: pedido.pagamentoStatus,
      rastreio: pedido.logistica?.codigoRastreio
        ? mascararTexto(pedido.logistica.codigoRastreio, 4)
        : null,
      situacao: pedido.status,
      total_em_centavos: pedido.totalEmCentavos,
    };
  },

  async consultarEnderecos(usuarioId: string) {
    const enderecos = await dbTransacional
      .select({
        bairro: enderecosClientesTable.bairro,
        cep: enderecosClientesTable.cep,
        cidade: enderecosClientesTable.cidade,
        estado: enderecosClientesTable.estado,
        principal: enderecosClientesTable.principal,
        rua: enderecosClientesTable.rua,
      })
      .from(enderecosClientesTable)
      .where(eq(enderecosClientesTable.userId, usuarioId))
      .limit(10);
    return enderecos.map((endereco) => ({
      bairro: mascararTexto(endereco.bairro),
      cep: `${endereco.cep.replace(/\D/g, "").slice(0, 3)}**-***`,
      cidade: endereco.cidade,
      estado: endereco.estado,
      principal: endereco.principal,
      rua: mascararTexto(endereco.rua),
    }));
  },
};

export type FontesFerramentasProtegidas = typeof fontesFerramentasProtegidasOficiais;
