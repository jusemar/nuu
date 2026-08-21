import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  checkoutClientesTable,
  checkoutPedidoItensTable,
  checkoutPedidoLogisticasTable,
  checkoutPedidosTable,
  fornecedorProdutoVinculosTable,
} from "@/db/schema";
import type { SnapshotFreteCheckoutVersao2 } from "@/features/checkout/types/snapshot-frete.types";

import {
  criarChaveIdempotenciaPedidoLaquila,
  gerarHashPayloadPedidoLaquila,
  montarPedidoLaquilaSemCredenciais,
  sanitizarPedidoLaquila,
} from "../lib/montar-pedido-laquila";
import { buscarConfiguracaoLaquilaAdmin } from "./buscar-configuracao-laquila";
import { prepararContextoTransportadorLaquila } from "./preparar-contexto-transportador-laquila";

/** Prepara exclusivamente com snapshots e dados históricos persistidos no servidor. */
export async function prepararPedidoLaquila(pedidoId: string) {
  const configuracao = await buscarConfiguracaoLaquilaAdmin();
  if (!configuracao?.ativo || !configuracao.tokenCliente) {
    throw new Error("Integração Laquila ativa e credenciada não encontrada.");
  }
  const tokenCliente = configuracao.tokenCliente;
  const cnpjLojista = process.env.LAQUILA_CNPJ_LOJISTA?.trim();
  if (!cnpjLojista) {
    throw new Error(
      "Configure LAQUILA_CNPJ_LOJISTA antes de preparar o pedido.",
    );
  }

  const [pedido] = await db
    .select({
      id: checkoutPedidosTable.id,
      pagamentoStatus: checkoutPedidosTable.pagamentoStatus,
      nome: checkoutClientesTable.nome,
      email: checkoutClientesTable.email,
      telefone: checkoutClientesTable.telefone,
      documento: checkoutClientesTable.documento,
      snapshotFrete: checkoutPedidoLogisticasTable.snapshotFrete,
    })
    .from(checkoutPedidosTable)
    .innerJoin(
      checkoutClientesTable,
      eq(checkoutClientesTable.id, checkoutPedidosTable.clienteId),
    )
    .innerJoin(
      checkoutPedidoLogisticasTable,
      eq(checkoutPedidoLogisticasTable.pedidoId, checkoutPedidosTable.id),
    )
    .where(eq(checkoutPedidosTable.id, pedidoId))
    .limit(1);

  if (!pedido) throw new Error("Pedido interno não encontrado.");
  if (pedido.pagamentoStatus !== "paid") {
    throw new Error(
      "O pedido Laquila só pode ser preparado após pagamento confirmado.",
    );
  }

  const snapshot = pedido.snapshotFrete;
  if (!snapshot || snapshot.versao !== "2") {
    throw new Error("Pedido sem snapshot logístico v2 válido.");
  }

  const grupos = (snapshot as SnapshotFreteCheckoutVersao2).grupos.filter(
    (grupo) =>
      grupo.origemExpedicao === "fornecedor" &&
      grupo.fornecedorProvedor?.toLowerCase() === "laquila",
  );

  if (grupos.length === 0) return [];

  const itensPersistidos = await db
    .select({
      produtoId: checkoutPedidoItensTable.produtoId,
      varianteId: checkoutPedidoItensTable.varianteId,
      quantidade: checkoutPedidoItensTable.quantidade,
      precoUnitarioEmCentavos: checkoutPedidoItensTable.precoUnitarioEmCentavos,
    })
    .from(checkoutPedidoItensTable)
    .where(eq(checkoutPedidoItensTable.pedidoId, pedidoId));

  const produtoIds = [
    ...new Set(
      grupos.flatMap((grupo) => grupo.itens.map((item) => item.produtoId)),
    ),
  ];
  const vinculos = await db
    .select({
      produtoId: fornecedorProdutoVinculosTable.produtoId,
      fornecedorId: fornecedorProdutoVinculosTable.fornecedorId,
      codigoFornecedor: fornecedorProdutoVinculosTable.codigoFornecedor,
    })
    .from(fornecedorProdutoVinculosTable)
    .where(
      and(
        inArray(fornecedorProdutoVinculosTable.produtoId, produtoIds),
        eq(
          fornecedorProdutoVinculosTable.fornecedorId,
          configuracao.fornecedorId,
        ),
        eq(fornecedorProdutoVinculosTable.status, "ativo"),
      ),
    );

  return Promise.all(
    grupos.map(async (grupo) => {
      const transportador = await prepararContextoTransportadorLaquila(grupo);
      if (transportador.estado !== "resolvido") {
        throw new Error(
          `Transportador Laquila não resolvido: ${transportador.motivo}.`,
        );
      }
      if (!("cdTransportadorLaquila" in transportador)) {
        throw new Error(
          "Contexto operacional do transportador Laquila incompleto.",
        );
      }

      const itens = grupo.itens.map((itemGrupo) => {
        const itemPedido = itensPersistidos.find(
          (item) =>
            item.produtoId === itemGrupo.produtoId &&
            item.varianteId === itemGrupo.varianteId,
        );
        const vinculo = vinculos.find(
          (item) => item.produtoId === itemGrupo.produtoId,
        );

        if (!itemPedido)
          throw new Error("Item Laquila não encontrado no pedido persistido.");
        if (!vinculo?.codigoFornecedor) {
          throw new Error("Item Laquila sem código de fornecedor ativo.");
        }

        return {
          codigoFornecedor: vinculo.codigoFornecedor,
          quantidade: itemPedido.quantidade,
          // Fonte oficial histórica: preço gravado antes do cupom global.
          precoUnitarioEmCentavos: itemPedido.precoUnitarioEmCentavos,
        };
      });

      const pedidoSemCredenciais = montarPedidoLaquilaSemCredenciais({
        documento: pedido.documento,
        cnpjLojista,
        nome: pedido.nome,
        email: pedido.email,
        telefone: pedido.telefone,
        cdTransportador: transportador.cdTransportadorLaquila,
        itens,
      });

      return {
        pedidoId,
        fornecedorId: configuracao.fornecedorId,
        chaveGrupo: grupo.chaveGrupo,
        chaveIdempotencia: criarChaveIdempotenciaPedidoLaquila(
          pedidoId,
          grupo.chaveGrupo,
        ),
        hashPayload: gerarHashPayloadPedidoLaquila(pedidoSemCredenciais),
        payloadSanitizado: sanitizarPedidoLaquila(pedidoSemCredenciais),
        pedidoSemCredenciais,
        credenciais: {
          cnpjEmpresa: configuracao.cnpjEmpresa,
          tokenCliente,
          configuracao,
        },
      };
    }),
  );
}
