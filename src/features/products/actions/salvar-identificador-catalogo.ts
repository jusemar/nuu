import { and, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { identificadoresCatalogoTable } from "@/db/schema";
import {
  classificarConflitoIdentificador,
  validarGtin,
  validarMpnBasico,
} from "@/features/products/lib/identificadores-catalogo";

type EscopoIdentificador =
  | { produtoId: string; varianteId?: never }
  | { produtoId?: never; varianteId: string };
type SalvarIdentificadorInput = EscopoIdentificador & {
  tipo: "gtin" | "mpn";
  valor: string;
  marcaId?: string | null;
  origem: "manual_admin" | "fornecedor_importacao";
  fornecedorId?: string | null;
  referenciaOrigem?: string | null;
  // Drizzle expõe tipos incompatíveis entre o driver HTTP e a transação pg,
  // embora ambos implementem estas operações em runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor?: any;
};

export class ErroIdentificadorCatalogo extends Error {}

function validarValor(input: SalvarIdentificadorInput) {
  if (input.tipo === "gtin") {
    const resultado = validarGtin(input.valor);
    if (!resultado.valido) {
      throw new ErroIdentificadorCatalogo(
        `GTIN inválido (${resultado.motivo.replaceAll("_", " ")}).`,
      );
    }
    return { valor: resultado.valor, gtinTipo: resultado.tipo };
  }

  const resultado = validarMpnBasico({
    valor: input.valor,
    declaradoExplicitamente: true,
  });
  if (!resultado.valido) {
    throw new ErroIdentificadorCatalogo(
      `MPN inválido (${resultado.motivo.replaceAll("_", " ")}).`,
    );
  }
  return { valor: resultado.valor, gtinTipo: null };
}

/**
 * Persiste um identificador sem permitir que uma importação substitua um valor
 * manual ou verificado. Valores divergentes ficam registrados como conflito.
 */
export async function salvarIdentificadorCatalogo(
  input: SalvarIdentificadorInput,
) {
  const executor = input.executor ?? db;
  const validado = validarValor(input);
  const condicaoEscopo = input.varianteId
    ? eq(identificadoresCatalogoTable.varianteId, input.varianteId)
    : eq(identificadoresCatalogoTable.produtoId, input.produtoId!);
  const [existente] = await executor
    .select()
    .from(identificadoresCatalogoTable)
    .where(
      and(
        condicaoEscopo,
        eq(identificadoresCatalogoTable.tipo, input.tipo),
        eq(identificadoresCatalogoTable.principal, true),
      ),
    )
    .limit(1);

  const recebido = {
    valor: validado.valor,
    origem: input.origem,
    status: "pendente" as const,
  };
  const decisao = classificarConflitoIdentificador({
    existente: existente
      ? {
          valor: existente.valor,
          origem: existente.origem,
          status: existente.status,
        }
      : null,
    recebido,
  });

  const base = {
    tipo: input.tipo,
    valor: validado.valor,
    gtinTipo: validado.gtinTipo,
    produtoId: input.produtoId ?? null,
    varianteId: input.varianteId ?? null,
    marcaId: input.marcaId ?? null,
    origem: input.origem,
    fornecedorId: input.fornecedorId ?? null,
    referenciaOrigem: input.referenciaOrigem ?? null,
    updatedAt: new Date(),
  };

  if (decisao.acao === "manter") {
    // Mesmo valor não é conflito, mas uma observação de fornecedor precisa
    // continuar rastreável sem tomar o lugar do registro principal existente.
    if (input.origem === "fornecedor_importacao") {
      await executor.insert(identificadoresCatalogoTable).values({
        ...base,
        status: "pendente",
        principal: false,
      });
    }
    return { situacao: "mantido" as const };
  }

  if (decisao.acao === "conflito") {
    await executor.insert(identificadoresCatalogoTable).values({
      ...base,
      status: "conflito",
      motivoStatus: decisao.motivo,
      principal: false,
    });
    return { situacao: "conflito" as const };
  }

  if (decisao.acao === "substituir" && existente) {
    await executor
      .update(identificadoresCatalogoTable)
      .set({ principal: false, status: "conflito", updatedAt: new Date() })
      .where(eq(identificadoresCatalogoTable.id, existente.id));
  }

  await executor.insert(identificadoresCatalogoTable).values({
    ...base,
    status: "pendente",
    principal: true,
  });
  return { situacao: "salvo" as const };
}

export async function removerIdentificadorManualNaoVerificado({
  tipo,
  produtoId,
  varianteId,
  executor = db,
}: EscopoIdentificador & {
  tipo: "gtin" | "mpn";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor?: any;
}) {
  const condicaoEscopo = varianteId
    ? eq(identificadoresCatalogoTable.varianteId, varianteId)
    : eq(identificadoresCatalogoTable.produtoId, produtoId!);
  await executor
    .delete(identificadoresCatalogoTable)
    .where(
      and(
        condicaoEscopo,
        eq(identificadoresCatalogoTable.tipo, tipo),
        eq(identificadoresCatalogoTable.origem, "manual_admin"),
        eq(identificadoresCatalogoTable.status, "pendente"),
      ),
    );
}
