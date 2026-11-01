import "server-only";

import { sql } from "drizzle-orm";

import { dbTransacional } from "@/db/transaction";

import { paginacaoJaaaSchema } from "../../schemas/jaaa/gestao-jaaa.schema";
import { exigirGestorRepresentantes } from "../representantes/exigir-gestor-representantes";
/** Cada página contém até 20 identidades já vinculadas; não expõe emails nem lista usuários comuns. */
export async function listarIdentidadesJaaaGestor(entrada: unknown) {
  await exigirGestorRepresentantes();
  const d = paginacaoJaaaSchema.parse(entrada);
  const fonte = sql`from "user" u where exists(select 1 from representantes_fornecedores r where r.usuario_id=u.id) and u.name ilike ${`%${d.busca}%`}`;
  const [lista, total] = await Promise.all([
    dbTransacional.execute<{
      id: string;
      nome: string;
      fornecedor: string;
      identidade: string;
      ativa: boolean;
      versao: string;
    }>(
      sql`select u.id,u.name as nome,coalesce((select string_agg(distinct f.nome,', ' order by f.nome) from representantes_fornecedores r join fornecedores f on f.id=r.fornecedor_id where r.usuario_id=u.id),'') as fornecedor,coalesce(j.identidade,'') as identidade,coalesce(j.ativa,false) as ativa,coalesce(j.updated_at::text,'novo') as versao from "user" u left join identidades_jaaa_representantes j on j.usuario_id=u.id where exists(select 1 from representantes_fornecedores r where r.usuario_id=u.id) and u.name ilike ${`%${d.busca}%`} order by u.name,u.id limit 20 offset ${(d.pagina - 1) * 20}`,
    ),
    dbTransacional.execute<{ total: string }>(
      sql`select count(*)::text as total ${fonte}`,
    ),
  ]);
  return {
    linhas: lista.rows,
    total: Number(total.rows[0].total),
    pagina: d.pagina,
  };
}
export async function listarProdutosAtendimentoJaaaGestor(entrada: unknown) {
  await exigirGestorRepresentantes();
  const d = paginacaoJaaaSchema.parse(entrada),
    fonte = sql`from product p where (exists(select 1 from autorizacoes_produtos_representantes a where a.produto_id=p.id) or exists(select 1 from atendimentos_jaaa_produtos e where e.produto_id=p.id)) and (p.name ilike ${`%${d.busca}%`} or p.sku ilike ${`%${d.busca}%`})`;
  const [lista, total] = await Promise.all([
    dbTransacional.execute<{ id: string; nome: string; sku: string }>(
      sql`select p.id,p.name as nome,p.sku ${fonte} order by p.name,p.id limit 20 offset ${(d.pagina - 1) * 20}`,
    ),
    dbTransacional.execute<{ total: string }>(
      sql`select count(*)::text as total ${fonte}`,
    ),
  ]);
  return {
    linhas: lista.rows,
    total: Number(total.rows[0].total),
    pagina: d.pagina,
  };
}
