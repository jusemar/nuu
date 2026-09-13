"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/connection";
import {
  agendasGeograficasEntregaPropria,
  bairrosEntregaPropria,
  cepsEspecificos,
  cities,
  datasBloqueadasAgendaEntregaPropria,
  shippingRegions,
} from "@/db/schema";
import { dbTransacional } from "@/db/transaction";
import { PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { exigirPermissaoAdmin } from "@/features/autenticacao/lib/autorizacao-admin/servico-autorizacao-admin";

import {
  type AgendaGeograficaEntregaPropriaInput,
  agendaGeograficaEntregaPropriaSchema,
  destinoAgendaGeograficaEntregaPropriaSchema,
} from "../schemas/agenda-geografica-entrega-propria.schema";

const CAMINHO_AGENDA = "/admin/logistics/entrega-propria/agenda";

function filtroDestino(
  tipo: AgendaGeograficaEntregaPropriaInput["tipoDestino"],
  destinoId: number,
) {
  if (tipo === "cidade") {
    return and(
      eq(agendasGeograficasEntregaPropria.tipoDestino, "cidade"),
      eq(agendasGeograficasEntregaPropria.cidadeId, destinoId),
    );
  }
  if (tipo === "regiao") {
    return and(
      eq(agendasGeograficasEntregaPropria.tipoDestino, "regiao"),
      eq(agendasGeograficasEntregaPropria.regiaoId, destinoId),
    );
  }
  if (tipo === "bairro") {
    return and(
      eq(agendasGeograficasEntregaPropria.tipoDestino, "bairro"),
      eq(agendasGeograficasEntregaPropria.bairroId, destinoId),
    );
  }
  return and(
    eq(agendasGeograficasEntregaPropria.tipoDestino, "cep"),
    eq(agendasGeograficasEntregaPropria.cepEspecificoId, destinoId),
  );
}

async function validarDestino(
  tipo: AgendaGeograficaEntregaPropriaInput["tipoDestino"],
  destinoId: number,
) {
  if (tipo === "cidade") {
    return db.query.cities.findFirst({
      where: eq(cities.id, destinoId),
      columns: { id: true },
    });
  }
  if (tipo === "regiao") {
    return db.query.shippingRegions.findFirst({
      where: eq(shippingRegions.id, destinoId),
      columns: { id: true },
    });
  }
  if (tipo === "bairro") {
    return db.query.bairrosEntregaPropria.findFirst({
      where: eq(bairrosEntregaPropria.id, destinoId),
      columns: { id: true },
    });
  }
  return db.query.cepsEspecificos.findFirst({
    where: eq(cepsEspecificos.id, destinoId),
    columns: { id: true },
  });
}

function referenciasDestino(
  tipo: AgendaGeograficaEntregaPropriaInput["tipoDestino"],
  destinoId: number,
) {
  return {
    tipoDestino: tipo,
    cidadeId: tipo === "cidade" ? destinoId : null,
    regiaoId: tipo === "regiao" ? destinoId : null,
    bairroId: tipo === "bairro" ? destinoId : null,
    cepEspecificoId: tipo === "cep" ? destinoId : null,
  };
}

export async function salvarAgendaGeograficaEntregaPropria(entrada: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const validacao = agendaGeograficaEntregaPropriaSchema.safeParse(entrada);
  if (!validacao.success) {
    return {
      sucesso: false as const,
      erro: validacao.error.issues[0]?.message ?? "Revise a agenda informada.",
    };
  }

  const dados = validacao.data;
  if (!(await validarDestino(dados.tipoDestino, dados.destinoId))) {
    return { sucesso: false as const, erro: "Destino não encontrado." };
  }

  const filtro = filtroDestino(dados.tipoDestino, dados.destinoId);
  const existente = await db.query.agendasGeograficasEntregaPropria.findFirst({
    where: filtro,
  });

  await dbTransacional.transaction(async (tx) => {
    const valores = {
      ...referenciasDestino(dados.tipoDestino, dados.destinoId),
      ativa: true,
      diasAtendidos: [...new Set(dados.diasAtendidos)].sort((a, b) => a - b),
      horarioCorte: dados.horarioCorte,
      updatedAt: new Date(),
    };
    const agenda = existente
      ? (
          await tx
            .update(agendasGeograficasEntregaPropria)
            .set(valores)
            .where(eq(agendasGeograficasEntregaPropria.id, existente.id))
            .returning({ id: agendasGeograficasEntregaPropria.id })
        )[0]!
      : (
          await tx
            .insert(agendasGeograficasEntregaPropria)
            .values({ ...valores, createdAt: new Date() })
            .returning({ id: agendasGeograficasEntregaPropria.id })
        )[0]!;

    await tx
      .delete(datasBloqueadasAgendaEntregaPropria)
      .where(eq(datasBloqueadasAgendaEntregaPropria.agendaId, agenda.id));
    if (dados.datasBloqueadas.length > 0) {
      await tx.insert(datasBloqueadasAgendaEntregaPropria).values(
        [...new Set(dados.datasBloqueadas)].map((data) => ({
          agendaId: agenda.id,
          data,
        })),
      );
    }
  });

  revalidatePath(CAMINHO_AGENDA);
  revalidatePath("/admin/products");
  return { sucesso: true as const };
}

/**
 * Remove a agenda própria de um destino. A partir daí o motor único volta a
 * usar a agenda do nível superior (herança CEP → Bairro → Região → Cidade).
 */
export async function removerAgendaPropriaParaHerdar(entrada: unknown) {
  await exigirPermissaoAdmin(PERMISSOES_ADMIN.LOGISTICA.ADMINISTRAR);
  const validacao =
    destinoAgendaGeograficaEntregaPropriaSchema.safeParse(entrada);
  if (!validacao.success) {
    return { sucesso: false as const, erro: "Destino inválido." };
  }

  const { tipoDestino, destinoId } = validacao.data;
  await db
    .delete(agendasGeograficasEntregaPropria)
    .where(filtroDestino(tipoDestino, destinoId));
  revalidatePath(CAMINHO_AGENDA);
  revalidatePath("/admin/products");
  return { sucesso: true as const };
}
