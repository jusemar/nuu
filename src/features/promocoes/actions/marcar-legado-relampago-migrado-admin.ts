"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { productPricingTable } from "../../../db/schema";
import { dbTransacional } from "../../../db/transaction";
import { diagnosticarOfertasRelampagoAdmin } from "../queries";
import { marcarLegadoRelampagoMigradoAdminSchema } from "../schemas";

function revalidarDiagnosticoRelampagoAdmin() {
  try {
    revalidatePath("/admin/marketing/promocoes/diagnostico-relampago");
  } catch {
    // Execuções administrativas fora do runtime Next não possuem static store.
  }
}

export async function marcarLegadoRelampagoMigradoAdmin(entrada: unknown) {
  const dados = marcarLegadoRelampagoMigradoAdminSchema.parse(entrada);
  const diagnostico = await diagnosticarOfertasRelampagoAdmin();
  const item = diagnostico.itens.find(
    (itemDiagnostico) =>
      itemDiagnostico.produtoId === dados.produtoId &&
      itemDiagnostico.modalidade === dados.modalidade,
  );

  if (!item) {
    throw new Error("Item de diagnóstico não encontrado.");
  }

  if (item.status !== "oficial_validado") {
    throw new Error("A oferta ainda não está validada para migração.");
  }

  if (!item.oficial.ativo || !item.legado.ativo) {
    throw new Error("Migração permitida apenas com oficial e legado ativos.");
  }

  if (!item.oficial.regraPromocaoId) {
    throw new Error("Regra oficial não encontrada para vincular migração.");
  }

  const countdownOficial = item.oficial.countdownDataFim?.toISOString() ?? null;
  const countdownLegado = item.legado.countdownDataFim?.toISOString() ?? null;

  if (
    item.oficial.precoPromocionalEmCentavos !==
      item.legado.precoPromocionalEmCentavos ||
    item.oficial.badge !== item.legado.badge ||
    countdownOficial !== countdownLegado
  ) {
    throw new Error("Oficial e legado divergiram antes da migração.");
  }

  const resultado = await dbTransacional
    .update(productPricingTable)
    .set({
      legadoPromocaoMigradoEm: new Date(),
      legadoPromocaoMigradoParaRegraId: item.oficial.regraPromocaoId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(productPricingTable.productId, dados.produtoId),
        eq(productPricingTable.type, dados.modalidade),
        eq(productPricingTable.hasPromo, true),
        eq(productPricingTable.promoType, "flash"),
        eq(
          productPricingTable.promoPrice,
          item.legado.precoPromocionalEmCentavos!,
        ),
        isNull(productPricingTable.legadoPromocaoMigradoEm),
      ),
    )
    .returning({ id: productPricingTable.id });

  if (resultado.length !== 1) {
    throw new Error("Nenhum legado elegível foi marcado para migração.");
  }

  revalidarDiagnosticoRelampagoAdmin();

  return {
    success: true,
    productPricingId: resultado[0]!.id,
    regraPromocaoId: item.oficial.regraPromocaoId,
  };
}
