import "server-only";

import { and, asc, eq, ilike, or } from "drizzle-orm";

import { db } from "../../../db/connection";
import {
  provedoresFreteTable,
  servicosFreteTable,
  transportadorasFreteTable,
} from "../../../db/schema";
import {
  montarCodigoServicoPromocional,
  montarCodigoTransportadoraPromocional,
} from "../lib/codigos-frete-promocional";
import { buscarFretesServicosPromocaoAdminSchema } from "../schemas";
import type { FreteServicoPromocaoAdmin } from "../types";

export async function buscarFretesServicosPromocaoAdmin(
  entrada: unknown,
): Promise<FreteServicoPromocaoAdmin[]> {
  const filtros = buscarFretesServicosPromocaoAdminSchema.parse(entrada);
  const buscaLike = `%${filtros.busca}%`;

  const [transportadoras, servicos] = await Promise.all([
    db
      .select({
        identificador: transportadorasFreteTable.identificador,
        nome: transportadorasFreteTable.nome,
        provedorIdentificador: provedoresFreteTable.identificador,
        provedorNome: provedoresFreteTable.nome,
      })
      .from(transportadorasFreteTable)
      .innerJoin(
        provedoresFreteTable,
        eq(transportadorasFreteTable.provedorFreteId, provedoresFreteTable.id),
      )
      .where(
        and(
          eq(transportadorasFreteTable.ativo, true),
          eq(provedoresFreteTable.ativo, true),
          or(
            ilike(transportadorasFreteTable.nome, buscaLike),
            ilike(transportadorasFreteTable.identificador, buscaLike),
            ilike(provedoresFreteTable.nome, buscaLike),
            ilike(provedoresFreteTable.identificador, buscaLike),
          ),
        ),
      )
      .orderBy(
        asc(provedoresFreteTable.nome),
        asc(transportadorasFreteTable.nome),
      )
      .limit(filtros.limite),
    db
      .select({
        identificador: servicosFreteTable.identificador,
        nome: servicosFreteTable.nome,
        provedorIdentificador: provedoresFreteTable.identificador,
        provedorNome: provedoresFreteTable.nome,
        transportadoraNome: transportadorasFreteTable.nome,
      })
      .from(servicosFreteTable)
      .innerJoin(
        provedoresFreteTable,
        eq(servicosFreteTable.provedorFreteId, provedoresFreteTable.id),
      )
      .leftJoin(
        transportadorasFreteTable,
        eq(
          servicosFreteTable.transportadoraFreteId,
          transportadorasFreteTable.id,
        ),
      )
      .where(
        and(
          eq(servicosFreteTable.ativo, true),
          eq(provedoresFreteTable.ativo, true),
          or(
            ilike(servicosFreteTable.nome, buscaLike),
            ilike(servicosFreteTable.identificador, buscaLike),
            ilike(provedoresFreteTable.nome, buscaLike),
            ilike(provedoresFreteTable.identificador, buscaLike),
            ilike(transportadorasFreteTable.nome, buscaLike),
          ),
        ),
      )
      .orderBy(asc(provedoresFreteTable.nome), asc(servicosFreteTable.nome))
      .limit(filtros.limite),
  ]);

  return [
    ...transportadoras.map((transportadora) => ({
      codigo:
        montarCodigoTransportadoraPromocional({
          provedor: transportadora.provedorIdentificador,
          transportadora: transportadora.identificador,
        }) ?? "",
      nome: transportadora.nome,
      tipo: "transportadora" as const,
      descricao: `${transportadora.provedorNome} · ${transportadora.identificador}`,
    })),
    ...servicos.map((servico) => ({
      codigo:
        montarCodigoServicoPromocional({
          provedor: servico.provedorIdentificador,
          servico: servico.identificador,
        }) ?? "",
      nome: servico.transportadoraNome
        ? `${servico.transportadoraNome} · ${servico.nome}`
        : servico.nome,
      tipo: "servico" as const,
      descricao: `${servico.provedorNome} · ${servico.identificador}`,
    })),
  ]
    .filter((item) => item.codigo)
    .slice(0, filtros.limite);
}
