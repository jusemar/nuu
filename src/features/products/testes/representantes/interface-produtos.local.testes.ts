import { randomUUID } from "node:crypto";
import test from "node:test";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { CATALOGO_PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

import { subirPostgresDescartavel } from "../../../../../scripts/lib/postgres-docker-descartavel";
import { validarInterfaceRepresentante } from "./validar-interface-representante";

test("interface real de produtos em desktop e Android, com banco descartável", async () => {
  const postgres = await subirPostgresDescartavel("nuu-interface-etapa4");
  let pool: Pool | undefined;
  try {
    const url = await postgres.criarBanco("interface_etapa4");
    await postgres.confirmarIdentidade(url, "interface_etapa4");
    pool = new Pool({ connectionString: url });
    await migrate(drizzle(pool), {
      migrationsFolder: "./drizzle",
      migrationsSchema: "drizzle_v2",
      migrationsTable: "__drizzle_migrations",
    });
    const fornecedorA = randomUUID(),
      fornecedorB = randomUUID(),
      categoria = randomUUID(),
      marca = randomUUID(),
      produtoA = randomUUID(),
      produtoB = randomUUID(),
      vinculoA = randomUUID(),
      adminA = randomUUID();
    await pool.query(
      `INSERT INTO "user"(id,name,email,email_verified,created_at,updated_at) VALUES('rep-a','Fernando','a@fixture.invalid',false,now(),now()),('gestor','Gestor','gestor@fixture.invalid',false,now(),now())`,
    );
    await pool.query(
      "INSERT INTO administradores(id,usuario_id,administrador_principal) VALUES($1,'rep-a',false),($2,'gestor',true)",
      [adminA, randomUUID()],
    );
    await pool.query(
      "INSERT INTO fornecedores(id,nome,tipo_integracao,status) VALUES($1,'Embrater','api','ativo'),($2,'Outro','api','ativo')",
      [fornecedorA, fornecedorB],
    );
    await pool.query(
      "INSERT INTO representantes_fornecedores(id,usuario_id,fornecedor_id,ativo,criado_por_usuario_id,atualizado_por_usuario_id) VALUES($1,'rep-a',$2,true,'gestor','gestor')",
      [vinculoA, fornecedorA],
    );
    for (const { chave } of CATALOGO_PERMISSOES_ADMIN)
      await pool.query(
        "INSERT INTO permissoes_administrativas(chave,nome,modulo) VALUES($1,$1,'fixture') ON CONFLICT(chave) DO NOTHING",
        [chave],
      );
    await pool.query(
      "INSERT INTO administradores_permissoes(administrador_id,permissao_id,efeito) SELECT $1,id,'permitir' FROM permissoes_administrativas WHERE chave IN ('representantes_produtos.visualizar','representantes_produtos.administrar')",
      [adminA],
    );
    await pool.query(
      "INSERT INTO category(id,name,slug) VALUES($1,'Informática','informatica')",
      [categoria],
    );
    await pool.query(
      "INSERT INTO marca(id,nome,slug) VALUES($1,'Nooo','nooo')",
      [marca],
    );
    await pool.query(
      "INSERT INTO product(id,category_id,marca_id,name,slug,sku,description) VALUES($1,$2,$3,'Cabo HDMI 2 m','cabo-fixture','NOOO-001','Descrição fixture')",
      [produtoA, categoria, marca],
    );
    await pool.query(
      "INSERT INTO product_variant(product_id,sku,price_in_cents,stock_quantity,is_default) VALUES($1,'NOOO-001',4990,0,true)",
      [produtoA],
    );
    await pool.query(
      "INSERT INTO product_pricing(product_id,type,price_in_cents,is_active,main_card_price) VALUES($1,'dropshipping',4990,true,true)",
      [produtoA],
    );
    await pool.query(
      "INSERT INTO fornecedor_produto_vinculos(fornecedor_id,produto_id,codigo_fornecedor,estoque_informado_fornecedor) VALUES($1,$2,'EMB-HDMI-002',35)",
      [fornecedorA, produtoA],
    );
    await pool.query(
      "INSERT INTO autorizacoes_produtos_representantes(representante_fornecedor_id,produto_id,ativa,criado_por_usuario_id,atualizado_por_usuario_id,comissao_tipo,comissao_valor,comissao_visivel) VALUES($1,$2,true,'gestor','gestor','percentual',500,true)",
      [vinculoA, produtoA],
    );
    await validarInterfaceRepresentante({
      pool,
      url,
      produtoA,
      produtoB,
      fornecedorA,
      fornecedorB,
      vinculoA,
      adminA,
    });
  } finally {
    await pool?.end();
    await postgres.remover();
  }
});
