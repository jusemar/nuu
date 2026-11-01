import "server-only";

import { sql } from "drizzle-orm";
import { z } from "zod";

import { dbTransacional } from "@/db/transaction";

import { criarEnderecoPublicoJaaa } from "../../lib/jaaa/endereco-publico-jaaa";
import {
  type AtendimentoElegivelJaaa,
  consultaElegiveisJaaa,
} from "./elegibilidade-atendimento";
import { exigirRepresentanteJaaa } from "./exigir-acesso-jaaa";
/** Resolução pública mínima, sem cliente, pedido ou identificador de usuário exposto. Não cachear. */
export async function resolverDestinoProdutoJaaa(entrada: unknown) {
  const id = z.uuid().parse(entrada);
  const r = await dbTransacional.execute<AtendimentoElegivelJaaa>(
    consultaElegiveisJaaa({ produtoId: id, publico: true, escolhido: true }),
  );
  return r.rows.length === 1
    ? criarEnderecoPublicoJaaa(r.rows[0].identidade)
    : null;
}
export async function resolverMeuDestinoJaaa() {
  const c = await exigirRepresentanteJaaa();
  const r = await dbTransacional.execute<{ identidade: string }>(
    sql`select j.identidade from identidades_jaaa_representantes j where j.usuario_id=${c.userId} and j.ativa and exists(select 1 from administradores ad where ad.usuario_id=j.usuario_id and ad.status='ativo') and exists(select 1 from representantes_fornecedores r join fornecedores f on f.id=r.fornecedor_id where r.usuario_id=j.usuario_id and r.ativo and f.status='ativo')`,
  );
  return r.rows[0] ? criarEnderecoPublicoJaaa(r.rows[0].identidade) : null;
}
