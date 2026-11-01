import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { createServer } from "node:net";

import { type BrowserContext, chromium, devices } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import type { Pool } from "pg";

/** Navegador → Server Actions → PostgreSQL real, somente fixtures descartáveis. */
export async function validarInterfaceAtribuicao({
  pool,
  pedidoId,
  url,
  produtoA,
  fornecedorA,
  vinculoA,
}: {
  pool: Pool;
  pedidoId: string;
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
  const senha = "fixture-somente-local-etapa6";
  const hash = await hashPassword(senha);
  await pool.query(
    "INSERT INTO account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES('fixture-etapa6-a','rep-a','credential','rep-a',$1,now(),now()),('fixture-etapa6-gestor','gestor','credential','gestor',$1,now(),now())",
    [hash],
  );
  await pool.query(
    "UPDATE representantes_fornecedores SET ativo=false WHERE usuario_id='rep-a' AND fornecedor_id<>$1",
    [fornecedorA],
  );
  const log = openSync("/tmp/nooo-correcao6-dev.log", "w");
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
        NOOO_NEXT_DIST_DIR: ".next/correcao6-dev",
        APP_ENVIRONMENT: "homologacao",
        BETTER_AUTH_URL: origem,
        NEXT_PUBLIC_APP_URL: origem,
        BETTER_AUTH_SECRET:
          "fixture-etapa6-interface-sem-segredos-reais-0123456789",
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
  const pasta = "docs/prototipos/representante-etapa-6";
  mkdirSync(pasta, { recursive: true });
  async function login(contexto: BrowserContext, email = "a@fixture.invalid") {
    const resposta = await contexto.request.post(
      `${origem}/api/auth/login/admin/identificador`,
      { headers: { Origin: origem }, data: { identificador: email, senha } },
    );
    assert.equal(resposta.status(), 200, "Login local de fixture");
  }

  const erros: string[] = [];
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
    const desktop = await navegador.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await login(desktop, "gestor@fixture.invalid");
    const pagina = await desktop.newPage();
    pagina.on("pageerror", (e) => erros.push(e.message));
    await pagina.goto(`${origem}/admin/products`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await pagina
      .getByRole("row")
      .filter({ hasText: "NOOO-001" })
      .getByRole("button", { name: "Comissão", exact: true })
      .waitFor({ timeout: 90000 });
    await pagina
      .getByRole("row")
      .filter({ hasText: "NOOO-001" })
      .getByRole("button", { name: "Comissão", exact: true })
      .click();
    const seletor = pagina.getByLabel(
      "Representante comissionado nas próximas vendas",
      { exact: true },
    );
    await seletor.waitFor();
    assert.equal(await seletor.inputValue(), "");
    const autorizacao = (
      await pool.query(
        "SELECT id FROM autorizacoes_produtos_representantes WHERE produto_id=$1 AND representante_fornecedor_id=$2",
        [produtoA, vinculoA],
      )
    ).rows[0].id;
    await seletor.selectOption(autorizacao);
    await pagina.screenshot({
      path: `${pasta}/produto-comissionado-desktop.png`,
      fullPage: true,
      animations: "disabled",
    });
    await pagina
      .getByRole("button", {
        name: "Salvar representante das próximas vendas",
        exact: true,
      })
      .click();
    await pagina
      .getByText("Representante das próximas vendas atualizado.", {
        exact: true,
      })
      .first()
      .waitFor();
    assert.equal(
      (
        await pool.query(
          "SELECT autorizacao_id FROM representantes_comissionados_produtos WHERE produto_id=$1",
          [produtoA],
        )
      ).rows[0].autorizacao_id,
      autorizacao,
    );
    await pagina.goto(`${origem}/admin/orders/${pedidoId}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await pagina.getByText("Pedido ETAPA6", { exact: true }).waitFor();
    assert.equal(
      await pagina
        .getByRole("button", { name: "Atribuir representante", exact: true })
        .count(),
      0,
    );
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int AS n FROM checkout_item_comissoes WHERE pedido_id=$1",
          [pedidoId],
        )
      ).rows[0].n,
      0,
    );
    const android = await navegador.newContext({
      ...devices["Pixel 7"],
      viewport: { width: 393, height: 851 },
    });
    await login(android, "gestor@fixture.invalid");
    const celular = await android.newPage();
    celular.on("pageerror", (e) => erros.push(e.message));
    await celular.goto(`${origem}/admin/products`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await celular
      .getByRole("button", { name: "Comissão", exact: true })
      .waitFor({ timeout: 90000 });
    await celular.getByRole("button", { name: "Comissão", exact: true }).tap();
    const mobile = celular.getByLabel(
      "Representante comissionado nas próximas vendas",
      { exact: true },
    );
    await mobile.waitFor();
    assert.equal(await mobile.inputValue(), autorizacao);
    await mobile.selectOption("");
    const caixa = await celular.getByRole("dialog").boundingBox();
    assert.ok(caixa && caixa.width <= 393);
    await celular.screenshot({
      path: `${pasta}/produto-comissionado-android.png`,
      fullPage: true,
      animations: "disabled",
    });
    await celular
      .getByRole("button", {
        name: "Salvar representante das próximas vendas",
        exact: true,
      })
      .tap();
    await celular
      .getByText("Representante das próximas vendas atualizado.", {
        exact: true,
      })
      .first()
      .waitFor();
    assert.equal(
      (
        await pool.query(
          "SELECT autorizacao_id FROM representantes_comissionados_produtos WHERE produto_id=$1",
          [produtoA],
        )
      ).rows[0].autorizacao_id,
      null,
    );
    assert.deepEqual(erros, []);
    console.log(
      "Escolha única no produto validada em desktop/Android; pedidos antigos não recebem atribuição retroativa nem exibem seletor manual.",
    );
  } finally {
    await navegador.close();
    if (processo.pid)
      try {
        process.kill(-processo.pid, "SIGTERM");
      } catch {}
  }
}
