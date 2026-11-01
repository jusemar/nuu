import type { Pool } from "pg";

import { prepararFixturePainel } from "@/features/checkout/testes/painel-comissoes/fixture-painel";
/** Reutiliza dados descartáveis; não executa testes nem regras das etapas anteriores. */
export async function prepararFixtureJaaa(pool: Pool) {
  const base = await prepararFixturePainel(pool);
  await pool.query(
    "UPDATE product SET name='Mouse sem fio',status='published',is_active=true WHERE id=$1",
    [base.produtoId],
  );
  await pool.query(
    "INSERT INTO product_pricing(product_id,type,price_in_cents,main_card_price) VALUES($1,'dropshipping',10000,true)",
    [base.produtoId],
  );
  await pool.query(
    "INSERT INTO fornecedor_produto_vinculos(fornecedor_id,produto_id) VALUES($1,$3),($2,$3)",
    [base.fornecedorA, base.fornecedorB, base.produtoId],
  );
  const autorizacoes = (
    await pool.query(
      "select a.id,r.usuario_id from autorizacoes_produtos_representantes a join representantes_fornecedores r on r.id=a.representante_fornecedor_id where a.produto_id=$1",
      [base.produtoId],
    )
  ).rows as { id: string; usuario_id: string }[];
  return {
    ...base,
    autorizacaoA: autorizacoes.find((a) => a.usuario_id === "rep-a")!.id,
    autorizacaoB: autorizacoes.find((a) => a.usuario_id === "rep-b")!.id,
  };
}
