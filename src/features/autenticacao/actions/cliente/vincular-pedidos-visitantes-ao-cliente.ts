"use server";

import { and, eq, isNull, or } from "drizzle-orm";

import { checkoutClientesTable } from "@/db/schema";
import { dbTransacional } from "@/db/transaction";

export async function vincularPedidosVisitantesAoCliente({
  usuarioId,
  email,
}: {
  usuarioId: string;
  email: string;
}) {
  const emailNormalizado = email.trim().toLowerCase();

  if (!emailNormalizado) {
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
        eq(checkoutClientesTable.email, emailNormalizado),
        or(
          isNull(checkoutClientesTable.userId),
          eq(checkoutClientesTable.userId, usuarioId),
        ),
      ),
    );
}
