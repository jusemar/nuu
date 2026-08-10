import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db/connection";
import { fornecedorProdutosStagingTable, produtoRascunhosTable } from "@/db/schema";

import {
  encerrarComFalhaDeDestino,
  exigirBancoLocal,
} from "./lib/guarda-banco-local";

/**
 * Corrige o `criterio_localizacao` gravado como decisão que ninguém tomou.
 *
 * A análise automática marcava `novo_produto_fornecedor` em TODA linha sem
 * vínculo encontrado, e a tela lia isso como "o gestor mandou criar produto
 * novo". Resultado: itens jamais tocados apareciam como "Novos" e o balde
 * "Pendentes" ficava permanentemente vazio.
 *
 * O código passou a gravar `sem_vinculo_encontrado`, que é o que o campo
 * realmente descreve. Este script alinha as linhas antigas.
 *
 * Conservador de propósito: só converte linhas SEM rascunho de criação. Se
 * existe rascunho, houve decisão de verdade em algum momento e o valor fica
 * como está — este script não apaga histórico de decisão.
 *
 * Uso: `npm run corrigir:criterio-localizacao`
 */
async function executar() {
  await exigirBancoLocal(["desenvolvimento"]);

  const semRascunhoDeCriacao = sql`not exists (
    select 1
      from ${produtoRascunhosTable} pr
     where pr.dados_origem_json->'origemFluxoFornecedor'->>'stagingId' = ${fornecedorProdutosStagingTable.id}::text
       and pr.produto_atualizado_id is null
  )`;

  const [antes] = await db
    .select({
      total: sql<number>`count(*)`,
      alvo: sql<number>`count(*) filter (where ${semRascunhoDeCriacao})`,
      comDecisaoReal: sql<number>`count(*) filter (where not (${semRascunhoDeCriacao}))`,
    })
    .from(fornecedorProdutosStagingTable)
    .where(
      eq(
        fornecedorProdutosStagingTable.criterioLocalizacao,
        "novo_produto_fornecedor",
      ),
    );

  console.log("\n=== ANTES ===");
  console.log(`  linhas com 'novo_produto_fornecedor' : ${antes?.total ?? 0}`);
  console.log(`  sem rascunho (serão convertidas)     : ${antes?.alvo ?? 0}`);
  console.log(`  com rascunho (preservadas)           : ${antes?.comDecisaoReal ?? 0}`);

  if (Number(antes?.alvo ?? 0) === 0) {
    console.log("\nNada a corrigir.");
    return;
  }

  const convertidas = await db
    .update(fornecedorProdutosStagingTable)
    .set({
      criterioLocalizacao: "sem_vinculo_encontrado",
      atualizadoEm: new Date(),
    })
    .where(
      and(
        eq(
          fornecedorProdutosStagingTable.criterioLocalizacao,
          "novo_produto_fornecedor",
        ),
        semRascunhoDeCriacao,
      ),
    )
    .returning({ id: fornecedorProdutosStagingTable.id });

  const [depois] = await db
    .select({
      aindaNovo: sql<number>`count(*) filter (where ${fornecedorProdutosStagingTable.criterioLocalizacao} = 'novo_produto_fornecedor')`,
      semVinculo: sql<number>`count(*) filter (where ${fornecedorProdutosStagingTable.criterioLocalizacao} = 'sem_vinculo_encontrado')`,
      semCriterio: sql<number>`count(*) filter (where ${fornecedorProdutosStagingTable.criterioLocalizacao} is null)`,
    })
    .from(fornecedorProdutosStagingTable);

  console.log("\n=== DEPOIS ===");
  console.log(`  convertidas                          : ${convertidas.length}`);
  console.log(`  ainda 'novo_produto_fornecedor'      : ${depois?.aindaNovo ?? 0}`);
  console.log(`  'sem_vinculo_encontrado'             : ${depois?.semVinculo ?? 0}`);
  console.log(`  sem critério                         : ${depois?.semCriterio ?? 0}\n`);
}

executar().catch(encerrarComFalhaDeDestino);
