import { and, arrayContains, eq } from "drizzle-orm";

import { productTable } from "@/db/schema";

export function condicaoProdutoPublicoCategoria() {
  return and(
    eq(productTable.isActive, true),
    eq(productTable.status, "published"),
    arrayContains(productTable.storeProductFlags, ["general"]),
  );
}
