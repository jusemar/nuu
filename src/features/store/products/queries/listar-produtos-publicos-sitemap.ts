import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { productTable } from "@/db/schema";

/** Usa os mesmos critérios que tornam a PDP acessível por slug. */
export async function listarProdutosPublicosSitemap() {
  return db
    .select({
      slug: productTable.slug,
      updatedAt: productTable.updatedAt,
    })
    .from(productTable)
    .where(
      and(
        eq(productTable.isActive, true),
        eq(productTable.status, "published"),
      ),
    );
}
