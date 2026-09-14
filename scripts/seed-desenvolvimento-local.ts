// Script local: lançado por `scripts/lib/executar-script-local.ts` com
// AMBIENTE_BANCO=local, que valida o destino (PostgreSQL local persistente) e
// só então define DATABASE_URL. Nunca carrega `.env` nem acessa a Neon.

import { Client } from "pg";

import {
  CEPS,
  criarFixturesLogisticaLocal,
  definirCondicoesEntregaPropria,
  definirModosCategoria,
  definirModosProduto,
  IDS,
} from "@/features/logistica/testes/integracao-local/fixtures-logistica-local";

/**
 * Dados FICTÍCIOS para o desenvolvimento manual no `npm run dev`:
 * Belo Horizonte (Barreiro, Pampulha, Oeste, Noroeste, bairro e CEP
 * específico), Agenda Geográfica, catálogo de frete, categorias, produtos da
 * loja e de fornecedor (tipo Laquila), e cenários prontos de herança:
 *
 * - Rações Premium: Entrega Própria Ativada (BH R$ 10 + programada GRÁTIS em
 *   3 janelas; Oeste R$ 8,50). "Ração Fixture" herda; "Ração com Preço
 *   Próprio" tem BH R$ 7 (Produto vence Categoria).
 * - HD Interno: Frete Externo Desativado + Entrega Própria BH R$ 15 (com Retirada).
 * - Capacetes: Entrega Própria Ativada; produtos do fornecedor não recebem.
 *
 * Idempotente: se os dados já existem, nada é alterado.
 */
async function executar() {
  const url = process.env.DATABASE_URL;
  if (!url || new URL(url).hostname !== "127.0.0.1") {
    throw new Error(
      "Seed de desenvolvimento aceita somente o PostgreSQL local.",
    );
  }
  const cliente = new Client({ connectionString: url });
  await cliente.connect();
  try {
    const existente = await cliente.query(
      "SELECT 1 FROM category WHERE id = $1",
      [IDS.categorias.racoesPremium],
    );
    if ((existente.rowCount ?? 0) > 0) {
      console.log(
        "[seed-desenvolvimento-local] Dados de desenvolvimento já existem. Nada foi alterado.",
      );
      return;
    }

    await cliente.query("BEGIN");
    const geo = await criarFixturesLogisticaLocal(cliente);

    await definirModosCategoria(cliente, IDS.categorias.racoesPremium, {
      entregaPropria: "ativado",
    });
    await definirCondicoesEntregaPropria(
      cliente,
      { categoriaId: IDS.categorias.racoesPremium },
      [
        {
          tipo: "cidade",
          destinoId: geo.bh,
          rapidaEmCentavos: 1000,
          programada: { janelas: 3, valorEmCentavos: 0 },
        },
        {
          tipo: "region",
          destinoId: geo.regioes.oeste,
          rapidaEmCentavos: 850,
        },
      ],
    );
    await definirModosProduto(cliente, IDS.produtos.racao, {
      entregaPropria: "herdar",
    });
    await definirCondicoesEntregaPropria(
      cliente,
      { produtoId: IDS.produtos.racaoComPreco },
      [{ tipo: "cidade", destinoId: geo.bh, rapidaEmCentavos: 700 }],
    );

    await definirModosCategoria(cliente, IDS.categorias.hdInterno, {
      entregaPropria: "ativado",
      freteExterno: "desativado",
    });
    await definirCondicoesEntregaPropria(
      cliente,
      { categoriaId: IDS.categorias.hdInterno },
      [{ tipo: "cidade", destinoId: geo.bh, rapidaEmCentavos: 1500 }],
    );
    await definirModosProduto(cliente, IDS.produtos.hd, {
      entregaPropria: "herdar",
    });

    await definirModosCategoria(cliente, IDS.categorias.capacetes, {
      entregaPropria: "ativado",
    });
    await definirCondicoesEntregaPropria(
      cliente,
      { categoriaId: IDS.categorias.capacetes },
      [{ tipo: "cidade", destinoId: geo.bh, rapidaEmCentavos: 1000 }],
    );
    await definirModosProduto(cliente, IDS.produtos.capaceteLoja, {
      entregaPropria: "herdar",
    });

    // Mantém o boolean legado coerente com o modo, como as actions do Admin.
    await cliente.query(
      "UPDATE product SET allows_own_delivery = (coalesce(disponibilidade_entrega_propria::text, 'desativado') <> 'desativado') WHERE disponibilidade_entrega_propria IS NOT NULL",
    );
    await cliente.query("COMMIT");

    console.log("[seed-desenvolvimento-local] Dados criados.");
    console.table(
      Object.entries(CEPS).map(([chave, item]) => ({
        chave,
        cep: item.cep,
        bairro: item.bairro,
        nivel: item.nivel,
      })),
    );
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    await cliente.end();
  }
}

export const execucao = executar();
