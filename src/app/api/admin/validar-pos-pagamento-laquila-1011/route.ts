import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/connection";
import { fornecedorPedidoIntegracoesTable } from "@/db/schema";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { processarIntegracoesFornecedoresAposPagamento } from "@/features/fornecedores/actions/processar-integracoes-fornecedores-apos-pagamento";
import { exigirAcessoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";

export const runtime = "nodejs";
export const maxDuration = 180;

const PEDIDO_ID = "99712190-84b8-492d-93d6-bdceba172109";
const INTEGRACAO_ID = "628fa4d6-e5e7-448b-8587-de7c495cb9bf";
const ID_PEDIDO_EXTERNO = "1133591";

async function buscarIntegracao() {
  const [integracao] = await db
    .select({
      id: fornecedorPedidoIntegracoesTable.id,
      status: fornecedorPedidoIntegracoesTable.status,
      idPedidoExterno: fornecedorPedidoIntegracoesTable.idPedidoExterno,
      tentativas: fornecedorPedidoIntegracoesTable.tentativas,
      payloadSanitizado: fornecedorPedidoIntegracoesTable.payloadSanitizado,
    })
    .from(fornecedorPedidoIntegracoesTable)
    .where(
      and(
        eq(fornecedorPedidoIntegracoesTable.id, INTEGRACAO_ID),
        eq(fornecedorPedidoIntegracoesTable.pedidoId, PEDIDO_ID),
        eq(fornecedorPedidoIntegracoesTable.ambiente, "producao"),
        eq(fornecedorPedidoIntegracoesTable.provedor, "laquila"),
      ),
    )
    .limit(1);

  return integracao;
}

/** Diagnóstico temporário, autenticado e fixo no pedido já criado na Laquila. */
export async function POST() {
  await exigirAcessoFornecedoresAdmin(PERMISSOES_ADMIN.FORNECEDORES.IMPORTAR);

  const antes = await buscarIntegracao();
  if (
    !antes ||
    antes.status !== "criado" ||
    antes.idPedidoExterno !== ID_PEDIDO_EXTERNO ||
    antes.tentativas !== 1
  ) {
    return NextResponse.json(
      { erro: "Pré-condições idempotentes do pedido #1011 não atendidas." },
      { status: 409 },
    );
  }

  const resultado =
    await processarIntegracoesFornecedoresAposPagamento(PEDIDO_ID);
  const depois = await buscarIntegracao();

  return NextResponse.json({
    pedido: "#1011",
    estado: resultado.estado,
    integracao: {
      status: depois?.status ?? null,
      idPedidoExterno: depois?.idPedidoExterno ?? null,
      tentativasAntes: antes.tentativas,
      tentativasDepois: depois?.tentativas ?? null,
      consulta00008:
        depois?.payloadSanitizado?.consulta00008 ?? "nao_registrada",
    },
    garantias: {
      idExternoPreservado:
        depois?.idPedidoExterno === antes.idPedidoExterno &&
        depois?.idPedidoExterno === ID_PEDIDO_EXTERNO,
      nenhumaTentativa00002Adicional:
        depois?.tentativas === antes.tentativas && depois?.tentativas === 1,
    },
  });
}
