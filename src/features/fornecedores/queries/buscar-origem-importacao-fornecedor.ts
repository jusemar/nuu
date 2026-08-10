import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { importacoesFornecedorTable } from "@/db/schema";
import { executarLeituraFornecedores } from "@/features/fornecedores/lib/leitura-segura-fornecedores";
import {
  origemDaImportacaoFornecedor,
  type OrigemImportacaoFornecedor,
} from "@/features/fornecedores/lib/origem-importacao-fornecedor";

/**
 * Resolve a origem lendo a própria importação.
 *
 * É o que permite que actions e queries compartilhadas (conciliação,
 * publicação, decisões em massa) sirvam às duas origens sem receber parâmetro
 * novo da interface: o `importacaoId` que elas já recebem carrega essa
 * informação. Devolve `null` quando a importação não existe.
 *
 * **Vai pela leitura protegida, como toda leitura deste fluxo.** Ela nasceu
 * como um `db.select()` cru — a única do módulo sem retentativa — e isso tinha
 * consequência visível: uma oscilação de conexão da Neon (`ETIMEDOUT`) DEPOIS
 * de uma escrita bem-sucedida derrubava a tela no error boundary. O gestor
 * clicava em "Ignorar", o status era gravado, e mesmo assim ele via um erro e
 * precisava sair e voltar para enxergar o próprio resultado. Uma consulta de
 * duas colunas não pode custar isso.
 */
export async function buscarOrigemImportacaoFornecedor(
  importacaoId: string,
): Promise<OrigemImportacaoFornecedor | null> {
  const [importacao] = await executarLeituraFornecedores(
    {
      etapa: "importacoes:resolver-origem",
      importacaoId,
      mensagemAmigavel:
        "Não foi possível identificar a origem desta importação agora. Tente novamente em alguns segundos.",
    },
    () =>
      db
        .select({
          tipoArquivo: importacoesFornecedorTable.tipoArquivo,
          configuracaoFluxoJson:
            importacoesFornecedorTable.configuracaoFluxoJson,
        })
        .from(importacoesFornecedorTable)
        .where(eq(importacoesFornecedorTable.id, importacaoId))
        .limit(1),
  );

  return importacao ? origemDaImportacaoFornecedor(importacao) : null;
}
