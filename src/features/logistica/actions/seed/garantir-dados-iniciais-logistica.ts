"use server";

import { db } from "@/db/connection";
import {
  provedoresFreteTable,
  servicosFreteTable,
  tiposLogisticosTable,
  transportadorasFreteTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";

import { planejarSeedDadosIniciaisLogistica } from "../../lib/seeds/dados-iniciais-logistica";

export async function garantirDadosIniciaisLogistica() {
  const [provedores, tipos, transportadoras, servicos] = await Promise.all([
    db.select().from(provedoresFreteTable),
    db.select().from(tiposLogisticosTable),
    db
      .select({
        identificador: transportadorasFreteTable.identificador,
        provedorIdentificador: provedoresFreteTable.identificador,
      })
      .from(transportadorasFreteTable)
      .innerJoin(provedoresFreteTable, eq(transportadorasFreteTable.provedorFreteId, provedoresFreteTable.id)),
    db
      .select({
        identificador: servicosFreteTable.identificador,
        provedorIdentificador: provedoresFreteTable.identificador,
      })
      .from(servicosFreteTable)
      .innerJoin(provedoresFreteTable, eq(servicosFreteTable.provedorFreteId, provedoresFreteTable.id)),
  ]);

  const plano = planejarSeedDadosIniciaisLogistica({
    provedoresExistentes: provedores,
    tiposExistentes: tipos,
    transportadorasExistentes: transportadoras,
    servicosExistentes: servicos,
  });

  if (plano.provedoresCriar.length > 0) {
    await db.insert(provedoresFreteTable).values(plano.provedoresCriar);
  }

  if (plano.tiposCriar.length > 0) {
    await db.insert(tiposLogisticosTable).values(plano.tiposCriar);
  }

  const provedoresAtualizados = await db.select().from(provedoresFreteTable);
  const provedorPorIdentificador = new Map(
    provedoresAtualizados.map((item) => [item.identificador, item.id]),
  );

  if (plano.transportadorasCriar.length > 0) {
    await db.insert(transportadorasFreteTable).values(
      plano.transportadorasCriar
        .map((item) => ({
          identificador: item.identificador,
          nome: item.nome,
          ativo: item.ativo,
          provedorFreteId: provedorPorIdentificador.get(item.provedorIdentificador) ?? null,
        }))
        .filter((item) => item.provedorFreteId !== null) as Array<{
        identificador: string;
        nome: string;
        ativo: boolean;
        provedorFreteId: string;
      }>,
    );
  }

  const transportadorasAtualizadas = await db
    .select({
      id: transportadorasFreteTable.id,
      identificador: transportadorasFreteTable.identificador,
      provedorIdentificador: provedoresFreteTable.identificador,
    })
    .from(transportadorasFreteTable)
    .innerJoin(
      provedoresFreteTable,
      eq(transportadorasFreteTable.provedorFreteId, provedoresFreteTable.id),
    );
  const transportadoraPorChave = new Map(
    transportadorasAtualizadas.map((item) => [
      `${item.provedorIdentificador}::${item.identificador}`,
      item.id,
    ]),
  );

  if (plano.servicosCriar.length > 0) {
    await db.insert(servicosFreteTable).values(
      plano.servicosCriar
        .map((item) => ({
          identificador: item.identificador,
          nome: item.nome,
          ativo: item.ativo,
          provedorFreteId: provedorPorIdentificador.get(item.provedorIdentificador) ?? null,
          transportadoraFreteId: item.transportadoraIdentificador
            ? (transportadoraPorChave.get(
                `${item.provedorIdentificador}::${item.transportadoraIdentificador}`,
              ) ?? null)
            : null,
        }))
        .filter((item) => item.provedorFreteId !== null) as Array<{
        identificador: string;
        nome: string;
        ativo: boolean;
        provedorFreteId: string;
        transportadoraFreteId: string | null;
      }>,
    );
  }

  return {
    sucesso: true as const,
    inseridos: {
      provedores: plano.provedoresCriar.length,
      tiposLogisticos: plano.tiposCriar.length,
      transportadoras: plano.transportadorasCriar.length,
      servicos: plano.servicosCriar.length,
    },
  };
}

