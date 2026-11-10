import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import {
  chromium,
  expect,
  type Page,
  type Response,
  type Route,
} from "@playwright/test";
import { parse } from "dotenv";
import { Client } from "pg";

type DadosBasicos = { name: string; slug: string; sku: string };
type DadosAction = DadosBasicos & Record<string, unknown>;

const ORIGEM = "http://127.0.0.1:3000";

function lerAmbienteLocal() {
  const pasta = process.cwd();
  const banco = parse(readFileSync(join(pasta, ".env.local")));
  const admin = parse(readFileSync(join(pasta, ".env.admin-local.local")));
  const url = new URL(banco.DATABASE_URL);
  if (
    url.hostname !== "127.0.0.1" ||
    url.port !== "55432" ||
    url.pathname !== "/nooo_desenvolvimento"
  ) {
    throw new Error(
      "Teste recusado: DATABASE_URL não aponta para o PostgreSQL local obrigatório.",
    );
  }
  if (!admin.ADMIN_LOCAL_EMAIL || !admin.ADMIN_LOCAL_SENHA) {
    throw new Error("Credenciais do administrador local indisponíveis.");
  }
  return {
    urlBanco: banco.DATABASE_URL,
    email: admin.ADMIN_LOCAL_EMAIL,
    senha: admin.ADMIN_LOCAL_SENHA,
  };
}

async function entrarUmaVez(pagina: Page, email: string, senha: string) {
  await pagina.goto(`${ORIGEM}/admin/login`);
  await pagina.getByPlaceholder("seu@email.com ou (31) 99999-9999").fill(email);
  await pagina.getByPlaceholder("Digite sua senha").fill(senha);
  const respostaLogin = pagina.waitForResponse((resposta) =>
    resposta.url().includes("/api/auth/login/admin/identificador"),
  );
  await pagina.getByRole("button", { name: /Entrar/i }).click();
  const resposta = await respostaLogin;
  assert.equal(
    resposta.status(),
    200,
    `Login local retornou HTTP ${resposta.status()}.`,
  );
  await pagina.waitForURL("**/admin", { timeout: 20_000 });
}

async function preencherCadastro(
  pagina: Page,
  dados: DadosBasicos,
  variavel = false,
) {
  await pagina.goto(`${ORIGEM}/admin/products/new`, {
    waitUntil: "domcontentloaded",
  });

  // Trocar de aba comprova que os handlers React já estão ativos antes do fill.
  const abaPrecos = pagina.getByRole("tab", { name: "Preços" });
  for (let tentativa = 0; tentativa < 10; tentativa += 1) {
    await abaPrecos.click();
    if ((await abaPrecos.getAttribute("data-state")) === "active") break;
    await pagina.waitForTimeout(300);
  }
  await expect(abaPrecos).toHaveAttribute("data-state", "active");
  const abaBasico = pagina.getByRole("tab", { name: "Básico" });
  await abaBasico.click();
  await expect(abaBasico).toHaveAttribute("data-state", "active");

  await pagina.locator("#name").fill(dados.name);
  await expect(pagina.locator("#slug")).not.toHaveValue("");
  await pagina.locator("#slug").fill(dados.slug);
  await pagina.locator("#sku").fill(dados.sku);
  const descricao = pagina.locator('[contenteditable="true"]').first();
  await descricao.fill(`Descrição automatizada de ${dados.slug}.`);

  if (variavel) {
    await pagina.getByRole("button", { name: /Produto com variantes/ }).click();
  }

  // A categoria causa nova renderização; os três valores precisam sobreviver.
  await pagina.getByRole("button", { name: /Selecione a categoria/ }).click();
  await pagina.getByText("Rações", { exact: true }).click();
  await expect(pagina.locator("#name")).toHaveValue(dados.name);
  await expect(pagina.locator("#slug")).toHaveValue(dados.slug);
  await expect(pagina.locator("#sku")).toHaveValue(dados.sku);
  await expect(
    pagina.locator('[contenteditable="true"]').first(),
  ).toContainText(dados.slug);
}

/** Exercita os controles reais da aba única, inclusive em largura de celular. */
async function configurarTransporte(
  pagina: Page,
  peso: string,
  emCelular = false,
) {
  if (emCelular) await pagina.setViewportSize({ width: 390, height: 844 });
  await pagina.getByRole("tab", { name: "Entrega", exact: true }).click();
  await expect(
    pagina.getByRole("tab", { name: "Dados para transporte" }),
  ).toHaveAttribute("data-state", "active");
  await expect(
    pagina.getByRole("tab", { name: "Frete", exact: true }),
  ).toHaveCount(0);
  await pagina.locator("#peso-frete-externo").fill(peso);
  await pagina.locator("#altura-frete-externo").fill("20");
  await pagina.locator("#largura-frete-externo").fill("30");
  await pagina.locator("#comprimento-frete-externo").fill("40");
  await pagina.getByRole("tab", { name: "Origem e disponibilidade" }).click();
  await pagina.getByRole("switch", { name: "Transportadora" }).click();
  await expect(
    pagina.getByRole("switch", { name: "Transportadora" }),
  ).toBeChecked();
  await pagina.getByRole("tab", { name: "Frete Externo" }).click();
  await expect(
    pagina.getByText("Disponibilidade do Frete Externo"),
  ).toBeVisible();
  await pagina.getByRole("tab", { name: "Retirada", exact: true }).click();
  await expect(pagina.getByText("Retirada Local").first()).toBeVisible();
  await pagina.getByRole("tab", { name: "Diagnóstico" }).click();
  await expect(pagina.getByText("Dados básicos completos")).toBeVisible();
  if (emCelular) await pagina.setViewportSize({ width: 1280, height: 800 });
}

async function enviarUmaVez(
  pagina: Page,
  rotulo: string,
  esperado: DadosBasicos,
  alterar?: (dados: DadosAction) => void,
) {
  let quantidadeEnvios = 0;
  const rota = async (interceptacao: Route) => {
    const requisicao = interceptacao.request();
    if (
      requisicao.method() !== "POST" ||
      !requisicao.headers()["next-action"]
    ) {
      await interceptacao.continue();
      return;
    }
    let argumentos: unknown;
    try {
      argumentos = JSON.parse(requisicao.postData() ?? "");
    } catch {
      await interceptacao.continue();
      return;
    }
    if (
      !Array.isArray(argumentos) ||
      (!argumentos[0]?.name && argumentos[0]?.name !== "")
    ) {
      await interceptacao.continue();
      return;
    }
    const dados = argumentos[0] as DadosAction;
    quantidadeEnvios += 1;
    if (
      quantidadeEnvios !== 1 ||
      dados.name !== esperado.name ||
      dados.slug !== esperado.slug ||
      dados.sku !== esperado.sku
    ) {
      await interceptacao.abort();
      return;
    }
    alterar?.(dados);
    await interceptacao.continue({ postData: JSON.stringify(argumentos) });
  };

  await pagina.route("**/admin/products/new", rota);
  const respostaPendente = pagina.waitForResponse((resposta) => {
    const requisicao = resposta.request();
    if (
      new URL(resposta.url()).pathname !== "/admin/products/new" ||
      !requisicao.headers()["next-action"]
    ) {
      return false;
    }
    try {
      const argumentos = JSON.parse(requisicao.postData() ?? "");
      return Array.isArray(argumentos) && "name" in argumentos[0];
    } catch {
      return false;
    }
  });
  await pagina.getByRole("button", { name: "Salvar Rascunho" }).click();
  let resposta: Response;
  try {
    resposta = await respostaPendente;
  } finally {
    await pagina.unroute("**/admin/products/new", rota);
  }
  assert.equal(
    quantidadeEnvios,
    1,
    `${rotulo}: envio duplicado ou payload incompleto.`,
  );
  assert.equal(resposta.status(), 200, `${rotulo}: resposta HTTP inesperada.`);
  const aviso = pagina.locator("[data-sonner-toast]").last();
  await aviso.waitFor({ state: "visible", timeout: 15_000 });
  const mensagem = await aviso.innerText();
  const sucesso = mensagem.includes("Rascunho salvo.");
  console.log(
    JSON.stringify({ cenario: rotulo, http: resposta.status(), mensagem }),
  );
  return sucesso;
}

test(
  "cadastro atômico de produtos no PostgreSQL local",
  { timeout: 300_000 },
  async () => {
    const ambiente = lerAmbienteLocal();
    const cliente = new Client({ connectionString: ambiente.urlBanco });
    const navegador = await chromium.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const contexto = await navegador.newContext({ baseURL: ORIGEM });
    const pagina = await contexto.newPage();
    const marcador = Date.now().toString(36);
    const prefixo = `validacao-atomica-${marcador}`;
    const prefixoSku = `VAL-ATOM-${marcador.toUpperCase()}`;
    let idsIniciais: string[] = [];
    let conectado = false;

    try {
      await cliente.connect();
      conectado = true;
      const identidade = await cliente.query<{
        banco: string;
        container: string;
      }>(
        "select current_database() as banco, current_setting('cluster_name') as container",
      );
      assert.deepEqual(identidade.rows[0], {
        banco: "nooo_desenvolvimento",
        container: "nooo-postgres-local",
      });
      idsIniciais = (
        await cliente.query<{ id: string }>(
          "select id from product order by id",
        )
      ).rows.map((linha) => linha.id);
      const categoria = await cliente.query<{ id: string }>(
        "select id from category where name='Rações' and is_active=true limit 1",
      );
      assert.ok(categoria.rows[0], "Categoria ativa de teste indisponível.");
      const cidade = await cliente.query<{ id: number }>(
        "select id from cities order by id limit 1",
      );
      assert.ok(cidade.rows[0], "Cidade de teste indisponível.");
      const skuExistente = await cliente.query<{ sku: string }>(
        "select sku from product_variant where sku <> '' order by id limit 1",
      );
      assert.ok(
        skuExistente.rows[0],
        "SKU existente para provocar rollback indisponível.",
      );

      await entrarUmaVez(pagina, ambiente.email, ambiente.senha);

      const simples = {
        name: `VALIDACAO CADASTRO ATOMICO ${marcador} SIMPLES`,
        slug: `${prefixo}-simples`,
        sku: `${prefixoSku}-S`,
      };
      await preencherCadastro(pagina, simples);
      await configurarTransporte(pagina, "1.25");
      assert.equal(
        await enviarUmaVez(
          pagina,
          "simples válido e logística",
          simples,
          (dados) => {
            dados.mpnProduto = `${prefixoSku}-MPN`;
            const entrega = dados.entrega as Record<string, unknown>;
            assert.deepEqual(entrega.tiposEntregaPermitidos, [
              "own",
              "carrier",
            ]);
            assert.deepEqual(dados.dimensoesFreteExterno, {
              pesoEmKg: "1.25",
              alturaEmCm: "20",
              larguraEmCm: "30",
              comprimentoEmCm: "40",
            });
            entrega.precosEntregaPropria = [
              {
                destinationType: "cidade",
                destinationId: cidade.rows[0].id,
                shippingPrice: 1290,
                rapidDeliveryActive: false,
                deliveryDeadline: "Até 3 dias",
                scheduledDeliveryActive: true,
                scheduledDeliveryMinDays: 2,
                scheduledDeliveryPrice: 390,
                isActive: true,
              },
            ];
            dados.pricing = {
              modalities: {
                stock: { price: "29.90", deliveryText: "Disponível" },
              },
              mainCardPriceType: "stock",
            };
          },
        ),
        true,
      );
      const produtoSimples = await cliente.query<{
        id: string;
        allowed_delivery_types: string[];
        weight_in_grams: number;
        height_in_cm: number;
        width_in_cm: number;
        length_in_cm: number;
      }>(
        "select id,allowed_delivery_types,weight_in_grams,height_in_cm,width_in_cm,length_in_cm from product where slug=$1",
        [simples.slug],
      );
      assert.equal(produtoSimples.rowCount, 1);
      assert.deepEqual(produtoSimples.rows[0].allowed_delivery_types, [
        "own",
        "carrier",
      ]);
      assert.deepEqual(
        [
          produtoSimples.rows[0].weight_in_grams,
          produtoSimples.rows[0].height_in_cm,
          produtoSimples.rows[0].width_in_cm,
          produtoSimples.rows[0].length_in_cm,
        ],
        [1250, 20, 30, 40],
      );
      const preco = await cliente.query<{
        rapid_delivery_active: boolean;
        scheduled_delivery_active: boolean;
        scheduled_delivery_min_days: number;
        scheduled_delivery_price: number;
        shipping_price: number;
      }>(
        "select rapid_delivery_active,scheduled_delivery_active,scheduled_delivery_min_days,scheduled_delivery_price,shipping_price from product_own_delivery_prices where product_id=$1",
        [produtoSimples.rows[0].id],
      );
      assert.deepEqual(preco.rows[0], {
        rapid_delivery_active: false,
        scheduled_delivery_active: true,
        scheduled_delivery_min_days: 2,
        scheduled_delivery_price: 390,
        shipping_price: 1290,
      });
      const identificador = await cliente.query<{ valor: string }>(
        "select valor from produto_identificadores_catalogo where produto_id=$1 and tipo='mpn'",
        [produtoSimples.rows[0].id],
      );
      assert.equal(identificador.rows[0]?.valor, `${prefixoSku}-MPN`);

      // Edição comum sem abrir Entrega não deve regravar dados logísticos.
      const consultaLogistica =
        "select allowed_delivery_types,weight_in_grams,height_in_cm,width_in_cm,length_in_cm,allows_own_delivery,disponibilidade_entrega_propria from product where id=$1";
      const consultaPrecos =
        "select * from product_own_delivery_prices where product_id=$1 order by id";
      const logisticaAntes = await cliente.query(consultaLogistica, [
        produtoSimples.rows[0].id,
      ]);
      const precosAntes = await cliente.query(consultaPrecos, [
        produtoSimples.rows[0].id,
      ]);
      await pagina.goto(
        `${ORIGEM}/admin/products/${produtoSimples.rows[0].id}/edit`,
      );
      await expect(pagina.locator("#name")).toHaveValue(simples.name);
      const abaPrecosEdicao = pagina.getByRole("tab", { name: "Preços" });
      for (let tentativa = 0; tentativa < 10; tentativa += 1) {
        await abaPrecosEdicao.click();
        if ((await abaPrecosEdicao.getAttribute("data-state")) === "active")
          break;
        await pagina.waitForTimeout(300);
      }
      await expect(abaPrecosEdicao).toHaveAttribute("data-state", "active");
      await pagina.getByRole("tab", { name: "Básico" }).click();
      const novoNome = `${simples.name} REVISADO`;
      await pagina.locator("#name").fill(novoNome);
      const respostaEdicao = pagina.waitForResponse(
        (resposta) =>
          resposta
            .url()
            .includes(`/admin/products/${produtoSimples.rows[0].id}/edit`) &&
          Boolean(resposta.request().headers()["next-action"]),
      );
      await pagina
        .getByRole("button", { name: "Atualizar", exact: true })
        .click();
      assert.equal((await respostaEdicao).status(), 200);
      await expect(pagina.locator("[data-sonner-toast]").last()).toContainText(
        "atualizado",
      );
      const nomeAtualizado = await cliente.query<{ name: string }>(
        "select name from product where id=$1",
        [produtoSimples.rows[0].id],
      );
      assert.equal(nomeAtualizado.rows[0]?.name, novoNome);
      assert.deepEqual(
        (await cliente.query(consultaLogistica, [produtoSimples.rows[0].id]))
          .rows,
        logisticaAntes.rows,
      );
      assert.deepEqual(
        (await cliente.query(consultaPrecos, [produtoSimples.rows[0].id])).rows,
        precosAntes.rows,
      );

      const variavel = {
        name: `VALIDACAO CADASTRO ATOMICO ${marcador} VARIAVEL`,
        slug: `${prefixo}-variavel`,
        sku: `${prefixoSku}-V`,
      };
      await preencherCadastro(pagina, variavel, true);
      await configurarTransporte(pagina, "2", true);
      assert.equal(
        await enviarUmaVez(pagina, "variável válido", variavel, (dados) => {
          assert.deepEqual(
            (dados.entrega as Record<string, unknown>).tiposEntregaPermitidos,
            ["own", "carrier"],
          );
          dados.attributes = [{ name: "Cor", values: ["Azul"] }];
          dados.variants = [
            {
              sku: `${prefixoSku}-V-AZUL`,
              name: "Azul",
              attributes: { Cor: "Azul" },
              priceInCents: 1999,
              stockQuantity: 2,
              weightInGrams: 850,
              heightInCm: 10,
              widthInCm: 15,
              lengthInCm: 20,
              isActive: true,
              isDefault: true,
            },
          ];
        }),
        true,
      );
      const produtoVariavel = await cliente.query<{
        id: string;
        product_kind: string;
      }>("select id,product_kind from product where slug=$1", [variavel.slug]);
      assert.equal(produtoVariavel.rows[0]?.product_kind, "variable");
      const medidasProdutoVariavel = await cliente.query<{
        weight_in_grams: number;
        height_in_cm: number;
        width_in_cm: number;
        length_in_cm: number;
      }>(
        "select weight_in_grams,height_in_cm,width_in_cm,length_in_cm from product where id=$1",
        [produtoVariavel.rows[0].id],
      );
      assert.deepEqual(medidasProdutoVariavel.rows[0], {
        weight_in_grams: 2000,
        height_in_cm: 20,
        width_in_cm: 30,
        length_in_cm: 40,
      });
      const variantes = await cliente.query<{
        sku: string;
        weight_in_grams: number;
        height_in_cm: number;
        width_in_cm: number;
        length_in_cm: number;
      }>(
        "select sku,weight_in_grams,height_in_cm,width_in_cm,length_in_cm from product_variant where product_id=$1",
        [produtoVariavel.rows[0].id],
      );
      assert.deepEqual(variantes.rows, [
        {
          sku: `${prefixoSku}-V-AZUL`,
          weight_in_grams: 850,
          height_in_cm: 10,
          width_in_cm: 15,
          length_in_cm: 20,
        },
      ]);

      for (const campo of ["name", "slug", "sku", "description"] as const) {
        const dados = {
          name: `VALIDACAO CADASTRO ATOMICO ${marcador} INVALIDO ${campo}`,
          slug: `${prefixo}-invalido-${campo}`,
          sku: `${prefixoSku}-I-${campo.toUpperCase()}`,
        };
        await preencherCadastro(pagina, dados);
        assert.equal(
          await enviarUmaVez(pagina, `${campo} vazio`, dados, (enviado) => {
            enviado[campo] = "   ";
          }),
          false,
        );
        const encontrado = await cliente.query(
          "select id from product where slug=$1",
          [dados.slug],
        );
        assert.equal(encontrado.rowCount, 0);
      }

      const contarRegistros = () =>
        cliente.query<{
          produtos: number;
          variantes: number;
          precos: number;
          entrega: number;
          identificadores: number;
        }>(
          `select
          (select count(*)::int from product) as produtos,
          (select count(*)::int from product_variant) as variantes,
          (select count(*)::int from product_pricing) as precos,
          (select count(*)::int from product_own_delivery_prices) as entrega,
          (select count(*)::int from produto_identificadores_catalogo) as identificadores`,
        );

      const rollback = {
        name: `VALIDACAO CADASTRO ATOMICO ${marcador} ROLLBACK`,
        slug: `${prefixo}-rollback`,
        sku: skuExistente.rows[0].sku,
      };
      const antesDoRollback = (await contarRegistros()).rows[0];
      await preencherCadastro(pagina, rollback);
      assert.equal(
        await enviarUmaVez(
          pagina,
          "rollback por SKU duplicado",
          rollback,
          (dados) => {
            const entrega = dados.entrega as Record<string, unknown>;
            entrega.precosEntregaPropria = [
              {
                destinationType: "cidade",
                destinationId: cidade.rows[0].id,
                shippingPrice: 1000,
                scheduledDeliveryActive: true,
                scheduledDeliveryMinDays: 1,
                scheduledDeliveryPrice: 200,
              },
            ];
            dados.pricing = {
              modalities: {
                stock: { price: "12.00", deliveryText: "Disponível" },
              },
            };
          },
        ),
        false,
      );
      assert.equal(
        (
          await cliente.query("select id from product where slug=$1", [
            rollback.slug,
          ])
        ).rowCount,
        0,
        "Falha intermediária deixou produto sem rollback.",
      );
      assert.deepEqual((await contarRegistros()).rows[0], antesDoRollback);

      // Este erro acontece ainda mais tarde: depois de produto, preços e variante.
      const identificadorInvalido = {
        name: `VALIDACAO CADASTRO ATOMICO ${marcador} MPN INVALIDO`,
        slug: `${prefixo}-mpn-invalido`,
        sku: `${prefixoSku}-MPN-INVALIDO`,
      };
      await preencherCadastro(pagina, identificadorInvalido);
      assert.equal(
        await enviarUmaVez(
          pagina,
          "rollback por identificador inválido",
          identificadorInvalido,
          (dados) => {
            dados.mpnProduto = "X".repeat(121);
            dados.pricing = {
              modalities: {
                stock: { price: "12.00", deliveryText: "Disponível" },
              },
            };
          },
        ),
        false,
      );
      assert.equal(
        (
          await cliente.query("select id from product where slug=$1", [
            identificadorInvalido.slug,
          ])
        ).rowCount,
        0,
      );
      assert.deepEqual((await contarRegistros()).rows[0], antesDoRollback);
    } finally {
      await contexto.close();
      await navegador.close();
      if (conectado) {
        // Apenas linhas criadas por este teste, identificadas por prefixo único.
        const linhas = await cliente.query<{ id: string }>(
          `select id from product where (
          slug like $1 or sku like $2 or name like $3
        )`,
          [
            `${prefixo}%`,
            `${prefixoSku}%`,
            `VALIDACAO CADASTRO ATOMICO ${marcador}%`,
          ],
        );
        if (linhas.rows.length) {
          const ids = linhas.rows.map((linha) => linha.id);
          const removidos = await cliente.query(
            "delete from product where id = any($1::uuid[]) returning id",
            [ids],
          );
          assert.equal(removidos.rowCount, ids.length);
        }
        if (idsIniciais.length) {
          const idsFinais = (
            await cliente.query<{ id: string }>(
              "select id from product order by id",
            )
          ).rows.map((linha) => linha.id);
          assert.deepEqual(
            idsFinais,
            idsIniciais,
            "Produtos preexistentes foram alterados.",
          );
        }
        await cliente.end();
      }
    }
  },
);
