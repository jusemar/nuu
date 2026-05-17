"use server";

import { desc, eq } from "drizzle-orm";

import { configuracoesPagamentoTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

import { configuracaoPagamentoSchema } from "../schemas/configuracao-pagamento.schema";

export async function atualizarConfiguracaoPagamento(data: unknown) {
  const dados = configuracaoPagamentoSchema.parse(data);

  return dbTransacional.transaction(async (tx) => {
    const configuracaoAtiva =
      await tx.query.configuracoesPagamentoTable.findFirst({
        where: eq(configuracoesPagamentoTable.ativo, true),
        orderBy: desc(configuracoesPagamentoTable.updatedAt),
      });

    if (!configuracaoAtiva) {
      const [configuracaoCriada] = await tx
        .insert(configuracoesPagamentoTable)
        .values({
          nome: "Configuração padrão",
          ativo: true,
          ...dados,
        })
        .returning();

      return configuracaoCriada;
    }

    const [configuracaoAtualizada] = await tx
      .update(configuracoesPagamentoTable)
      .set({
        ...dados,
        updatedAt: new Date(),
      })
      .where(eq(configuracoesPagamentoTable.id, configuracaoAtiva.id))
      .returning();

    return configuracaoAtualizada;
  });
}
