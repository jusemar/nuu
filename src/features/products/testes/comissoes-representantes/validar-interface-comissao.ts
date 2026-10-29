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
export async function validarInterfaceComissao({
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
  const senha = "fixture-somente-local-etapa5";
  const hash = await hashPassword(senha);
  await pool.query(
    "INSERT INTO account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES('fixture-etapa5-a','rep-a','credential','rep-a',$1,now(),now()),('fixture-etapa5-gestor','gestor','credential','gestor',$1,now(),now())",
    [hash],
  );
  await pool.query(
    "UPDATE representantes_fornecedores SET ativo=false WHERE usuario_id='rep-a' AND fornecedor_id<>$1",
    [fornecedorA],
  );
  const log = openSync("/tmp/nooo-etapa5-dev.log", "w");
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
        NOOO_NEXT_DIST_DIR: ".next/etapa5-dev",
        APP_ENVIRONMENT: "homologacao",
        BETTER_AUTH_URL: origem,
        NEXT_PUBLIC_APP_URL: origem,
        BETTER_AUTH_SECRET:
          "fixture-etapa5-interface-sem-segredos-reais-0123456789",
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
  const pasta = "docs/prototipos/representante-etapa-5";
  mkdirSync(pasta, { recursive: true });
  async function login(contexto: BrowserContext, email = "a@fixture.invalid") {
    const resposta = await contexto.request.post(
      `${origem}/api/auth/login/admin/identificador`,
      { headers: { Origin: origem }, data: { identificador: email, senha } },
    );
    assert.equal(resposta.status(), 200, "Login local de fixture");
  }

  const erros: string[] = [];
  const monitorar = (pagina: Page) =>
    pagina.on("pageerror", (e) => erros.push(e.message));
  try {
    let pronto = false;
    for (let i = 0; i < 180; i++) {
      try {
        if (
          (
            await fetch(`${origem}/api/auth/ok`, {
              signal: AbortSignal.timeout(3000),
            })
          ).ok
        ) {
          pronto = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    assert.ok(pronto);
    const gestor = await navegador.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await login(gestor, "gestor@fixture.invalid");
    const pagina = await gestor.newPage();
    monitorar(pagina);
    await pagina.goto(`${origem}/admin/products`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    const linha = pagina.getByRole("row").filter({ hasText: "NOOO-001" });
    await linha
      .getByRole("button", { name: "Comissão", exact: true })
      .waitFor({ timeout: 90000 });
    await linha.getByRole("button", { name: "Comissão", exact: true }).click();
    await pagina.getByLabel("Formato", { exact: true }).waitFor();
    await pagina.getByLabel("Formato", { exact: true }).selectOption("fixa");
    await pagina.getByLabel("Valor (R$)", { exact: true }).fill("10,00");
    const ativa = pagina.getByRole("switch", {
      name: "Comissão ativa",
      exact: true,
    });
    if ((await ativa.getAttribute("aria-checked")) === "false")
      await ativa.click();
    const visivel = pagina.getByRole("switch", {
      name: "Exibir ao representante",
      exact: true,
    });
    if ((await visivel.getAttribute("aria-checked")) === "true")
      await visivel.click();
    await pagina
      .getByRole("button", { name: "Salvar configuração", exact: true })
      .click();
    await pagina
      .getByText("Configuração de comissão atualizada.", { exact: true })
      .first()
      .waitFor();
    const consulta = async () =>
      (
        await pool.query(
          "SELECT comissao_ativa,comissao_visivel,comissao_valor FROM autorizacoes_produtos_representantes WHERE representante_fornecedor_id=$1 AND produto_id=$2",
          [vinculoA, produtoA],
        )
      ).rows[0];
    assert.deepEqual(await consulta(), {
      comissao_ativa: true,
      comissao_visivel: false,
      comissao_valor: 1000,
    });
    // A revalidação da listagem fecha o modal existente; reabre para conferir persistência.
    if (!(await pagina.getByRole("dialog").isVisible()))
      await linha
        .getByRole("button", { name: "Comissão", exact: true })
        .click();
    await ativa.waitFor();
    assert.equal(await ativa.getAttribute("aria-checked"), "true");
    await pagina.screenshot({
      path: `${pasta}/configuracao-gestor-desktop.png`,
      fullPage: true,
    });
    await pagina.keyboard.press("Escape");
    const rep = await navegador.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await login(rep);
    const lista = await rep.newPage();
    monitorar(lista);
    await lista.goto(`${origem}/admin/products`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await lista
      .getByRole("link", { name: "Editar", exact: true })
      .waitFor({ timeout: 90000 });
    assert.equal(
      await lista
        .getByRole("columnheader", { name: "Comissão", exact: true })
        .count(),
      0,
    );
    // O gestor muda só a visibilidade; a ativação permanece independente.
    if (!(await pagina.getByRole("dialog").isVisible()))
      await linha
        .getByRole("button", { name: "Comissão", exact: true })
        .click();
    await visivel.waitFor();
    await visivel.click();
    await pagina
      .getByRole("button", { name: "Salvar configuração", exact: true })
      .click();
    for (let i = 0; i < 100 && !(await consulta()).comissao_visivel; i++)
      await new Promise((r) => setTimeout(r, 50));
    assert.equal((await consulta()).comissao_visivel, true);
    await lista.reload();
    await lista
      .getByRole("columnheader", { name: "Comissão", exact: true })
      .waitFor();
    assert.deepEqual(await lista.getByRole("columnheader").allTextContents(), [
      "Produto",
      "Preço",
      "Comissão",
      "Estoque",
      "Situação",
      "Ação",
    ]);
    const contexto = await navegador.newContext({
      ...devices["Pixel 7"],
      viewport: { width: 393, height: 851 },
    });
    await login(contexto);
    const celular = await contexto.newPage();
    monitorar(celular);
    await celular.goto(`${origem}/admin/products`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await celular
      .getByRole("link", { name: "Editar", exact: true })
      .waitFor({ timeout: 90000 });
    assert.equal(
      await celular.getByText("R$ 10,00", { exact: true }).isVisible(),
      true,
    );
    assert.equal(
      await celular
        .getByRole("button", { name: "Comissão", exact: true })
        .count(),
      0,
    );
    assert.equal(await celular.getByRole("switch").count(), 0);
    assert.equal(
      await celular.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await celular.screenshot({
      path: `${pasta}/comissao-representante-android.png`,
      fullPage: true,
    });
    assert.deepEqual(erros, []);
    console.log(
      "Etapa 5: ativação e ocultação salvas pelo gestor; comissão somente leitura e ordem de colunas confirmadas em desktop/Android.",
    );
  } finally {
    await navegador.close();
    if (processo.pid)
      try {
        process.kill(-processo.pid, "SIGTERM");
      } catch {}
  }
}
