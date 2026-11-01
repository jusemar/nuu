import { randomUUID } from "node:crypto";

import type { Pool } from "pg";

import { CATALOGO_PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";
import { criarSnapshotComissaoRepresentante } from "@/features/products/lib/comissoes-representantes/criar-snapshot-comissao-representante";
/** Apenas fixtures descartáveis; não importa conexão da aplicação nem lê .env. */
export async function prepararFixturePainel(pool: Pool) {
  const fornecedorA = randomUUID(),
    fornecedorB = randomUUID(),
    produtoId = randomUUID(),
    categoriaId = randomUUID(),
    marcaId = randomUUID(),
    adminA = randomUUID(),
    adminB = randomUUID(),
    adminGestor = randomUUID(),
    vinculoA = randomUUID(),
    vinculoB = randomUUID(),
    autorizacaoA = randomUUID(),
    autorizacaoB = randomUUID(),
    clienteId = randomUUID(),
    enderecoId = randomUUID();
  await pool.query(
    `INSERT INTO "user"(id,name,email,email_verified,created_at,updated_at) VALUES('rep-a','Fernando','a@fixture.invalid',false,now(),now()),('rep-b','Beatriz','b@fixture.invalid',false,now(),now()),('gestor','Gestor','gestor@fixture.invalid',false,now(),now()),('comum','Cliente','comum@fixture.invalid',false,now(),now())`,
  );
  await pool.query(
    "INSERT INTO administradores(id,usuario_id,administrador_principal) VALUES($1,'rep-a',false),($2,'rep-b',false),($3,'gestor',true)",
    [adminA, adminB, adminGestor],
  );
  for (const p of CATALOGO_PERMISSOES_ADMIN)
    await pool.query(
      "INSERT INTO permissoes_administrativas(chave,nome,modulo) VALUES($1,$1,'fixture') ON CONFLICT(chave) DO NOTHING",
      [p.chave],
    );
  for (const id of [adminA, adminB])
    await pool.query(
      "INSERT INTO administradores_permissoes(administrador_id,permissao_id,efeito) SELECT $1,id,'permitir' FROM permissoes_administrativas",
      [id],
    );
  await pool.query(
    "INSERT INTO fornecedores(id,nome,tipo_integracao,status) VALUES($1,'Embrater','api','ativo'),($2,'Fornecedor B','api','ativo')",
    [fornecedorA, fornecedorB],
  );
  await pool.query(
    "INSERT INTO representantes_fornecedores(id,usuario_id,fornecedor_id,ativo,criado_por_usuario_id,atualizado_por_usuario_id) VALUES($1,'rep-a',$2,true,'gestor','gestor'),($3,'rep-b',$4,true,'gestor','gestor')",
    [vinculoA, fornecedorA, vinculoB, fornecedorB],
  );
  await pool.query(
    "INSERT INTO category(id,name,slug) VALUES($1,'Categoria','cat-fixture')",
    [categoriaId],
  );
  await pool.query(
    "INSERT INTO marca(id,nome,slug) VALUES($1,'Marca','marca-fixture')",
    [marcaId],
  );
  await pool.query(
    "INSERT INTO product(id,category_id,marca_id,name,slug,sku,description) VALUES($1,$2,$3,'NOME ATUAL DIFERENTE','produto-fixture','SKU-ATUAL','Descrição atual')",
    [produtoId, categoriaId, marcaId],
  );
  await pool.query(
    "INSERT INTO autorizacoes_produtos_representantes(id,representante_fornecedor_id,produto_id,ativa,criado_por_usuario_id,atualizado_por_usuario_id,comissao_tipo,comissao_valor,comissao_visivel,comissao_ativa) VALUES($1,$2,$3,true,'gestor','gestor','percentual',500,false,false),($4,$5,$3,true,'gestor','gestor','percentual',500,false,false)",
    [autorizacaoA, vinculoA, produtoId, autorizacaoB, vinculoB],
  );
  await pool.query(
    "INSERT INTO representantes_comissionados_produtos(produto_id,autorizacao_id,atualizado_por_usuario_id) VALUES($1,$2,'gestor')",
    [produtoId, autorizacaoB],
  );
  await pool.query(
    "INSERT INTO checkout_clientes(id,nome,email,telefone,documento) VALUES($1,'CLIENTE_SECRETO','privado@fixture.invalid','31999999999','CPF_PRIVADO')",
    [clienteId],
  );
  await pool.query(
    "INSERT INTO checkout_enderecos(id,cliente_id,cep,rua,numero,bairro,cidade,estado) VALUES($1,$2,'30110000','ENDERECO_PRIVADO','1','Centro','Belo Horizonte','MG')",
    [enderecoId, clienteId],
  );
  let indice = 0;
  async function criarRegistro(
    estado:
      | "confirmada"
      | "cancelada"
      | "estornada"
      | "aguardando" = "confirmada",
    rep = "rep-a",
    fixa = false,
    comSnapshot = true,
  ) {
    const pedidoId = randomUUID(),
      itemId = randomUUID(),
      id = randomUUID(),
      b = rep === "rep-b",
      fornecedorId = b ? fornecedorB : fornecedorA,
      autorizacaoId = b ? autorizacaoB : autorizacaoA,
      vinculoId = b ? vinculoB : vinculoA;
    const quando = new Date(Date.UTC(2026, 0, 10, 12, indice++));
    await pool.query(
      "INSERT INTO checkout_pedidos(id,numero_pedido,cliente_id,endereco_id,subtotal_em_centavos,frete_em_centavos,total_em_centavos,gateway_pagamento,status,pagamento_status) VALUES($1,$2,$3,$4,10000,500,10500,'stripe',$5,$6)",
      [
        pedidoId,
        `PED-${indice}`,
        clienteId,
        enderecoId,
        estado === "cancelada"
          ? "canceled"
          : estado === "estornada"
            ? "refunded"
            : estado === "aguardando"
              ? "pending"
              : "paid",
        estado === "aguardando" ? "pending" : "paid",
      ],
    );
    await pool.query(
      "INSERT INTO checkout_pedido_itens(id,pedido_id,produto_id,nome_produto,sku_produto,modalidade,quantidade,preco_unitario_em_centavos,total_em_centavos) VALUES($1,$2,$3,$4,'SKU-VENDA','dropshipping',$5,$6,10000)",
      [
        itemId,
        pedidoId,
        produtoId,
        b
          ? "Histórico de Beatriz"
          : fixa
            ? "Produto fixo histórico"
            : "Produto percentual histórico",
        fixa ? 2 : 1,
        fixa ? 5000 : 10000,
      ],
    );
    if (comSnapshot) {
      const atribuicao = {
        representanteId: rep,
        representanteFornecedorId: vinculoId,
        fornecedorId,
        produtoId,
        autorizacaoId,
      };
      const snapshot = criarSnapshotComissaoRepresentante({
        atribuicao,
        regra: {
          atribuicao,
          versao: "2025-12-01T12:00:00.000Z",
          ativa: true,
          regra: fixa
            ? { tipo: "fixa", valor: 500 }
            : { tipo: "percentual", valor: 1000 },
        },
        item: {
          quantidade: fixa ? 2 : 1,
          precoUnitarioVendidoCentavos: fixa ? 5000 : 10000,
          descontoItemCentavos: 0,
          valorLiquidoItemCentavos: 10000,
        },
        ocorridoEm: quando.toISOString(),
      });
      await pool.query(
        "INSERT INTO checkout_item_comissoes(id,pedido_id,pedido_item_id,produto_id,representante_usuario_id,fornecedor_id,autorizacao_id,snapshot,atribuido_por_usuario_id,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'gestor',$9)",
        [
          id,
          pedidoId,
          itemId,
          produtoId,
          rep,
          fornecedorId,
          autorizacaoId,
          JSON.stringify(snapshot),
          quando,
        ],
      );
      if (estado !== "aguardando")
        await pool.query(
          "INSERT INTO checkout_item_comissao_eventos(comissao_id,tipo) VALUES($1,'confirmada')",
          [id],
        );
      if (estado === "cancelada" || estado === "estornada")
        await pool.query(
          "INSERT INTO checkout_item_comissao_eventos(comissao_id,tipo) VALUES($1,$2)",
          [id, estado],
        );
    }
    return { id, pedidoId, itemId };
  }
  const valida = await criarRegistro(),
    fixa = await criarRegistro("confirmada", "rep-a", true),
    cancelada = await criarRegistro("cancelada"),
    estornada = await criarRegistro("estornada"),
    pendente = await criarRegistro("aguardando"),
    outra = await criarRegistro("confirmada", "rep-b");
  for (let i = 0; i < 21; i++) await criarRegistro();
  await criarRegistro("confirmada", "rep-a", false, false);
  return {
    fornecedorA,
    fornecedorB,
    produtoId,
    adminA,
    adminB,
    adminGestor,
    valida,
    fixa,
    cancelada,
    estornada,
    pendente,
    outra,
    criarRegistro,
  };
}
