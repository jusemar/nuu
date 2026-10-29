import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { createServer } from "node:net";

import {
  type BrowserContext,
  chromium,
  devices,
  type Page,
} from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import type { Pool } from "pg";

/** Navegador → Server Actions → PostgreSQL real, somente fixtures descartáveis. */
export async function validarInterfaceRepresentante({
  pool,
  url,
  produtoA,
  fornecedorA,
  vinculoA,
}: {
  pool: Pool;
  url: string;
  produtoA: string;
  produtoB: string;
  fornecedorA: string;
  fornecedorB: string;
  vinculoA: string;
  adminA: string;
}) {
  const porta = await new Promise<number>((resolve, reject) => {
    const servidor = createServer();
    servidor.on("error", reject);
    servidor.listen(0, "127.0.0.1", () => {
      const endereco = servidor.address();
      if (!endereco || typeof endereco === "string")
        return reject(new Error("Porta indisponível"));
      servidor.close(() => resolve(endereco.port));
    });
  });
  const origem = `http://127.0.0.1:${porta}`;
  const senha = "fixture-somente-local-etapa4";
  const hash = await hashPassword(senha);
  await pool.query(
    "INSERT INTO account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES('fixture-etapa4-a','rep-a','credential','rep-a',$1,now(),now()),('fixture-etapa4-gestor','gestor','credential','gestor',$1,now(),now())",
    [hash],
  );
  await pool.query(
    "UPDATE representantes_fornecedores SET ativo=false WHERE usuario_id='rep-a' AND fornecedor_id<>$1",
    [fornecedorA],
  );
  const log = openSync("/tmp/nooo-etapa4-dev.log", "w");
  const processo = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(porta),
    ],
    {
      detached: true,
      stdio: ["ignore", log, log],
      env: {
        ...process.env,
        NODE_OPTIONS: "",
        NODE_ENV: "development",
        DATABASE_URL: url,
        NOOO_BANCO: "local",
        NOOO_NEXT_DIST_DIR: ".next/etapa4-dev",
        APP_ENVIRONMENT: "homologacao",
        BETTER_AUTH_URL: origem,
        NEXT_PUBLIC_APP_URL: origem,
        BETTER_AUTH_SECRET:
          "fixture-etapa4-interface-sem-segredos-reais-0123456789",
        GOOGLE_CLIENT_ID: "fixture",
        GOOGLE_CLIENT_SECRET: "fixture",
        RESEND_API_KEY: "fixture",
        STRIPE_SECRET_KEY: "sk_test_fixture",
        BLOB_READ_WRITE_TOKEN: "fixture",
      },
    },
  );
  closeSync(log);
  const navegador = await chromium.launch({ headless: true });
  const pasta = "docs/prototipos/representante-etapa-4/implementacao";
  mkdirSync(pasta, { recursive: true });
  async function login(contexto: BrowserContext, email = "a@fixture.invalid") {
    const resposta = await contexto.request.post(
      `${origem}/api/auth/login/admin/identificador`,
      { headers: { Origin: origem }, data: { identificador: email, senha } },
    );
    assert.equal(resposta.status(), 200, "Login local de fixture");
  }
  const erros: string[] = [];
  let ultimaPagina: Page | undefined;
  function monitorar(pagina: Page) {
    ultimaPagina = pagina;
    pagina.on("pageerror", (e) => erros.push(e.message));
  }
  async function semOverflow(pagina: Page) {
    assert.equal(
      await pagina.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      "Não deve existir overflow horizontal da página",
    );
  }
  try {
    let pronto = false;
    for (let i = 0; i < 180; i++) {
      try {
        const resposta = await fetch(`${origem}/api/auth/ok`, {
          signal: AbortSignal.timeout(3000),
        });
        if (resposta.ok) {
          pronto = true;
          break;
        }
      } catch {
        /* Servidor ainda compilando. */
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    assert.ok(pronto, "Servidor local deveria iniciar");
    const desktop = await navegador.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
    });
    await login(desktop);
    const pagina = await desktop.newPage();
    monitorar(pagina);
    await pagina.goto(`${origem}/admin/products`);
    await pagina
      .getByRole("heading", { name: "Produtos", exact: true })
      .last()
      .waitFor();
    await pagina
      .getByRole("link", { name: "Editar", exact: true })
      .first()
      .waitFor({ timeout: 90000 });
    await semOverflow(pagina);
    assert.ok(await pagina.getByText("Embrater", { exact: true }).count());
    assert.equal(
      await pagina
        .getByRole("columnheader", { name: "Comissão", exact: true })
        .count(),
      1,
    );
    await pagina.screenshot({
      path: `${pasta}/lista-desktop.png`,
      fullPage: true,
    });
    await pagina
      .getByRole("button", { name: "Editar preço", exact: true })
      .click();
    await pagina
      .getByRole("textbox", { name: "Preço", exact: true })
      .fill("79,90");
    await pagina
      .getByRole("button", { name: "Salvar preço", exact: true })
      .click();
    await pagina
      .getByText("Produto atualizado.", { exact: true })
      .first()
      .waitFor();
    await pagina
      .getByRole("button", { name: "Editar preço", exact: true })
      .waitFor();
    await pagina.getByRole("link", { name: "Editar", exact: true }).click();
    await pagina.getByLabel("Código do fornecedor", { exact: true }).waitFor();
    await pagina
      .getByLabel("Código do fornecedor", { exact: true })
      .fill("EMB-E2E-EDITADO");
    await pagina
      .getByRole("button", { name: "Salvar alterações", exact: true })
      .click();
    await pagina
      .getByText("Produto atualizado.", { exact: true })
      .first()
      .waitFor();
    await pagina.getByRole("tab", { name: "Imagens", exact: true }).click();
    await pagina.getByLabel("Adicionar imagem", { exact: true }).waitFor();
    const png = await pagina.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 40;
      c.height = 40;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#164b7f";
      ctx.fillRect(0, 0, 40, 40);
      return c.toDataURL("image/png").split(",")[1];
    });
    await pagina.getByLabel("Adicionar imagem", { exact: true }).setInputFiles({
      name: "imagem-fixture.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
    await pagina
      .getByText("Imagem adicionada.", { exact: true })
      .first()
      .waitFor();
    await pagina
      .getByRole("button", { name: "Remover imagem", exact: true })
      .first()
      .waitFor();
    await semOverflow(pagina);
    await pagina.screenshot({
      path: `${pasta}/imagens-desktop.png`,
      fullPage: true,
    });
    // Exibição opcional não é um toggle do representante: decisão persistida pelo gestor.
    await pool.query(
      "UPDATE autorizacoes_produtos_representantes SET comissao_visivel=false WHERE representante_fornecedor_id=$1",
      [vinculoA],
    );
    await pagina.goto(`${origem}/admin/products`);
    await pagina.getByRole("link", { name: "Editar", exact: true }).waitFor();
    assert.equal(
      await pagina
        .getByRole("columnheader", { name: "Comissão", exact: true })
        .count(),
      0,
    );
    await pagina.screenshot({
      path: `${pasta}/comissao-oculta-desktop.png`,
      fullPage: true,
    });
    await pool.query(
      "UPDATE autorizacoes_produtos_representantes SET comissao_tipo='fixa',comissao_valor=1000,comissao_visivel=true WHERE representante_fornecedor_id=$1",
      [vinculoA],
    );
    const android = await navegador.newContext({
      ...devices["Pixel 7"],
      viewport: { width: 393, height: 851 },
      colorScheme: "light",
    });
    await login(android);
    const celular = await android.newPage();
    monitorar(celular);
    await celular.goto(`${origem}/admin/products`);
    await celular
      .getByRole("link", { name: "Editar", exact: true })
      .waitFor({ timeout: 90000 });
    await semOverflow(celular);
    assert.ok(await celular.getByText("R$ 10,00", { exact: true }).count());
    console.log("Desktop validado; iniciando edições por toque.");
    for (const [campo, valor] of [
      ["nome do produto", "Nome editado por toque"],
      ["preço", "89,90"],
      ["estoque", "82"],
    ]) {
      await celular
        .getByRole("button", { name: `Editar ${campo}`, exact: true })
        .tap();
      await celular
        .getByRole("textbox", {
          name:
            campo === "nome do produto"
              ? "Nome do produto"
              : campo === "preço"
                ? "Preço"
                : "Estoque",
          exact: true,
        })
        .fill(valor);
      await celular
        .getByRole("button", { name: `Salvar ${campo}`, exact: true })
        .tap();
      await celular
        .getByRole("button", { name: `Editar ${campo}`, exact: true })
        .waitFor();
      await semOverflow(celular);
    }
    assert.equal(
      (
        await celular
          .getByRole("button", { name: "Editar preço", exact: true })
          .innerText()
      )
        .replace(/\s+/g, " ")
        .trim(),
      "R$ 89,90",
    );
    await celular.screenshot({
      path: `${pasta}/lista-android.png`,
      fullPage: true,
    });
    await celular
      .getByRole("button", { name: "Abrir menu da minha conta", exact: true })
      .tap();
    assert.ok(
      await celular
        .getByRole("menuitem", { name: "Sair", exact: true })
        .isVisible(),
    );
    await celular.keyboard.press("Escape");
    await celular
      .getByRole("link", { name: "Novo produto", exact: true })
      .tap();
    await celular.getByLabel("Nome do produto *", { exact: true }).waitFor();
    assert.equal(
      await celular.getByText("Tipo de produto", { exact: true }).count(),
      0,
    );
    assert.equal(await celular.locator("#fornecedor-representado").count(), 0);
    await semOverflow(celular);
    await celular.screenshot({
      path: `${pasta}/cadastro-android.png`,
      fullPage: true,
    });
    await celular
      .getByLabel("Nome do produto *", { exact: true })
      .fill("Produto criado no Android");
    await celular.locator("#produto-categoriaId").selectOption({ index: 1 });
    await celular.locator("#produto-marcaId").selectOption({ index: 1 });
    await celular
      .getByLabel("Código do fornecedor", { exact: true })
      .fill("EMB-ANDROID-003");
    await celular.getByRole("tab", { name: "Preço", exact: true }).tap();
    await celular
      .getByRole("textbox", { name: "Preço", exact: true })
      .fill("19,90");
    await celular.getByLabel("Estoque", { exact: true }).fill("12");
    await celular
      .getByRole("button", { name: "Salvar rascunho", exact: true })
      .tap();
    await celular
      .getByRole("heading", { name: "Editar produto", exact: true })
      .waitFor({ timeout: 90000 });
    await celular.getByLabel("Código do fornecedor", { exact: true }).waitFor();
    assert.equal(
      await celular
        .getByLabel("Código do fornecedor", { exact: true })
        .inputValue(),
      "EMB-ANDROID-003",
    );
    for (const aba of [
      "Preço",
      "Imagens",
      "Peso e dimensões",
      "Garantia",
      "SEO",
      "Básico",
    ]) {
      await celular.getByRole("tab", { name: aba, exact: true }).tap();
      await semOverflow(celular);
    }
    await celular.screenshot({
      path: `${pasta}/edicao-android.png`,
      fullPage: true,
    });
    // A tela aberta não é uma autorização reutilizável.
    await pool.query(
      "UPDATE autorizacoes_produtos_representantes SET ativa=false WHERE produto_id=$1",
      [produtoA],
    );
    await pagina.goto(
      `${origem}/admin/products/${produtoA}/edit?fornecedor=${fornecedorA}`,
    );
    await pagina
      .getByRole("alert")
      .filter({ hasText: /Não foi possível editar|acesso/ })
      .first()
      .waitFor();
    assert.deepEqual(
      erros,
      [],
      "Não deve haver erros de execução no navegador",
    );
    const registros = (
      await pool.query(
        "SELECT p.sku,v.codigo_fornecedor,v.estoque_informado_fornecedor FROM product p JOIN fornecedor_produto_vinculos v ON v.produto_id=p.id WHERE p.name='Produto criado no Android'",
      )
    ).rows;
    assert.equal(registros.length, 1);
    assert.equal(registros[0].codigo_fornecedor, "EMB-ANDROID-003");
    assert.notEqual(registros[0].sku, registros[0].codigo_fornecedor);
    assert.equal(registros[0].estoque_informado_fornecedor, 12);
    console.log(
      "Interface real aprovada: desktop e Android Pixel 7, login de fixture, cards, inline por toque, criação, edição, imagens, comissão oculta e revogação.",
    );
  } catch (erro) {
    console.error("Falha original da interface:", erro);
    if (ultimaPagina) {
      await ultimaPagina
        .screenshot({
          path: `${pasta}/falha-local.png`,
          fullPage: true,
          timeout: 5000,
          animations: "disabled",
        })
        .catch(() => undefined);
      console.log(
        "Diagnóstico visual:",
        await ultimaPagina
          .locator("body")
          .innerText({ timeout: 5000 })
          .catch(() => "Página indisponível"),
      );
    }
    throw erro;
  } finally {
    await navegador.close();
    if (processo.pid)
      try {
        process.kill(-processo.pid, "SIGTERM");
      } catch {
        /* Processo já encerrado. */
      }
  }
}
