import "server-only";

import { sql } from "drizzle-orm";

import { dbTransacional } from "@/db/transaction";

import { obterAcessoPainelComissoes } from "./acesso-painel";
export async function buscarOpcoesFiltrosComissoes() {
  const a = await obterAcessoPainelComissoes();
  if (!a.gestor) return { representantes: [], fornecedores: [] };
  const [r, f] = await Promise.all([
    dbTransacional.execute<{ id: string; nome: string }>(
      sql`select distinct u.id,u.name as nome from checkout_item_comissoes c join "user" u on u.id=c.representante_usuario_id order by nome,id`,
    ),
    dbTransacional.execute<{ id: string; nome: string }>(
      sql`select distinct f.id,f.nome from checkout_item_comissoes c join fornecedores f on f.id=c.fornecedor_id order by nome,id`,
    ),
  ]);
  return { representantes: r.rows, fornecedores: f.rows };
}
