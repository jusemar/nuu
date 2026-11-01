import { randomUUID } from "node:crypto";
import test from "node:test";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { CATALOGO_PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

import { subirPostgresDescartavel } from "../../../../../scripts/lib/postgres-docker-descartavel";
import { validarInterfaceAtribuicao } from "./validar-interface-atribuicao";

test("Correção Etapa 6: comissionado único no produto em desktop e Android", async () => {
  const postgres = await subirPostgresDescartavel("nuu-interface-etapa6");
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

    const pedidoId = randomUUID(),
      clienteId = randomUUID(),
      enderecoId = randomUUID();
    await pool.query(
      "UPDATE autorizacoes_produtos_representantes SET comissao_ativa=true WHERE produto_id=$1",
      [produtoA],
    );
    await pool.query(
      "INSERT INTO checkout_clientes(id,nome,email,telefone,documento) VALUES($1,'Cliente fixture','cliente@fixture.invalid','11999999999',$2)",
      [clienteId, randomUUID()],
    );
    await pool.query(
      "INSERT INTO checkout_enderecos(id,cliente_id,cep,rua,numero,bairro,cidade,estado) VALUES($1,$2,'30110000','Rua Fixture','1','Centro','Belo Horizonte','MG')",
      [enderecoId, clienteId],
    );
    await pool.query(
      "INSERT INTO checkout_pedidos(id,numero_pedido,cliente_id,endereco_id,subtotal_em_centavos,frete_em_centavos,total_em_centavos,gateway_pagamento) VALUES($1,'ETAPA6',$2,$3,40000,0,40000,'stripe')",
      [pedidoId, clienteId, enderecoId],
    );
    await pool.query(
      "INSERT INTO checkout_pagamentos(pedido_id,gateway,metodo,valor_em_centavos) VALUES($1,'stripe','cartao',40000)",
      [pedidoId],
    );
    for (let i = 0; i < 2; i++)
      await pool.query(
        "INSERT INTO checkout_pedido_itens(pedido_id,produto_id,nome_produto,modalidade,quantidade,preco_unitario_em_centavos,total_em_centavos,preco_comercial_unitario_em_centavos,desconto_cupom_rateado_em_centavos) VALUES($1,$2,'Produto fixture','dropshipping',2,10000,20000,10000,0)",
        [pedidoId, produtoA],
      );
    await validarInterfaceAtribuicao({
      pool,
      url,
      produtoA,
      produtoB,
      fornecedorA,
      fornecedorB,
      vinculoA,
      adminA,
      pedidoId,
    });
  } finally {
    await pool?.end();
    await postgres.remover();
  }
});
