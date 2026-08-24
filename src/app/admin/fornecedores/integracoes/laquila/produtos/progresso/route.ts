import { NextResponse } from "next/server";

import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";
import { obterProgressoRecebidosApiLaquila } from "@/features/fornecedores/integracoes/laquila/queries";

export async function GET() {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.FORNECEDORES.IMPORTAR);
  return NextResponse.json(obterProgressoRecebidosApiLaquila());
}
