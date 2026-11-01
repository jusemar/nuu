import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { createServer } from "node:net";

import {
  type BrowserContext,
  chromium,
  devices,
  expect,
} from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import type { Pool } from "pg";

/** Navegador → Server Actions → PostgreSQL real, somente fixtures descartáveis. */
export async function validarInterfaceRealJaaa({
  pool,
  url,
  produtoId,
  autorizacaoA,
  autorizacaoB,
}: {
  pool: Pool;
  url: string;
  produtoId: string;
  autorizacaoA: string;
  autorizacaoB: string;
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
  const senha = "fixture-somente-local-etapa8-real";
  const hash = await hashPassword(senha);
  await pool.query(
    "INSERT INTO account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES('fixture-etapa8-real-a','rep-a','credential','rep-a',$1,now(),now()),('fixture-etapa8-real-gestor','gestor','credential','gestor',$1,now(),now())",
    [hash],
  );
  const log = openSync("/tmp/nooo-etapa8-real-dev.log", "w");
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
        NOOO_NEXT_DIST_DIR: ".next/etapa8-real-dev",
        APP_ENVIRONMENT: "homologacao",
        BETTER_AUTH_URL: origem,
        NEXT_PUBLIC_APP_URL: origem,
        BETTER_AUTH_SECRET:
          "fixture-etapa8-real-interface-sem-segredos-reais-0123456789",
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
  const pasta = "docs/prototipos/representante-etapa-8-real";
  mkdirSync(pasta, { recursive: true });
  async function login(contexto: BrowserContext, email = "a@fixture.invalid") {
    const resposta = await contexto.request.post(
      `${origem}/api/auth/login/admin/identificador`,
      { headers: { Origin: origem }, data: { identificador: email, senha } },
    );
    assert.equal(resposta.status(), 200, "Login local de fixture");
  }

  const erros: string[] = [];
  const paginas: import("@playwright/test").Page[] = [];
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
    const semOverflow = async (p: import("@playwright/test").Page) =>
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        "Sem overflow horizontal",
      );
    async function prepararContexto(mobile = false, administrador = false) {
      const c = await navegador.newContext(
        mobile
          ? { ...devices["Pixel 7"] }
          : { viewport: { width: 1440, height: 1000 } },
      );
      await c.route("**/*", (r) => {
        const url = new URL(r.request().url());
        if (url.origin === origem) return r.continue();
        if (url.origin === "https://jaaa.com.br")
          return r.fulfill({
            status: 200,
            contentType: "text/html",
            body: "<p>Jaaa interceptado no teste local.</p>",
          });
        return r.abort();
      });
      if (administrador) await login(c, "gestor@fixture.invalid");
      const p = await c.newPage();
      paginas.push(p);
      p.on("pageerror", (e) => erros.push(e.message));
      return { c, p };
    }
    const gestor = await prepararContexto(false, true);
    await gestor.p.goto(`${origem}/admin/atendimento-jaaa`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await gestor.p
      .getByLabel("Usuário no Jaaa de Fernando", { exact: true })
      .waitFor({ timeout: 90000 });
    for (const [nome, usuarioId, identidade] of [
      ["Fernando", "rep-a", "fernando_embrater"],
      ["Beatriz", "rep-b", "beatriz_atendimento"],
    ]) {
      const form = gestor.p.locator("form").filter({
        has: gestor.p.getByRole("heading", { name: nome, exact: true }),
      });
      await form.getByRole("textbox").fill(identidade);
      await form
        .getByRole("checkbox", {
          name: "Permitir atendimento pelo Jaaa",
          exact: true,
        })
        .check();
      await form
        .getByRole("button", { name: `Salvar Jaaa de ${nome}`, exact: true })
        .click();
      await expect
        .poll(
          async () =>
            (
              await pool.query(
                "select identidade from identidades_jaaa_representantes where usuario_id=$1 and ativa",
                [usuarioId],
              )
            ).rows[0]?.identidade,
        )
        .toBe(identidade);
      await expect(
        gestor.p.getByRole("button", {
          name: `Salvar Jaaa de ${nome}`,
          exact: true,
        }),
      ).toBeEnabled();
    }
    await semOverflow(gestor.p);
    await gestor.p.screenshot({
      path: `${pasta}/gestor-desktop-identidades.png`,
      fullPage: true,
    });
    await gestor.p.getByRole("tab", { name: "Produtos", exact: true }).click();
    await gestor.p
      .getByRole("button", { name: "Configurar atendimento", exact: true })
      .click();
    await gestor.p
      .getByLabel("Representante para atendimento", { exact: true })
      .selectOption(autorizacaoB);
    await gestor.p
      .getByRole("button", {
        name: "Salvar atendimento do produto",
        exact: true,
      })
      .click();
    await expect
      .poll(
        async () =>
          (
            await pool.query(
              "select autorizacao_id from atendimentos_jaaa_produtos where produto_id=$1",
              [produtoId],
            )
          ).rows[0]?.autorizacao_id,
      )
      .toBe(autorizacaoB);
    await gestor.c.close();
    for (const mobile of [false, true]) {
      const rep = await prepararContexto(mobile);
      await login(rep.c);
      await rep.p.goto(`${origem}/admin/atendimento-jaaa`, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      const abrir = rep.p.getByRole("link", {
        name: "Abrir Jaaa",
        exact: true,
      });
      await abrir.waitFor({ timeout: 90000 });
      assert.equal(await abrir.getAttribute("href"), "/api/jaaa/representante");
      assert.ok((await abrir.boundingBox())!.height >= 44);
      assert.equal(
        await rep.p
          .getByRole("textbox", {
            name: "Usuário no Jaaa de Fernando",
            exact: true,
          })
          .count(),
        0,
      );
      await semOverflow(rep.p);
      const destino = await rep.c.request.get(
        `${origem}/api/jaaa/representante`,
        { maxRedirects: 0 },
      );
      assert.equal(destino.status(), 303);
      assert.equal(
        destino.headers().location,
        "https://jaaa.com.br/@fernando_embrater",
      );
      await rep.p.screenshot({
        path: `${pasta}/representante-${mobile ? "android" : "desktop"}.png`,
        fullPage: true,
      });
      if (mobile) {
        await rep.p.goto(`${origem}/admin/products`, {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        });
        await rep.p
          .getByRole("link", { name: "Abrir Jaaa", exact: true })
          .waitFor();
        await semOverflow(rep.p);
      }
      await rep.c.close();
      const cliente = await prepararContexto(mobile);
      await cliente.p.goto(`${origem}/product/produto-fixture`, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      const conversar = cliente.p.getByRole("link", {
        name: "Falar pelo Jaaa",
        exact: true,
      });
      await conversar.waitFor({ timeout: 90000 });
      assert.equal(
        await conversar.getAttribute("href"),
        `/api/jaaa/produto/${produtoId}`,
      );
      assert.equal(
        await conversar.getAttribute("referrerpolicy"),
        "no-referrer",
      );
      assert.ok((await conversar.boundingBox())!.height >= 44);
      await semOverflow(cliente.p);
      const popup = cliente.c.waitForEvent("page");
      await conversar.click();
      const conversa = await popup;
      await conversa.waitForURL("https://jaaa.com.br/@beatriz_atendimento");
      assert.equal(new URL(conversa.url()).search, "");
      await conversa.close();
      await cliente.p.screenshot({
        path: `${pasta}/cliente-${mobile ? "android" : "desktop"}.png`,
        fullPage: false,
      });
      if (mobile) {
        const gm = await prepararContexto(true, true);
        await gm.p.goto(`${origem}/admin/atendimento-jaaa`, {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        });
        await expect(
          gm.p.getByLabel("Usuário no Jaaa de Fernando", { exact: true }),
        ).toHaveValue("fernando_embrater");
        await gm.p.getByRole("tab", { name: "Produtos", exact: true }).click();
        await gm.p
          .getByRole("button", { name: "Configurar atendimento", exact: true })
          .click();
        const seletor = gm.p.getByLabel("Representante para atendimento", {
          exact: true,
        });
        await seletor.selectOption(autorizacaoA);
        await gm.p
          .getByRole("button", {
            name: "Salvar atendimento do produto",
            exact: true,
          })
          .click();
        await expect
          .poll(
            async () =>
              (
                await pool.query(
                  "select autorizacao_id from atendimentos_jaaa_produtos where produto_id=$1",
                  [produtoId],
                )
              ).rows[0]?.autorizacao_id,
          )
          .toBe(autorizacaoA);
        await semOverflow(gm.p);
        await gm.p.screenshot({
          path: `${pasta}/gestor-android-produto.png`,
          fullPage: true,
        });
        await gm.c.close();
        // O link já renderizado na página do cliente é revalidado no clique, após revogar o vínculo.
        await pool.query(
          "UPDATE representantes_fornecedores SET ativo=false WHERE usuario_id='rep-a'",
        );
        const r = await cliente.c.request.get(
          `${origem}/api/jaaa/produto/${produtoId}`,
          { maxRedirects: 0 },
        );
        assert.equal(r.status(), 303);
        assert.equal(r.headers().location, "/contato");
        await cliente.p.reload();
        await expect(
          cliente.p.getByRole("link", {
            name: "Atendimento Nooo",
            exact: true,
          }),
        ).toBeVisible();
        assert.equal(
          await cliente.p
            .getByRole("link", { name: "Falar pelo Jaaa", exact: true })
            .count(),
          0,
        );
      }
      await cliente.c.close();
    }
    assert.deepEqual(erros, []);
    console.log(
      "Etapa 8 real: desktop/Android aprovados para gestor, representante e cliente; formulários persistidos, identidade isolada, PDP, link interceptado e revogação no clique.",
    );
  } catch (erro) {
    console.error("Erros de página:", erros);
    for (const [i, p] of paginas.entries()) {
      if (!p.isClosed()) {
        await p
          .screenshot({
            path: `/tmp/nooo-etapa8-falha-${i}.png`,
            fullPage: false,
          })
          .catch(() => {});
        console.error(
          "Página da falha:",
          p.url(),
          (
            await p
              .locator("body")
              .innerText()
              .catch(() => "")
          ).slice(0, 1200),
        );
      }
    }
    throw erro;
  } finally {
    await navegador.close();
    if (processo.pid) process.kill(-processo.pid, "SIGTERM");
  }
}
