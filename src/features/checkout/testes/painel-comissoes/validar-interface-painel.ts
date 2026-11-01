import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { createServer } from "node:net";

import { type BrowserContext, chromium, devices } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import type { Pool } from "pg";

/** Navegador → Server Actions → PostgreSQL real, somente fixtures descartáveis. */
export async function validarInterfacePainel({
  pool,
  url,
}: {
  pool: Pool;
  url: string;
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
  const senha = "fixture-somente-local-etapa7";
  const hash = await hashPassword(senha);
  await pool.query(
    "INSERT INTO account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES('fixture-etapa7-a','rep-a','credential','rep-a',$1,now(),now()),('fixture-etapa7-gestor','gestor','credential','gestor',$1,now(),now())",
    [hash],
  );
  const log = openSync("/tmp/nooo-etapa7-dev.log", "w");
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
        NOOO_NEXT_DIST_DIR: ".next/etapa7-dev",
        APP_ENVIRONMENT: "homologacao",
        BETTER_AUTH_URL: origem,
        NEXT_PUBLIC_APP_URL: origem,
        BETTER_AUTH_SECRET:
          "fixture-etapa7-interface-sem-segredos-reais-0123456789",
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
  const pasta = "docs/prototipos/representante-etapa-7";
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
    assert.ok(pronto, "Servidor local iniciou");
    const desktop = await navegador.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await login(desktop);
    const pagina = await desktop.newPage();
    pagina.on("pageerror", (e) => erros.push(e.message));
    const abrir = async (p: typeof pagina, gestor = false) => {
      await p.goto(`${origem}/admin/comissoes-representantes`, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      await p
        .getByRole("heading", {
          name: gestor ? "Comissões de representantes" : "Vendas e comissões",
          exact: true,
        })
        .waitFor({ timeout: 90000 });
      await p
        .getByRole("button", { name: "Próxima", exact: true })
        .waitFor({ timeout: 90000 });
    };
    const semOverflow = async (p: typeof pagina) =>
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        "Sem overflow horizontal",
      );
    const filtrarFixa = async (p: typeof pagina) => {
      await p
        .getByLabel("Pedido, produto ou SKU", { exact: true })
        .fill("Produto fixo histórico");
      await p
        .getByRole("button", { name: "Aplicar filtros", exact: true })
        .click();
      await p.getByText("1 registro(s) · Página 1", { exact: true }).waitFor();
    };
    const detalhesFixa = async (p: typeof pagina) => {
      await p
        .getByRole("button", {
          name: "Detalhes da comissão de Produto fixo histórico",
          exact: true,
        })
        .click();
      await p
        .getByRole("heading", { name: "Histórico", exact: true })
        .waitFor();
    };
    await abrir(pagina);
    await pagina.getByRole("button", { name: "Próxima", exact: true }).click();
    await pagina
      .getByText("25 registro(s) · Página 2", { exact: true })
      .waitFor();
    await filtrarFixa(pagina);
    await semOverflow(pagina);
    await pagina.screenshot({
      path: `${pasta}/representante-desktop.png`,
      fullPage: true,
    });
    await detalhesFixa(pagina);
    assert.equal(
      await pagina
        .getByRole("heading", {
          name: "Registrar quitação externa",
          exact: true,
        })
        .count(),
      0,
    );
    assert.equal(
      (await pagina.getByRole("dialog").innerText()).includes("R$ 10,00"),
      true,
    );
    assert.equal((await pagina.content()).includes("CLIENTE_SECRETO"), false);
    await desktop.close();
    const gestor = await navegador.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await login(gestor, "gestor@fixture.invalid");
    const gestao = await gestor.newPage();
    gestao.on("pageerror", (e) => erros.push(e.message));
    await abrir(gestao, true);
    await gestao
      .getByLabel("Representante", { exact: true })
      .selectOption("rep-a");
    await gestao
      .getByLabel("Situação", { exact: true })
      .selectOption("cancelada");
    await gestao
      .getByRole("button", { name: "Aplicar filtros", exact: true })
      .click();
    await gestao
      .getByText("1 registro(s) · Página 1", { exact: true })
      .waitFor();
    await gestao
      .getByRole("button", { name: "Limpar filtros", exact: true })
      .click();
    await filtrarFixa(gestao);
    await detalhesFixa(gestao);
    await gestao
      .getByLabel("Referência (opcional)", { exact: true })
      .fill("REF_UI_INTERNA");
    await gestao
      .getByLabel("Observação interna (opcional)", { exact: true })
      .fill("OBS_UI_INTERNA");
    await gestao
      .getByRole("button", {
        name: "Confirmar registro de quitação externa",
        exact: true,
      })
      .click();
    await gestao
      .getByRole("heading", {
        name: "Quitação externa registrada",
        exact: true,
      })
      .waitFor();
    assert.equal(
      (
        await pool.query(
          "select count(*)::int n from checkout_item_comissao_quitacoes where referencia='REF_UI_INTERNA'",
        )
      ).rows[0].n,
      1,
    );
    const dataPersistida = (
      await pool.query(
        "select to_char(data_quitacao at time zone 'America/Sao_Paulo','YYYY-MM-DD') data from checkout_item_comissao_quitacoes where referencia='REF_UI_INTERNA'",
      )
    ).rows[0].data;
    assert.equal(
      dataPersistida,
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
      }).format(new Date()),
    );
    await semOverflow(gestao);
    await gestao.screenshot({
      path: `${pasta}/gestor-desktop-quitacao.png`,
      fullPage: true,
    });
    await gestor.close();
    const android = await navegador.newContext({ ...devices["Pixel 7"] });
    await login(android);
    const celular = await android.newPage();
    celular.on("pageerror", (e) => erros.push(e.message));
    await abrir(celular);
    await celular
      .getByRole("navigation", { name: "Navegação rápida" })
      .getByRole("link", { name: "Vendas / Comissões", exact: true })
      .waitFor();
    await filtrarFixa(celular);
    await semOverflow(celular);
    const acao = celular.getByRole("button", {
      name: "Detalhes da comissão de Produto fixo histórico",
      exact: true,
    });
    assert.ok((await acao.boundingBox())!.height >= 44);
    await celular.screenshot({
      path: `${pasta}/representante-android.png`,
      fullPage: true,
    });
    await detalhesFixa(celular);
    await celular
      .getByRole("heading", {
        name: "Quitação externa registrada",
        exact: true,
      })
      .waitFor();
    const conteudo = await celular.getByRole("dialog").innerText();
    assert.equal(conteudo.includes("REF_UI_INTERNA"), false);
    assert.equal(conteudo.includes("OBS_UI_INTERNA"), false);
    await semOverflow(celular);
    await celular.screenshot({
      path: `${pasta}/representante-android-detalhes.png`,
      fullPage: true,
    });
    await android.close();
    const gestorMobile = await navegador.newContext({ ...devices["Pixel 7"] });
    await login(gestorMobile, "gestor@fixture.invalid");
    const gm = await gestorMobile.newPage();
    gm.on("pageerror", (e) => erros.push(e.message));
    await abrir(gm, true);
    await gm
      .getByRole("button", {
        name: "Detalhes da comissão de Produto percentual histórico",
        exact: true,
      })
      .first()
      .click();
    await gm
      .getByRole("heading", { name: "Registrar quitação externa", exact: true })
      .waitFor();
    const fecharModal = gm
      .getByRole("dialog")
      .getByRole("button", { name: "Close", exact: true });
    assert.ok(
      (await fecharModal.boundingBox())!.height >= 44,
      "Fechar modal tem área de toque de 44px",
    );
    const confirmarMobile = gm.getByRole("button", {
      name: "Confirmar registro de quitação externa",
      exact: true,
    });
    await confirmarMobile.scrollIntoViewIfNeeded();
    assert.ok((await confirmarMobile.boundingBox())!.height >= 44);
    await semOverflow(gm);
    await gm.screenshot({
      path: `${pasta}/gestor-android-formulario.png`,
      fullPage: true,
    });
    await fecharModal.click();

    await filtrarFixa(gm);
    await semOverflow(gm);
    await detalhesFixa(gm);
    await gm
      .getByRole("heading", {
        name: "Quitação externa registrada",
        exact: true,
      })
      .waitFor();
    await semOverflow(gm);
    await gm.screenshot({
      path: `${pasta}/gestor-android-detalhes.png`,
      fullPage: true,
    });
    await gestorMobile.close();
    assert.deepEqual(erros, []);
    console.log(
      "Etapa 7: desktop e Android aprovados para representante e gestor; paginação, filtros, detalhes, quitação real de fixture, privacidade e overflow verificados.",
    );
  } finally {
    await navegador.close();
    if (processo.pid) process.kill(-processo.pid, "SIGTERM");
  }
}
