"use server";

import { and, eq, isNull, or } from "drizzle-orm";

import { checkoutClientesTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

export async function vincularPedidosVisitantesAoCliente({
  usuarioId,
  email,
  documento,
}: {
  usuarioId: string;
  email: string;
  documento?: string | null;
}) {
  const emailNormalizado = email.trim().toLowerCase();
  const documentoNormalizado = documento?.replace(/\D/g, "") ?? null;

  if (!emailNormalizado && !documentoNormalizado) {
    return;
  }

  await dbTransacional
    .update(checkoutClientesTable)
    .set({
      userId: usuarioId,
      updatedAt: new Date(),
    })
    .where(
      and(
        documentoNormalizado
          ? or(
              eq(checkoutClientesTable.email, emailNormalizado),
              eq(checkoutClientesTable.documento, documentoNormalizado),
            )
          : eq(checkoutClientesTable.email, emailNormalizado),
        or(
          isNull(checkoutClientesTable.userId),
          eq(checkoutClientesTable.userId, usuarioId),
        ),
      ),
    );
}
