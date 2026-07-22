import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import {
  cartTable,
  enderecosClientesTable,
  shippingAddressTable,
} from "@/db/schema";

import { resolverCepEnderecoCliente } from "../../lib/cep-cliente";

export async function buscarCepEnderecoCliente(usuarioId: string) {
  const [carrinho, enderecoPrincipal, enderecoPadraoLegado] = await Promise.all(
    [
      db.query.cartTable.findFirst({
        where: eq(cartTable.userId, usuarioId),
        with: { shippingAddress: true },
      }),
      db.query.enderecosClientesTable.findFirst({
        where: and(
          eq(enderecosClientesTable.userId, usuarioId),
          eq(enderecosClientesTable.principal, true),
        ),
      }),
      // Compatibilidade com o checkout antigo, cujos endereços não possuem flag
      // de principal. O mais antigo funciona como padrão.
      db.query.shippingAddressTable.findFirst({
        where: eq(shippingAddressTable.userId, usuarioId),
        orderBy: asc(shippingAddressTable.createdAt),
      }),
    ],
  );

  return resolverCepEnderecoCliente({
    cepSelecionado: carrinho?.shippingAddress?.zipCode,
    cepPrincipal: enderecoPrincipal?.cep,
    cepPadrao: enderecoPadraoLegado?.zipCode,
  });
}
