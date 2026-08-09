--> Ajuste manual necessário: o drizzle-kit gera apenas `DROP INDEX`, e a
--> unicidade antiga existe em duas formas diferentes dependendo do banco.
--> Na cadeia recriada do zero (baseline 0000) ela é um índice único solto; nos
--> bancos reais (desenvolvimento e produção) ela é uma CONSTRAINT UNIQUE, e
--> `DROP INDEX` é recusado pelo Postgres nesse caso, porque a constraint
--> depende do índice. As duas linhas abaixo cobrem as duas formas e são
--> idempotentes. Esta migration ainda não foi aplicada em nenhum banco.
ALTER TABLE "fornecedor_produtos_api_staging" DROP CONSTRAINT IF EXISTS "fornecedor_produtos_api_staging_integracao_codigo_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "fornecedor_produtos_api_staging_integracao_codigo_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fornecedor_produtos_api_staging_integracao_importacao_codigo_unique" ON "fornecedor_produtos_api_staging" USING btree ("integracao_api_id","importacao_id","codigo_fornecedor");
