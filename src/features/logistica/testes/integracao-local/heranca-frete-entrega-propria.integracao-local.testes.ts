import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it, mock } from "node:test";

import { Client } from "pg";

import {
  CEPS,
  type ChaveCep,
  criarFixturesLogisticaLocal,
  definirCondicoesEntregaPropria,
  definirModosCategoria,
  definirModosProduto,
  IDS,
  type IdsGeograficos,
  restaurarEstadoInicial,
} from "./fixtures-logistica-local";

/**
 * Integração REAL em PostgreSQL local (Docker) — nunca Neon.
 * Rode com `npm run testes:integracao:logistica`, que sobe um banco
 * descartável, aplica as migrations 0 → última e remove o container no fim.
 *
 * Rede externa bloqueada: Frenet e ViaCEP/OpenCEP respondem por dublês
 * locais; qualquer outro host derruba o teste.
 */

const URL_LOCAL = process.env.DATABASE_URL_INTEGRACAO_LOGISTICA;
const MOTIVO_SKIP = URL_LOCAL
  ? false
  : "Defina DATABASE_URL_INTEGRACAO_LOGISTICA (use npm run testes:integracao:logistica).";

const CEP_ORIGEM_LOJA = "30140071";
const CEP_ORIGEM_FORNECEDOR = "01001000";
/** Segunda-feira 14/09/2026 às 09:00 em São Paulo (antes do corte). */
const SEGUNDA_09H = new Date("2026-09-14T12:00:00.000Z");
/** Mesma segunda às 14:00 em São Paulo (depois do corte das 13:00). */
const SEGUNDA_14H = new Date("2026-09-14T17:00:00.000Z");

type OpcaoPdp = {
  provedor: string;
  servico?: string;
  nome: string;
  valorEmCentavos: number;
  prazo?: string | null;
};

type Modulos = {
  consultarFreteAction: typeof import("@/features/store/products/actions/consultarFreteAction").consultarFreteAction;
  resolverEntregaPropriaProduto: typeof import("@/features/logistica/queries/resolver-entrega-propria").resolverEntregaPropriaProduto;
  calcularResumoCheckout: typeof import("@/features/checkout/queries/resumo-checkout/calcular-resumo-checkout").calcularResumoCheckout;
  calcularPreviaTotaisPedido: typeof import("@/features/checkout/queries/previa-totais/calcular-previa-totais-pedido").calcularPreviaTotaisPedido;
  buscarDisponibilidadeFreteExternoProduto: typeof import("@/features/logistica/queries/disponibilidade/buscar-disponibilidade-frete-externo").buscarDisponibilidadeFreteExternoProduto;
  listarDadosAlteracaoEmMassa: typeof import("@/features/products/queries/alteracao-em-massa/listar-dados-alteracao-em-massa").listarDadosAlteracaoEmMassa;
  getProductBySlug: typeof import("@/features/store/products/service/productService").getProductBySlug;
};

const RESPOSTA_FRENET = {
  ShippingSevicesArray: [
    {
      ServiceCode: "03298",
      ServiceDescription: "PAC",
      Carrier: "Correios",
      ShippingPrice: "25.90",
      DeliveryTime: "5",
      Error: false,
    },
    {
      ServiceCode: "03220",
      ServiceDescription: "SEDEX",
      Carrier: "Correios",
      ShippingPrice: "45.10",
      DeliveryTime: "2",
      Error: false,
    },
    {
      ServiceCode: ".package",
      ServiceDescription: ".Package",
      Carrier: "Jadlog",
      ShippingPrice: "30.00",
      DeliveryTime: "4",
      Error: false,
    },
  ],
};

describe(
  "Integração local — Frete Externo e Entrega Própria por Categoria",
  { skip: MOTIVO_SKIP },
  () => {
    let cliente: Client;
    let geo: IdsGeograficos;
    let m: Modulos;
    /** CEP de origem de cada chamada à Frenet (loja x fornecedor). */
    const chamadasFrenet: string[] = [];
    const fetchOriginal = globalThis.fetch;

    before(async () => {
      const url = new URL(URL_LOCAL ?? "");
      // Nunca Neon: só loopback e o mesmo banco que a aplicação vai usar.
      if (
        !["127.0.0.1", "localhost"].includes(url.hostname) ||
        process.env.DATABASE_URL !== URL_LOCAL
      ) {
        throw new Error("Integração local recusada: banco não é local.");
      }

      Object.assign(process.env, {
        APP_ENVIRONMENT: "homologacao",
        FRENET_HABILITADO: "true",
        FRENET_TOKEN: "token-fixture",
        FRENET_CEP_ORIGEM: CEP_ORIGEM_LOJA,
        FRENET_URL_COTACAO: "http://frenet.fixture.local/shipping/quote",
        LAQUILA_CEP_ORIGEM: CEP_ORIGEM_FORNECEDOR,
      });

      globalThis.fetch = (async (
        entrada: string | URL | Request,
        init?: RequestInit,
      ) => {
        const destino = new URL(
          typeof entrada === "string"
            ? entrada
            : entrada instanceof URL
              ? entrada.href
              : entrada.url,
        );
        if (destino.hostname === "frenet.fixture.local") {
          const corpo = JSON.parse(String(init?.body)) as { SellerCEP: string };
          chamadasFrenet.push(corpo.SellerCEP);
          return Response.json(RESPOSTA_FRENET);
        }
        if (["viacep.com.br", "opencep.com"].includes(destino.hostname)) {
          const cep = (destino.pathname.split("/")[2] ?? "").replace(
            ".json",
            "",
          );
          const fixture = Object.values(CEPS).find((item) => item.cep === cep);
          return Response.json(
            fixture
              ? {
                  cep,
                  logradouro: "Rua Fixture",
                  bairro: fixture.bairro,
                  localidade: "Belo Horizonte",
                  uf: "MG",
                }
              : { erro: true },
          );
        }
        throw new Error(`Rede externa bloqueada no teste: ${destino.host}`);
      }) as typeof fetch;

      mock.timers.enable({ apis: ["Date"], now: SEGUNDA_09H });

      cliente = new Client({ connectionString: URL_LOCAL });
      await cliente.connect();
      geo = await criarFixturesLogisticaLocal(cliente);

      m = {
        consultarFreteAction: (
          await import("@/features/store/products/actions/consultarFreteAction")
        ).consultarFreteAction,
        resolverEntregaPropriaProduto: (
          await import("@/features/logistica/queries/resolver-entrega-propria")
        ).resolverEntregaPropriaProduto,
        calcularResumoCheckout: (
          await import(
            "@/features/checkout/queries/resumo-checkout/calcular-resumo-checkout"
          )
        ).calcularResumoCheckout,
        calcularPreviaTotaisPedido: (
          await import(
            "@/features/checkout/queries/previa-totais/calcular-previa-totais-pedido"
          )
        ).calcularPreviaTotaisPedido,
        buscarDisponibilidadeFreteExternoProduto: (
          await import(
            "@/features/logistica/queries/disponibilidade/buscar-disponibilidade-frete-externo"
          )
        ).buscarDisponibilidadeFreteExternoProduto,
        listarDadosAlteracaoEmMassa: (
          await import(
            "@/features/products/queries/alteracao-em-massa/listar-dados-alteracao-em-massa"
          )
        ).listarDadosAlteracaoEmMassa,
        getProductBySlug: (
          await import("@/features/store/products/service/productService")
        ).getProductBySlug,
      };
    });

    beforeEach(async () => {
      await restaurarEstadoInicial(cliente);
      mock.timers.setTime(SEGUNDA_09H.getTime());
      chamadasFrenet.length = 0;
    });

    after(async () => {
      globalThis.fetch = fetchOriginal;
      mock.timers.reset();
      await cliente?.end();
    });

    /** Consulta oficial da PDP (mesma action da loja). */
    async function pdp(produtoId: string, chave: ChaveCep) {
      const inicio = chamadasFrenet.length;
      const resultado = (await m.consultarFreteAction(
        produtoId,
        CEPS[chave].cep,
      )) as { opcoesEntrega?: OpcaoPdp[] };
      const opcoes = resultado.opcoesEntrega ?? [];
      const chamadas = chamadasFrenet.slice(inicio);
      return {
        opcoes,
        rapida: opcoes.find((o) => o.servico === "entrega-propria-atual"),
        programada: opcoes.find((o) => o.servico === "entrega-programada"),
        externas: opcoes.filter((o) => o.provedor === "frenet"),
        frenetLoja: chamadas.filter((c) => c === CEP_ORIGEM_LOJA).length,
        frenetFornecedor: chamadas.filter((c) => c === CEP_ORIGEM_FORNECEDOR)
          .length,
      };
    }

    /** Motor único da Entrega Própria (fonte, níveis e promessas). */
    async function motor(produtoId: string, chave: ChaveCep) {
      return m.resolverEntregaPropriaProduto({
        produtoId,
        endereco: {
          cep: CEPS[chave].cep,
          bairro: CEPS[chave].bairro,
          cidade: "Belo Horizonte",
          uf: "MG",
        },
      });
    }

    async function exigirMotor(produtoId: string, chave: ChaveCep) {
      const resultado = await motor(produtoId, chave);
      assert.ok(resultado.encontrado, `motor sem Entrega Própria em ${chave}`);
      return resultado;
    }

    /** Categoria Rações Premium com BH R$ 10 + programada GRÁTIS em 3 janelas. */
    async function configurarRacoesPremium() {
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
        ],
      );
    }

    describe("Os 10 cenários", () => {
      it("1. produto Herdar recebe a Entrega Própria da Categoria", async () => {
        await configurarRacoesPremium();
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });

        const consulta = await pdp(IDS.produtos.racao, "centro");
        assert.equal(consulta.rapida?.valorEmCentavos, 1000);
        assert.equal(consulta.programada?.valorEmCentavos, 0);

        const resultado = await exigirMotor(IDS.produtos.racao, "centro");
        assert.deepEqual(resultado.fonteComercial, {
          tipo: "categoria",
          categoriaId: IDS.categorias.racoesPremium,
          categoriaNome: "Rações Premium",
        });
        assert.equal(resultado.promessaRapida?.dataPrometida, "2026-09-14");
        assert.equal(
          resultado.entregaProgramada?.promessa.dataPrometida,
          "2026-09-21",
        );
      });

      it("2. configuração própria aplicável do produto vence a Categoria (sem misturar)", async () => {
        await configurarRacoesPremium();
        // Produto legado com "Permitir Entrega Própria" ligado = Ativado.
        await definirCondicoesEntregaPropria(
          cliente,
          { produtoId: IDS.produtos.racaoComPreco },
          [{ tipo: "cidade", destinoId: geo.bh, rapidaEmCentavos: 700 }],
        );

        const consulta = await pdp(IDS.produtos.racaoComPreco, "centro");
        assert.equal(consulta.rapida?.valorEmCentavos, 700);
        // A programada da Categoria não completa a configuração do produto.
        assert.equal(consulta.programada, undefined);
        const resultado = await exigirMotor(
          IDS.produtos.racaoComPreco,
          "centro",
        );
        assert.deepEqual(resultado.fonteComercial, { tipo: "produto" });
      });

      it("3. categoria direta sem configuração herda a ancestral mais próxima", async () => {
        await definirModosCategoria(cliente, IDS.categorias.racoes, {
          entregaPropria: "ativado",
        });
        await definirCondicoesEntregaPropria(
          cliente,
          { categoriaId: IDS.categorias.racoes },
          [{ tipo: "cidade", destinoId: geo.bh, rapidaEmCentavos: 1200 }],
        );
        await definirCondicoesEntregaPropria(
          cliente,
          { categoriaId: IDS.categorias.pet },
          [{ tipo: "cidade", destinoId: geo.bh, rapidaEmCentavos: 1900 }],
        );
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });

        const resultado = await exigirMotor(IDS.produtos.racao, "centro");
        assert.equal(resultado.valorRapidaEmCentavos, 1200);
        assert.deepEqual(resultado.fonteComercial, {
          tipo: "categoria-ancestral",
          categoriaId: IDS.categorias.racoes,
          categoriaNome: "Rações",
        });
      });

      it("4. categoria filha com configuração vence a pai", async () => {
        await configurarRacoesPremium();
        await definirCondicoesEntregaPropria(
          cliente,
          { categoriaId: IDS.categorias.racoes },
          [{ tipo: "cidade", destinoId: geo.bh, rapidaEmCentavos: 1200 }],
        );
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });

        const resultado = await exigirMotor(IDS.produtos.racao, "centro");
        assert.equal(resultado.valorRapidaEmCentavos, 1000);
        assert.equal(resultado.fonteComercial.tipo, "categoria");
      });

      it("5. preço da Categoria para a Região Oeste com dias/corte da Agenda de BH", async () => {
        await configurarRacoesPremium();
        await definirCondicoesEntregaPropria(
          cliente,
          { categoriaId: IDS.categorias.racoesPremium },
          [
            { tipo: "cidade", destinoId: geo.bh, rapidaEmCentavos: 1000 },
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

        const resultado = await exigirMotor(IDS.produtos.racao, "oeste");
        assert.equal(resultado.valorRapidaEmCentavos, 850);
        assert.equal(resultado.nivelPreco, "regiao");
        assert.equal(resultado.nivelAgenda, "cidade");
        assert.equal(resultado.origemAgenda, "Cidade Belo Horizonte");
        assert.deepEqual(resultado.promessaRapida?.diasConfigurados, [1, 3, 5]);
        assert.equal(resultado.promessaRapida?.horarioCorteAplicado, "13:00");
        assert.equal(
          (await pdp(IDS.produtos.racao, "oeste")).rapida?.valorEmCentavos,
          850,
        );
      });

      it("6. programada R$ 0 é oferta GRÁTIS, não ausência", async () => {
        await configurarRacoesPremium();
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });
        const consulta = await pdp(IDS.produtos.racao, "noroeste");
        assert.ok(consulta.programada, "programada presente");
        assert.equal(consulta.programada.valorEmCentavos, 0);
      });

      it("7. sem configuração aplicável não inventa Entrega Própria", async () => {
        // Categoria Ativada sem nenhuma condição.
        await definirModosCategoria(cliente, IDS.categorias.racoesPremium, {
          entregaPropria: "ativado",
        });
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });
        assert.equal(
          (await pdp(IDS.produtos.racao, "centro")).rapida,
          undefined,
        );
        assert.equal(
          (await motor(IDS.produtos.racao, "centro")).encontrado,
          false,
        );

        // Condições cadastradas, mas nenhum nível ativa: padrão da loja desativado.
        await definirModosCategoria(cliente, IDS.categorias.racoesPremium, {
          entregaPropria: "herdar",
        });
        await definirCondicoesEntregaPropria(
          cliente,
          { categoriaId: IDS.categorias.racoesPremium },
          [{ tipo: "cidade", destinoId: geo.bh, rapidaEmCentavos: 1000 }],
        );
        assert.equal(
          (await pdp(IDS.produtos.racao, "centro")).rapida,
          undefined,
        );

        // Produto anterior à herança (modo nulo e antigo boolean desligado).
        await configurarRacoesPremium();
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: null,
        });
        assert.equal(
          (await pdp(IDS.produtos.racao, "centro")).rapida,
          undefined,
        );
      });

      it("8. fornecedor tipo Laquila em Categoria com Entrega Própria não recebe Entrega Própria", async () => {
        const baseGene = await pdp(
          IDS.produtos.capaceteFornecedorGene,
          "centro",
        );
        const baseTexx = await pdp(
          IDS.produtos.capaceteFornecedorTexx,
          "centro",
        );
        await definirModosCategoria(cliente, IDS.categorias.capacetes, {
          entregaPropria: "ativado",
        });
        await definirCondicoesEntregaPropria(
          cliente,
          { categoriaId: IDS.categorias.capacetes },
          [{ tipo: "cidade", destinoId: geo.bh, rapidaEmCentavos: 1000 }],
        );

        for (const modo of ["herdar", "ativado"] as const) {
          for (const [produtoId, base] of [
            [IDS.produtos.capaceteFornecedorGene, baseGene],
            [IDS.produtos.capaceteFornecedorTexx, baseTexx],
          ] as const) {
            await definirModosProduto(cliente, produtoId, {
              entregaPropria: modo,
            });
            const consulta = await pdp(produtoId, "centro");
            assert.equal(consulta.rapida, undefined, `${produtoId} ${modo}`);
            assert.equal(consulta.programada, undefined);
            // Logística externa do fornecedor intacta.
            assert.deepEqual(consulta.externas, base.externas);
            assert.equal(consulta.frenetFornecedor, 1);
            assert.equal((await motor(produtoId, "centro")).encontrado, false);
          }
        }
        // O produto da loja na mesma categoria recebe normalmente.
        await definirModosProduto(cliente, IDS.produtos.capaceteLoja, {
          entregaPropria: "herdar",
        });
        assert.equal(
          (await pdp(IDS.produtos.capaceteLoja, "centro")).rapida
            ?.valorEmCentavos,
          1000,
        );
      });

      it("9. Categoria com Frete Externo Desativado + Entrega Própria: só Entrega Própria e sem consultar a Frenet", async () => {
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

        const consulta = await pdp(IDS.produtos.hd, "centro");
        assert.equal(consulta.rapida?.valorEmCentavos, 1500);
        assert.deepEqual(consulta.externas, []);
        assert.equal(consulta.frenetLoja, 0, "Frenet não consultada");
      });

      it("10. Produto com Frete Externo Ativado + Entrega Própria herdada: ambos coexistem", async () => {
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
          freteExterno: "ativado",
        });

        const consulta = await pdp(IDS.produtos.hd, "centro");
        assert.equal(consulta.rapida?.valorEmCentavos, 1500);
        assert.deepEqual(
          consulta.externas.map((o) => o.servico),
          ["03298", "03220", ".package"],
        );
        assert.equal(consulta.frenetLoja, 1);
      });
    });

    describe("Geografia, agenda e promessas", () => {
      it("CEP > Bairro > Região > Cidade dentro da mesma fonte", async () => {
        await definirModosCategoria(cliente, IDS.categorias.racoesPremium, {
          entregaPropria: "ativado",
        });
        await definirCondicoesEntregaPropria(
          cliente,
          { categoriaId: IDS.categorias.racoesPremium },
          [
            { tipo: "cidade", destinoId: geo.bh, rapidaEmCentavos: 1000 },
            {
              tipo: "region",
              destinoId: geo.regioes.barreiro,
              rapidaEmCentavos: 2000,
            },
            {
              tipo: "bairro",
              destinoId: geo.bairroSantaEfigenia,
              rapidaEmCentavos: 1100,
            },
            {
              tipo: "cep-especifico",
              destinoId: geo.cepEspecificoBarreiro,
              rapidaEmCentavos: 1500,
            },
          ],
        );
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });

        const esperado: Array<[ChaveCep, string, number]> = [
          ["cepEspecificoBarreiro", "cep", 1500],
          ["barreiro", "regiao", 2000],
          ["bairroSantaEfigenia", "bairro", 1100],
          ["centro", "cidade", 1000],
          ["noroeste", "cidade", 1000],
        ];
        for (const [chave, nivel, valor] of esperado) {
          const resultado = await exigirMotor(IDS.produtos.racao, chave);
          assert.equal(resultado.nivelPreco, nivel, chave);
          assert.equal(resultado.valorRapidaEmCentavos, valor, chave);
        }
      });

      it("agenda própria da região vence a da cidade (Pampulha Ter/Qui 11:00)", async () => {
        await configurarRacoesPremium();
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });
        const resultado = await exigirMotor(IDS.produtos.racao, "pampulha");
        assert.equal(resultado.nivelAgenda, "regiao");
        assert.equal(resultado.nivelPreco, "cidade");
        assert.equal(resultado.promessaRapida?.dataPrometida, "2026-09-15");
        assert.equal(resultado.promessaRapida?.horarioCorteAplicado, "11:00");
      });

      it("corte: depois das 13:00 a rápida vai para a próxima data atendida", async () => {
        await configurarRacoesPremium();
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });
        mock.timers.setTime(SEGUNDA_14H.getTime());
        const resultado = await exigirMotor(IDS.produtos.racao, "centro");
        assert.equal(resultado.promessaRapida?.dataPrometida, "2026-09-16");
      });

      it("janelas 0/1/2/3 = segunda/quarta/sexta/próxima segunda", async () => {
        await definirModosCategoria(cliente, IDS.categorias.racoesPremium, {
          entregaPropria: "ativado",
        });
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });
        const datas = ["2026-09-14", "2026-09-16", "2026-09-18", "2026-09-21"];
        for (const [janelas, data] of datas.entries()) {
          await definirCondicoesEntregaPropria(
            cliente,
            { categoriaId: IDS.categorias.racoesPremium },
            [
              {
                tipo: "cidade",
                destinoId: geo.bh,
                rapidaEmCentavos: 1000,
                programada: { janelas, valorEmCentavos: 500 },
              },
            ],
          );
          const resultado = await exigirMotor(IDS.produtos.racao, "centro");
          assert.equal(
            resultado.entregaProgramada?.promessa.dataPrometida,
            data,
            `janelas ${janelas}`,
          );
        }
      });

      it("rápida desativada mantém só a programada; condição inativa não vale", async () => {
        await definirModosCategoria(cliente, IDS.categorias.racoesPremium, {
          entregaPropria: "ativado",
        });
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });
        await definirCondicoesEntregaPropria(
          cliente,
          { categoriaId: IDS.categorias.racoesPremium },
          [
            {
              tipo: "cidade",
              destinoId: geo.bh,
              rapidaEmCentavos: 1000,
              rapidaAtiva: false,
              programada: { janelas: 1, valorEmCentavos: 0 },
            },
          ],
        );
        const consulta = await pdp(IDS.produtos.racao, "centro");
        assert.equal(consulta.rapida, undefined);
        assert.equal(consulta.programada?.valorEmCentavos, 0);

        await definirCondicoesEntregaPropria(
          cliente,
          { categoriaId: IDS.categorias.racoesPremium },
          [
            {
              tipo: "cidade",
              destinoId: geo.bh,
              rapidaEmCentavos: 1000,
              ativo: false,
            },
          ],
        );
        assert.equal(
          (await pdp(IDS.produtos.racao, "centro")).rapida,
          undefined,
        );
      });

      it("PDP (buy-box) usa a disponibilidade resolvida, não o boolean legado", async () => {
        await configurarRacoesPremium();
        const slug = `fixture-produto-${IDS.produtos.racao.slice(-4)}`;
        assert.equal(
          (await m.getProductBySlug(slug))?.allowsOwnDelivery,
          false,
        );
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });
        assert.equal((await m.getProductBySlug(slug))?.allowsOwnDelivery, true);
      });
    });

    describe("Frete Externo", () => {
      it("Produto > Categoria > ancestrais > padrão Ativado", async () => {
        const origem = async () =>
          (
            await m.buscarDisponibilidadeFreteExternoProduto({
              produtoId: IDS.produtos.hd,
            })
          ).origem.tipo;
        assert.equal(await origem(), "padrao-loja");
        await definirModosCategoria(cliente, IDS.categorias.informatica, {
          freteExterno: "desativado",
        });
        assert.equal(await origem(), "categoria-ancestral");
        assert.deepEqual((await pdp(IDS.produtos.hd, "centro")).externas, []);
        await definirModosCategoria(cliente, IDS.categorias.hdInterno, {
          freteExterno: "ativado",
        });
        assert.equal(await origem(), "categoria");
        assert.equal((await pdp(IDS.produtos.hd, "centro")).externas.length, 3);
        await definirModosProduto(cliente, IDS.produtos.hd, {
          freteExterno: "desativado",
        });
        assert.equal(await origem(), "produto");
        const consulta = await pdp(IDS.produtos.hd, "centro");
        assert.deepEqual(consulta.externas, []);
        assert.equal(consulta.frenetLoja, 0);
      });

      it("Ativado deixa as regras específicas e classificações decidirem", async () => {
        await cliente.query(
          "INSERT INTO regras_produtos_frete (produto_id, efeito, provedor_frete_id, servico_frete_id, ativo) VALUES ($1, 'bloquear', $2, $3, true)",
          [IDS.produtos.hd, IDS.catalogo.provedorFrenet, IDS.catalogo.pac],
        );
        await cliente.query(
          "INSERT INTO produtos_tipos_logisticos (produto_id, tipo_logistico_id) VALUES ($1, $2)",
          [IDS.produtos.hd, IDS.catalogo.tipoFragil],
        );
        await cliente.query(
          "INSERT INTO regras_tipos_logisticos_frete (tipo_logistico_id, efeito, provedor_frete_id, transportadora_frete_id, ativo) VALUES ($1, 'bloquear', $2, $3, true)",
          [
            IDS.catalogo.tipoFragil,
            IDS.catalogo.provedorFrenet,
            IDS.catalogo.jadlog,
          ],
        );
        await definirModosProduto(cliente, IDS.produtos.hd, {
          freteExterno: "ativado",
        });
        assert.deepEqual(
          (await pdp(IDS.produtos.hd, "centro")).externas.map((o) => o.servico),
          ["03220"],
        );

        await cliente.query(
          "INSERT INTO regras_categorias_frete (categoria_id, efeito, provedor_frete_id, servico_frete_id, ativo) VALUES ($1, 'bloquear', $2, $3, true)",
          [
            IDS.categorias.hdInterno,
            IDS.catalogo.provedorFrenet,
            IDS.catalogo.sedex,
          ],
        );
        await cliente.query("DELETE FROM regras_produtos_frete");
        await cliente.query("DELETE FROM regras_tipos_logisticos_frete");
        assert.deepEqual(
          (await pdp(IDS.produtos.hd, "centro")).externas.map((o) => o.servico),
          ["03298", ".package"],
        );
      });

      it("Categoria com Frete Externo Desativado não desliga a logística do fornecedor", async () => {
        // Assinatura sem identificador (o id do produto compõe o identificador).
        const servicos = (opcoes: OpcaoPdp[]) =>
          opcoes.map((o) => [o.servico, o.valorEmCentavos]);
        const base = await pdp(IDS.produtos.capaceteFornecedorGene, "centro");
        await definirModosCategoria(cliente, IDS.categorias.capacetes, {
          freteExterno: "desativado",
        });
        await definirModosCategoria(cliente, IDS.categorias.moto, {
          freteExterno: "desativado",
        });
        for (const produtoId of [
          IDS.produtos.capaceteFornecedorGene,
          IDS.produtos.capaceteFornecedorTexx,
        ]) {
          const consulta = await pdp(produtoId, "centro");
          assert.deepEqual(
            servicos(consulta.externas),
            servicos(base.externas),
          );
          assert.equal(consulta.externas.length, 3);
          assert.equal(consulta.frenetFornecedor, 1);
          assert.equal(consulta.rapida, undefined);
        }
        // Na mesma categoria, o produto da loja perde o frete externo.
        assert.deepEqual(
          (await pdp(IDS.produtos.capaceteLoja, "centro")).externas,
          [],
        );
      });
    });

    describe("Carrinho e checkout", () => {
      const item = (id: string, produtoId: string, varianteId: string) => ({
        id,
        produtoId,
        produtoVarianteId: varianteId,
        nome: id,
        imagemUrl: "",
        precoEmCentavos: 10000,
        quantidade: 1,
        freteEscolhido: {
          id: "frenet" as const,
          nome: "Pendente",
          prazo: "",
          valorEmCentavos: 0,
        },
      });

      it("loja (Entrega Própria herdada) + fornecedor (frete externo) com seleção por grupo", async () => {
        await configurarRacoesPremium();
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });
        const itens = [
          item("racao", IDS.produtos.racao, IDS.variantes.racao),
          item(
            "capacete",
            IDS.produtos.capaceteFornecedorGene,
            IDS.variantes.capaceteFornecedorGene,
          ),
        ];

        const resumo = await m.calcularResumoCheckout({
          itens,
          cepEntrega: CEPS.centro.cep,
        });
        assert.ok(resumo);
        const loja = resumo.cotacoesEntrega.find(
          (grupo) => grupo.chaveGrupo === "expedicao:loja",
        );
        const fornecedor = resumo.cotacoesEntrega.find((grupo) =>
          grupo.chaveGrupo.startsWith("expedicao:fornecedor"),
        );
        const rapida = loja?.opcoes.find(
          (o) => o.servico === "entrega-propria-atual",
        );
        const programada = loja?.opcoes.find(
          (o) => o.servico === "entrega-programada",
        );
        assert.equal(rapida?.valorEmCentavos, 1000);
        assert.equal(programada?.valorEmCentavos, 0);
        const pac = fornecedor?.opcoes.find((o) => o.servico === "03298");
        assert.equal(pac?.valorEmCentavos, 2590);
        assert.equal(
          fornecedor?.opcoes.some((o) => o.provedor === "entrega-propria"),
          false,
        );

        const comSelecao = await m.calcularResumoCheckout({
          itens,
          cepEntrega: CEPS.centro.cep,
          selecoesEntregaPorGrupo: [
            {
              chaveGrupo: "expedicao:loja",
              identificador: String(rapida?.identificador),
              cep: CEPS.centro.cep,
            },
            {
              chaveGrupo: String(fornecedor?.chaveGrupo),
              identificador: String(pac?.identificador),
              cep: CEPS.centro.cep,
            },
          ],
        });
        assert.equal(
          comSelecao?.totaisPorFormaPagamento.pix.freteEmCentavos,
          1000 + 2590,
        );

        // Carrinho: prévia de totais continua calculando com os mesmos itens.
        const previa = await m.calcularPreviaTotaisPedido({ itens });
        assert.ok(previa);
      });

      it("checkout sem Frete Externo: Entrega Própria herdada + Retirada, sem consultar a Frenet", async () => {
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
        const inicio = chamadasFrenet.length;
        const resumo = await m.calcularResumoCheckout({
          itens: [item("hd", IDS.produtos.hd, IDS.variantes.hd)],
          cepEntrega: CEPS.centro.cep,
        });
        const opcoes = resumo?.cotacoesEntrega[0]?.opcoes ?? [];
        assert.equal(
          opcoes.find((o) => o.servico === "entrega-propria-atual")
            ?.valorEmCentavos,
          1500,
        );
        assert.equal(
          opcoes.some((o) => o.provedor === "frenet"),
          false,
        );
        assert.equal(
          opcoes.some((o) => o.provedor === "retirada"),
          true,
        );
        assert.equal(chamadasFrenet.length - inicio, 0);
      });
    });

    describe("Alteração em Massa (leitura)", () => {
      it("lista o modo efetivo salvo e marca produtos de fornecedor", async () => {
        await definirModosProduto(cliente, IDS.produtos.racao, {
          entregaPropria: "herdar",
        });
        const resultado = await m.listarDadosAlteracaoEmMassa([
          IDS.produtos.racao,
          IDS.produtos.racaoComPreco,
          IDS.produtos.capaceteLoja,
          IDS.produtos.capaceteFornecedorGene,
        ]);
        assert.equal(resultado.sucesso, true);
        const porId = new Map(resultado.dados.produtos.map((p) => [p.id, p]));
        assert.equal(
          porId.get(IDS.produtos.racao)?.disponibilidadeEntregaPropria,
          "herdar",
        );
        // Legados: modo nulo segue o antigo boolean.
        assert.equal(
          porId.get(IDS.produtos.racaoComPreco)?.disponibilidadeEntregaPropria,
          "ativado",
        );
        assert.equal(
          porId.get(IDS.produtos.capaceteLoja)?.disponibilidadeEntregaPropria,
          "desativado",
        );
        assert.equal(
          porId.get(IDS.produtos.capaceteFornecedorGene)?.expedidoPorFornecedor,
          true,
        );
        assert.equal(
          porId.get(IDS.produtos.racao)?.expedidoPorFornecedor,
          false,
        );
      });
    });
  },
);
