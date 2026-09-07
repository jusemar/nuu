"use server";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirAcessoFornecedoresAdmin } from "@/features/fornecedores/lib/sessao-fornecedores-admin";

import { executarPedidoLaquila } from "./executar-pedido-laquila";

/** Reprocessamento administrativo protegido; usa o mesmo núcleo idempotente. */
export async function processarPedidoLaquila00002(pedidoId: string) {
  await exigirAcessoFornecedoresAdmin(PERMISSOES_ADMIN.FORNECEDORES.IMPORTAR);

  return executarPedidoLaquila(pedidoId, {
    permitirReprocessarFalhaComTentativa: true,
  });
}
