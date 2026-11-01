import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { CATALOGO_PERMISSOES_ADMIN } from "@/features/autenticacao/constants/permissoes-administrativas";

import {
  criarRecorteMigrations,
  subirPostgresDescartavel,
} from "../../../../../scripts/lib/postgres-docker-descartavel";

/** Testes exclusivos da Etapa 5. Nunca usa .env para escolher o banco. */
test("Etapa 6: pedidos reais e comissão", async (t) => {
  const postgres = await subirPostgresDescartavel("nuu-etapa6-comissoes");
  let pool: Pool | undefined;
  let encerrar: (() => Promise<void>) | undefined;
  let poolLeitura: Pool | undefined;
  const recorte = criarRecorteMigrations("./drizzle", 61);
  try {
    const url = await postgres.criarBanco("representantes_etapa5");
    await postgres.confirmarIdentidade(url, "representantes_etapa5");
    pool = new Pool({ connectionString: url });
    const banco = drizzle(pool);
    const migracoes = {
      migrationsSchema: "drizzle_v2",
      migrationsTable: "__drizzle_migrations",
    };
    await migrate(banco, { ...migracoes, migrationsFolder: recorte.pasta });
    const fornecedorA = randomUUID(),
      fornecedorB = randomUUID(),
      categoria = randomUUID(),
      marca = randomUUID(),
      vinculoA = randomUUID(),
      vinculoB = randomUUID(),
      vinculoExtra = randomUUID(),
      adminA = randomUUID(),
      adminB = randomUUID(),
      adminGestor = randomUUID();
    await pool.query(
      `INSERT INTO "user" (id,name,email,email_verified,created_at,updated_at) VALUES ('rep-a','Fernando','a@fixture.invalid',false,now(),now()),('rep-b','Outro','b@fixture.invalid',false,now(),now()),('gestor','Gestor','gestor@fixture.invalid',false,now(),now()),('comum','Cliente','cliente@fixture.invalid',false,now(),now())`,
    );
    await pool.query(
      "INSERT INTO administradores(id,usuario_id,administrador_principal) VALUES($1,'rep-a',false),($2,'rep-b',false),($3,'gestor',true)",
      [adminA, adminB, adminGestor],
    );
    await pool.query(
      "INSERT INTO fornecedores(id,nome,tipo_integracao,status) VALUES($1,'Embrater','api','ativo'),($2,'Outro fornecedor','api','ativo')",
      [fornecedorA, fornecedorB],
    );
    await pool.query(
      "INSERT INTO representantes_fornecedores(id,usuario_id,fornecedor_id,ativo,criado_por_usuario_id,atualizado_por_usuario_id) VALUES($1,'rep-a',$4,true,'gestor','gestor'),($2,'rep-b',$4,true,'gestor','gestor'),($3,'rep-a',$5,true,'gestor','gestor')",
      [vinculoA, vinculoB, vinculoExtra, fornecedorA, fornecedorB],
    );
    await pool.query(
      "INSERT INTO category(id,name,slug) VALUES($1,'Categoria fixture','categoria-fixture')",
      [categoria],
    );
    await pool.query(
      "INSERT INTO marca(id,nome,slug) VALUES($1,'Nooo','nooo')",
      [marca],
    );
    await pool.query(
      "INSERT INTO marca(id,nome,slug) VALUES($1,'Genérico','generico')",
      [randomUUID()],
    );
    for (const { chave } of CATALOGO_PERMISSOES_ADMIN)
      await pool.query(
        "INSERT INTO permissoes_administrativas(chave,nome,modulo) VALUES($1,$1,'fixture') ON CONFLICT(chave) DO NOTHING",
        [chave],
      );
    for (const id of [adminA, adminB])
      await pool.query(
        "INSERT INTO administradores_permissoes(administrador_id,permissao_id,efeito) SELECT $1,id,'permitir' FROM permissoes_administrativas",
        [id],
      );

    const produtoA = randomUUID(),
      produtoB = randomUUID(),
      autorizacaoA = randomUUID(),
      autorizacaoB = randomUUID();
    for (const [id, nome, sku] of [
      [produtoA, "Produto A", "SKU-A"],
      [produtoB, "Produto B", "SKU-B"],
    ]) {
      await pool.query(
        "INSERT INTO product(id,category_id,marca_id,name,slug,sku,description) VALUES($1,$2,$3,$4,$5,$6,'Descrição fixture')",
        [id, categoria, marca, nome, id, sku],
      );
      await pool.query(
        "INSERT INTO product_variant(product_id,sku,price_in_cents,stock_quantity,is_default) VALUES($1,$2,10000,0,true)",
        [id, sku],
      );
      await pool.query(
        "INSERT INTO product_pricing(product_id,type,price_in_cents,is_active) VALUES($1,'dropshipping',10000,true)",
        [id],
      );
      await pool.query(
        "INSERT INTO fornecedor_produto_vinculos(fornecedor_id,produto_id,codigo_fornecedor) VALUES($1,$2,$3)",
        [fornecedorA, id, sku],
      );
    }
    await pool.query(
      "INSERT INTO autorizacoes_produtos_representantes(id,representante_fornecedor_id,produto_id,ativa,criado_por_usuario_id,atualizado_por_usuario_id,comissao_tipo,comissao_valor,comissao_visivel) VALUES($1,$2,$3,true,'gestor','gestor','percentual',1000,false),($4,$5,$3,true,'gestor','gestor','percentual',2000,false),($6,$5,$7,true,'gestor','gestor',null,null,false)",
      [
        autorizacaoA,
        vinculoA,
        produtoA,
        autorizacaoB,
        vinculoB,
        randomUUID(),
        produtoB,
      ],
    );

    await migrate(banco, { ...migracoes, migrationsFolder: "./drizzle" });
    process.env.DATABASE_URL = url;
    process.env.NOOO_BANCO = "local";
    process.env.APP_ENVIRONMENT = "homologacao";
    process.env.BETTER_AUTH_URL = "http://127.0.0.1:3002";
    process.env.BETTER_AUTH_SECRET =
      "fixture-etapa4-sem-credenciais-reais-0123456789";
    process.env.GOOGLE_CLIENT_ID = "fixture";
    process.env.GOOGLE_CLIENT_SECRET = "fixture";
    Object.assign(globalThis, { AsyncLocalStorage });
    const { db } = await import("@/db/connection");
    poolLeitura = (db as unknown as { $client: Pool }).$client;
    const transacional = await import("@/db/transaction");
    encerrar = transacional.encerrarBancoTransacionalIntegracao;
    const { auth } = await import("@/lib/auth");
    const { workAsyncStorage } = await import(
      "next/dist/server/app-render/work-async-storage.external"
    );
    const { workUnitAsyncStorage } = await import(
      "next/dist/server/app-render/work-unit-async-storage.external"
    );
    let usuario: string | null = "gestor";
    t.mock.method(auth.api, "getSession", async () =>
      usuario
        ? {
            user: {
              id: usuario,
              name: "Fixture",
              email: `${usuario}@fixture.invalid`,
              emailVerified: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            session: {
              id: "fixture",
              userId: usuario,
              token: "fixture",
              expiresAt: new Date(Date.now() + 3600000),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          }
        : null,
    );
    const executar = <T>(acao: () => Promise<T>) =>
      workAsyncStorage.run(
        {
          route: "/fixture/etapa4",
          incrementalCache: {},
          pendingRevalidatedTags: [],
        } as unknown as Parameters<typeof workAsyncStorage.run>[0],
        () =>
          workUnitAsyncStorage.run(
            {
              type: "request",
              phase: "action",
              headers: new Headers({
                cookie: "better-auth.session_token=fixture",
              }),
            } as unknown as Parameters<typeof workUnitAsyncStorage.run>[0],
            acao,
          ),
      );

    const { dbTransacional } = transacional;
    const { eq } = await import("drizzle-orm");
    const e = await import("@/db/schema");
    const { definirRepresentanteComissionadoProduto: definir } = await import(
      "@/features/products/actions/representantes/definir-comissionado-produto"
    );
    const { atribuirRepresentanteItemPedidoGestor: atribuirAcao } =
      await import(
        "../../actions/comissoes-representantes/atribuir-representante-item"
      );
    const { processarComissoesPedidoSeguro: processar } = await import(
      "../../actions/comissoes-representantes/processar-comissoes-pedido"
    );
    const { reconciliarComissoesPendentes: reconciliar } = await import(
      "../../actions/comissoes-representantes/reconciliar-comissoes-pendentes"
    );
    const { confirmarPagamentoRecebido: confirmar } = await import(
      "../../actions/pagamentos/confirmar-pagamento-recebido"
    );
    const { criarPedidoCheckoutVisitanteInterno: criarReal } = await import(
      "../../actions/pedido/criar-pedido-checkout-visitante"
    );
    const { calcularResumoCheckout: resumoReal } = await import(
      "../../queries/resumo-checkout/calcular-resumo-checkout"
    );
    const { alterarStatusPedidoAdmin } = await import(
      "../../actions/pedidos-admin/alterar-status-pedido-admin"
    );
    const modeloId = randomUUID();
    await dbTransacional.insert(e.modelosRetiradaTable).values({
      id: modeloId,
      nome: "Retirada fixture",
      prazoTexto: "Imediata",
      ativo: true,
    });
    for (const id of [produtoA, produtoB])
      await dbTransacional
        .update(e.productTable)
        .set({
          status: "published",
          allowsPickup: true,
          allowsOwnDelivery: false,
          allowedDeliveryTypes: ["own"],
          modeloRetiradaId: modeloId,
          weight: 500,
          length: 20,
          width: 15,
          height: 10,
          disponibilidadeFreteExterno: "desativado",
        })
        .where(eq(e.productTable.id, id));
    await pool!.query(
      "UPDATE product_pricing SET type='stock' WHERE product_id=$1",
      [produtoB],
    );
    await pool!.query(
      "UPDATE product_variant SET stock_quantity=99 WHERE product_id=$1",
      [produtoB],
    );
    await pool!.query(
      "UPDATE autorizacoes_produtos_representantes SET comissao_ativa=true WHERE produto_id=$1",
      [produtoA],
    );
    async function criar(
      id = produtoA,
      quantidade = 2,
      cupom?: string,
      formaPagamento: "pix" | "cartao" = "pix",
    ) {
      const item = {
        id: randomUUID(),
        produtoId: id,
        nome: "Fixture",
        sku: id === produtoA ? "SKU-A" : "SKU-B",
        modalidadeTipo: id === produtoA ? "dropshipping" : "stock",
        imagemUrl: "https://example.invalid/foto.png",
        precoEmCentavos: 10000,
        quantidade,
        freteEscolhido: {
          id: "retirada" as const,
          nome: "Retirada fixture",
          prazo: "Imediata",
          valorEmCentavos: 0,
          cep: "30110000",
        },
      };
      const email = `cliente-${randomUUID()}@fixture.invalid`,
        documento = randomUUID();
      const resumo = await resumoReal({
        itens: [item],
        cepEntrega: "30110000",
      });
      assert.ok(resumo);
      const selecoes = resumo.cotacoesEntrega.map((g) => {
        const o = g.opcoes.find((o) => o.tipo === "retirada");
        assert.ok(o);
        return {
          chaveGrupo: g.chaveGrupo,
          identificador: o.identificador,
          nome: o.nome,
          descricao: o.descricao ?? null,
          prazoMinimoEmDiasUteis: o.prazoMinimoEmDiasUteis,
          prazoMaximoEmDiasUteis: o.prazoMaximoEmDiasUteis,
          valorEmCentavos: o.valorEmCentavos,
          tipo: o.tipo,
          provedor: o.provedor,
          servico: o.servico,
          cep: "30110000",
        };
      });
      const p = await criarReal({
        dados: {
          nome: "Cliente Fixture",
          email,
          telefone: "11999999999",
          documento,
          cep: "30110000",
          rua: "Rua Fixture",
          numero: "1",
          bairro: "Centro",
          cidade: "Belo Horizonte",
          estado: "MG",
          formaPagamento,
          cupom,
          chaveIdempotencia: randomUUID(),
          selecoesEntregaPorGrupo: selecoes,
          itens: [item],
        },
        email,
        documento,
        telefone: "11999999999",
        produtosIds: [id],
        usuarioId: null,
      });
      const i = (
        await pool!.query(
          "SELECT id FROM checkout_pedido_itens WHERE pedido_id=$1",
          [p.pedidoId],
        )
      ).rows[0].id as string;
      return { pedidoId: p.pedidoId, itemId: i };
    }
    const escolher = (id: string | null) =>
      executar(() => definir({ produtoId: produtoA, autorizacaoId: id }));
    // Lê a captura JÁ feita pelo checkout; não há atribuição manual de item no teste.
    const capturaDoCheckout = async (
      p: { pedidoId: string; itemId: string },
      id = autorizacaoA,
    ) => ({
      sucesso: (await registros(p.pedidoId)).some(
        (r) => r.pedido_item_id === p.itemId && r.autorizacao_id === id,
      ),
    });
    const pagar = (id: string) =>
      dbTransacional.transaction((tx) => confirmar(tx, id));
    const registros = async (id: string) =>
      (
        await pool!.query(
          "SELECT c.*,coalesce((SELECT json_agg(e.tipo ORDER BY e.tipo) FROM checkout_item_comissao_eventos e WHERE e.comissao_id=c.id),'[]'::json) AS eventos FROM checkout_item_comissoes c WHERE pedido_id=$1",
          [id],
        )
      ).rows;
    await dbTransacional.insert(e.cuponsPromocaoTable).values({
      codigo: "ETAPA6",
      nome: "Cupom fixture",
      ativo: true,
      tipoDesconto: "valor_fixo",
      valorDesconto: 2000,
      dataInicio: new Date("2020-01-01T00:00:00Z"),
    });
    await t.test(
      "cupom real é rateado pelo checkout e a base congelada não contém frete",
      async () => {
        assert.ok((await escolher(autorizacaoA)).sucesso);
        const p = await criar(produtoA, 2, "ETAPA6");
        const item = (
          await pool!.query("SELECT * FROM checkout_pedido_itens WHERE id=$1", [
            p.itemId,
          ])
        ).rows[0];
        assert.equal(item.preco_comercial_unitario_em_centavos, 10000);
        assert.equal(item.desconto_cupom_rateado_em_centavos, 2000);
        assert.ok((await capturaDoCheckout(p)).sucesso);
        assert.equal(
          (await registros(p.pedidoId))[0].snapshot.comissaoCentavos,
          1800,
        );
        await pagar(p.pedidoId);
      },
    );
    await t.test(
      "pedido comum e ausência de atribuição não geram comissão nem fallback",
      async () => {
        await escolher(null);
        for (const id of [produtoA, produtoB]) {
          const p = await criar(id);
          await pagar(p.pedidoId);
          assert.equal((await registros(p.pedidoId)).length, 0);
          assert.equal((await capturaDoCheckout(p)).sucesso, false);
        }
      },
    );
    await t.test(
      "UM dos dois representantes, desconto, confirmação concorrente e regra histórica",
      async () => {
        await escolher(autorizacaoA);
        const p = await criar(produtoA, 2, "ETAPA6");
        const a = await capturaDoCheckout(p);
        assert.ok(a.sucesso, JSON.stringify(a));
        const antes = (await registros(p.pedidoId))[0];
        assert.equal(antes.snapshot.comissaoCentavos, 1800);
        assert.equal(antes.representante_usuario_id, "rep-a");
        assert.deepEqual(antes.eventos, []);
        await pool!.query(
          "UPDATE autorizacoes_produtos_representantes SET comissao_valor=500,comissao_ativa=false,comissao_visivel=false WHERE id=$1",
          [autorizacaoA],
        );
        await Promise.all([
          pagar(p.pedidoId),
          pagar(p.pedidoId),
          pagar(p.pedidoId),
        ]);
        const depois = await registros(p.pedidoId);
        assert.equal(depois.length, 1);
        assert.deepEqual(depois[0].snapshot, antes.snapshot);
        assert.deepEqual(depois[0].eventos, ["confirmada"]);
        assert.equal((await capturaDoCheckout(p, autorizacaoB)).sucesso, false);
        assert.ok((await capturaDoCheckout(p)).sucesso);
        await pool!.query(
          "UPDATE autorizacoes_produtos_representantes SET comissao_valor=1000,comissao_ativa=true WHERE id=$1",
          [autorizacaoA],
        );
      },
    );
    await t.test(
      "fixa por quantidade e corrida de atribuição não duplicam",
      async () => {
        await pool!.query(
          "UPDATE autorizacoes_produtos_representantes SET comissao_tipo='fixa',comissao_valor=1000 WHERE id=$1",
          [autorizacaoA],
        );
        const resultados = await Promise.all([
          escolher(autorizacaoA),
          escolher(autorizacaoB),
        ]);
        assert.ok(resultados.every((r) => r.sucesso));
        const p = await criar(produtoA, 3);
        const r = (await registros(p.pedidoId))[0];
        assert.equal(
          r.snapshot.comissaoCentavos,
          r.autorizacao_id === autorizacaoA ? 3000 : 6000,
        );
        await pagar(p.pedidoId);
        await reconciliar();
        assert.deepEqual((await registros(p.pedidoId))[0].eventos, [
          "confirmada",
        ]);
        await pool!.query(
          "UPDATE autorizacoes_produtos_representantes SET comissao_tipo='percentual',comissao_valor=1000 WHERE id=$1",
          [autorizacaoA],
        );
      },
    );
    await t.test(
      "apenas gestor escolhe no produto e endpoint manual antigo permanece bloqueado",
      async () => {
        await escolher(null);
        const p = await criar();
        usuario = "rep-a";
        assert.equal((await escolher(autorizacaoA)).sucesso, false);
        usuario = "gestor";
        assert.equal(
          (
            await executar(() =>
              atribuirAcao({ ...p, autorizacaoId: autorizacaoA }),
            )
          ).sucesso,
          false,
        );
        assert.equal(
          (
            await executar(() =>
              definir({ produtoId: produtoB, autorizacaoId: autorizacaoA }),
            )
          ).sucesso,
          false,
        );
        assert.equal(
          (
            await executar(() =>
              definir({
                produtoId: produtoA,
                autorizacaoId: autorizacaoA,
                representanteId: "rep-a",
              }),
            )
          ).sucesso,
          false,
        );
        const falsa = randomUUID();
        await pool!.query(
          "INSERT INTO autorizacoes_produtos_representantes(id,representante_fornecedor_id,produto_id,ativa,criado_por_usuario_id,atualizado_por_usuario_id,comissao_tipo,comissao_valor,comissao_ativa) VALUES($1,$2,$3,true,'gestor','gestor','percentual',1000,true)",
          [falsa, vinculoExtra, produtoA],
        );
        assert.equal((await escolher(falsa)).sucesso, false);
        await escolher(autorizacaoA);
        await pool!.query(
          "UPDATE representantes_fornecedores SET ativo=false WHERE id=$1",
          [vinculoA],
        );
        const revogado = await criar();
        assert.equal((await registros(revogado.pedidoId)).length, 0);
        await pool!.query(
          "UPDATE representantes_fornecedores SET ativo=true WHERE id=$1",
          [vinculoA],
        );
        await pagar(p.pedidoId);
        assert.equal((await registros(p.pedidoId)).length, 0);
      },
    );
    await t.test(
      "cancelamento pelo fluxo real e estorno preservam snapshot",
      async () => {
        await escolher(autorizacaoA);
        const p = await criar();
        assert.ok((await capturaDoCheckout(p)).sucesso);
        await pagar(p.pedidoId);
        const antigo = (await registros(p.pedidoId))[0].snapshot;
        const dados = new FormData();
        dados.set("pedidoId", p.pedidoId);
        dados.set("status", "canceled");
        const cancelado = await executar(() =>
          alterarStatusPedidoAdmin({ sucesso: false, mensagem: null }, dados),
        );
        assert.ok(cancelado.sucesso, JSON.stringify(cancelado));
        assert.deepEqual((await registros(p.pedidoId))[0].eventos, [
          "cancelada",
          "confirmada",
        ]);
        await dbTransacional.transaction(async (tx) => {
          await tx
            .update(e.checkoutPedidosTable)
            .set({ status: "refunded" })
            .where(eq(e.checkoutPedidosTable.id, p.pedidoId));
          await processar(tx, p.pedidoId);
        });
        await reconciliar();
        const novo = (await registros(p.pedidoId))[0];
        assert.deepEqual(novo.snapshot, antigo);
        assert.deepEqual(novo.eventos, [
          "cancelada",
          "confirmada",
          "estornada",
        ]);
      },
    );
    await t.test(
      "falha opcional não desfaz pagamento; retry repara sem recalcular",
      async () => {
        const p = await criar();
        assert.ok((await capturaDoCheckout(p)).sucesso);
        await dbTransacional.transaction(async (tx) => {
          const proxy = new Proxy(tx, {
            get(alvo, chave) {
              if (chave === "transaction")
                return (callback: (s: typeof tx) => Promise<unknown>) =>
                  alvo.transaction((sp) =>
                    callback(
                      new Proxy(sp, {
                        get(s, c) {
                          if (c === "insert")
                            return (t: unknown) => {
                              if (t === e.checkoutItemComissaoEventosTable)
                                throw new Error("Falha simulada opcional");
                              return s.insert(
                                t as typeof e.checkoutItemComissaoEventosTable,
                              );
                            };
                          const v = Reflect.get(s, c);
                          return typeof v === "function" ? v.bind(s) : v;
                        },
                      }),
                    ),
                  );
              const v = Reflect.get(alvo, chave);
              return typeof v === "function" ? v.bind(alvo) : v;
            },
          });
          await confirmar(proxy, p.pedidoId);
        });
        assert.equal(
          (
            await pool!.query(
              "SELECT pagamento_status FROM checkout_pedidos WHERE id=$1",
              [p.pedidoId],
            )
          ).rows[0].pagamento_status,
          "paid",
        );
        assert.deepEqual((await registros(p.pedidoId))[0].eventos, []);
        await reconciliar();
        assert.deepEqual((await registros(p.pedidoId))[0].eventos, [
          "confirmada",
        ]);
      },
    );

    await t.test(
      "cartão exclui acréscimo da base e pagamento na entrega usa a baixa real",
      async () => {
        await dbTransacional.insert(e.configuracoesPagamentoTable).values({
          nome: "Fixture juros",
          percentualAcrescimoCartaoBps: 1500,
        });
        const cartao = await criar(produtoA, 2, undefined, "cartao");
        const linha = (
          await pool!.query(
            "SELECT preco_unitario_em_centavos,preco_comercial_unitario_em_centavos FROM checkout_pedido_itens WHERE id=$1",
            [cartao.itemId],
          )
        ).rows[0];
        assert.equal(linha.preco_unitario_em_centavos, 11500);
        assert.equal(linha.preco_comercial_unitario_em_centavos, 10000);
        assert.ok((await capturaDoCheckout(cartao)).sucesso);
        assert.equal(
          (await registros(cartao.pedidoId))[0].snapshot.comissaoCentavos,
          2000,
        );
        const entrega = await criar();
        await pool!.query(
          "UPDATE checkout_pedidos SET status='shipped' WHERE id=$1",
          [entrega.pedidoId],
        );
        await pool!.query(
          "UPDATE checkout_pedidos SET gateway_pagamento='manual' WHERE id=$1",
          [entrega.pedidoId],
        );
        await pool!.query(
          "UPDATE checkout_pagamentos SET gateway='manual',metodo='dinheiro' WHERE pedido_id=$1",
          [entrega.pedidoId],
        );
        await pool!.query(
          "INSERT INTO checkout_pedido_pagamento_entrega(pedido_id,forma_escolhida,servico_identificador,valor_a_receber_em_centavos,snapshot_elegibilidade) VALUES($1,'dinheiro','fixture',20000,'{}')",
          [entrega.pedidoId],
        );
        assert.ok((await capturaDoCheckout(entrega)).sucesso);
        const { confirmarRecebimentoPagamentoEntregaAdmin: receber } =
          await import(
            "@/features/pagamento-na-entrega/actions/admin/confirmar-recebimento-pagamento-entrega-admin"
          );
        const f = new FormData();
        f.set("pedidoId", entrega.pedidoId);
        f.set("formaRecebida", "dinheiro");
        f.set("valorRecebidoEmCentavos", "20000");
        const resultado = await executar(() =>
          receber({ sucesso: false, mensagem: "" }, f),
        );
        assert.ok(resultado.sucesso, JSON.stringify(resultado));
        await executar(() => receber({ sucesso: false, mensagem: "" }, f));
        assert.deepEqual((await registros(entrega.pedidoId))[0].eventos, [
          "confirmada",
        ]);
      },
    );
    await t.test(
      "revogação concorrente bloqueia atribuição; expiração pode receber pagamento tardio válido",
      async () => {
        await escolher(autorizacaoA);
        const c = await pool!.connect();
        try {
          await c.query("BEGIN");
          await c.query(
            "UPDATE autorizacoes_produtos_representantes SET comissao_ativa=false WHERE id=$1",
            [autorizacaoA],
          );
          const pendente = criar();
          let bloqueou = false;
          for (let i = 0; i < 100; i++) {
            const r = await pool!.query(
              "SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type='Lock' AND query ILIKE '%autorizacoes_produtos_representantes%'",
            );
            if (r.rows[0].n) {
              bloqueou = true;
              break;
            }
            await new Promise((r) => setTimeout(r, 20));
          }
          assert.ok(bloqueou);
          await c.query("COMMIT");
          const recusado = await pendente;
          assert.equal((await registros(recusado.pedidoId)).length, 0);
        } finally {
          await c.query("ROLLBACK");
          c.release();
          await pool!.query(
            "UPDATE autorizacoes_produtos_representantes SET comissao_ativa=true WHERE id=$1",
            [autorizacaoA],
          );
        }
        const tardio = await criar();
        assert.ok((await capturaDoCheckout(tardio)).sucesso);
        const pagamentoId = (
          await pool!.query(
            "SELECT id FROM checkout_pagamentos WHERE pedido_id=$1",
            [tardio.pedidoId],
          )
        ).rows[0].id;
        const { expirarPagamentoPendente } = await import(
          "../../lib/pagamentos/expirar-pagamento-pendente"
        );
        await dbTransacional.transaction((tx) =>
          expirarPagamentoPendente({
            tx,
            pedidoId: tardio.pedidoId,
            pagamentoId,
            gateway: "efibank",
            referencia: "fixture",
          }),
        );
        await reconciliar();
        assert.deepEqual((await registros(tardio.pedidoId))[0].eventos, []);
        await pagar(tardio.pedidoId);
        assert.deepEqual((await registros(tardio.pedidoId))[0].eventos, [
          "confirmada",
        ]);
      },
    );
    await t.test(
      "troca e remoção da escolha só afetam vendas futuras",
      async () => {
        await escolher(autorizacaoA);
        const antigo = await criar();
        const congelado = (await registros(antigo.pedidoId))[0];
        await escolher(autorizacaoB);
        const novo = await criar();
        assert.equal(
          (await registros(novo.pedidoId))[0].representante_usuario_id,
          "rep-b",
        );
        await escolher(null);
        const nenhum = await criar();
        assert.equal((await registros(nenhum.pedidoId)).length, 0);
        await Promise.all([
          pagar(antigo.pedidoId),
          pagar(antigo.pedidoId),
          pagar(novo.pedidoId),
          pagar(nenhum.pedidoId),
        ]);
        await reconciliar();
        assert.deepEqual(
          (await registros(antigo.pedidoId))[0].snapshot,
          congelado.snapshot,
        );
        assert.equal((await registros(antigo.pedidoId)).length, 1);
        assert.deepEqual((await registros(antigo.pedidoId))[0].eventos, [
          "confirmada",
        ]);
      },
    );
    t.mock.restoreAll();
  } finally {
    await encerrar?.();
    await poolLeitura?.end();
    await pool?.end();
    recorte.remover();
    await postgres.remover();
  }
});
