import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { importacoesFornecedorTable } from "@/db/schema";
import {
  type OrigemImportacaoFornecedor,
  origemDaImportacaoFornecedor,
} from "@/features/fornecedores/lib/origem-importacao-fornecedor";

/**
 * Resolve a origem lendo a própria importação.
 *
 * É o que permite que actions e queries compartilhadas (conciliação,
 * publicação, decisões em massa) sirvam às duas origens sem receber parâmetro
 * novo da interface: o `importacaoId` que elas já recebem carrega essa
 * informação. Devolve `null` quando a importação não existe.
 */
export async function buscarOrigemImportacaoFornecedor(
  importacaoId: string,
): Promise<OrigemImportacaoFornecedor | null> {
  const [importacao] = await db
    .select({
      tipoArquivo: importacoesFornecedorTable.tipoArquivo,
      configuracaoFluxoJson: importacoesFornecedorTable.configuracaoFluxoJson,
    })
    .from(importacoesFornecedorTable)
    .where(eq(importacoesFornecedorTable.id, importacaoId))
    .limit(1);

  return importacao ? origemDaImportacaoFornecedor(importacao) : null;
}
