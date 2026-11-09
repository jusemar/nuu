import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  type BrowserContext,
  chromium,
  devices,
  expect,
  type Page,
} from "@playwright/test";
type Opcoes = {
  origem: string;
  gestor: string;
  representante: string;
  senha: string;
  skusAutorizados: string[];
  skuProibido: string;
  relatorio: string;
  capturas?: string;
};
/** Chrome normal persistente + contexto privado, sem HAR, cookies ou payloads no relatório. */
export async function validarFluxoBrowser(o: Opcoes) {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(o.origem).hostname));
  const browser = await chromium.launch({ headless: true });
  const resultados = [];
  try {
    for (const mobile of [false, true]) {
      const perfil = mkdtempSync(join(tmpdir(), "nooo-login-normal-"));
      const normal = await chromium.launchPersistentContext(perfil, {
        headless: true,
        ...(mobile
          ? devices["Pixel 7"]
          : { viewport: { width: 1440, height: 1000 } }),
      });
      const privado = await browser.newContext(
        mobile
          ? devices["Pixel 7"]
          : { viewport: { width: 1440, height: 1000 } },
      );
      const paginas: {
        p: Page;
        c: BrowserContext;
        email: string;
        contagem: Map<string, number>;
        erros: string[];
      }[] = [];
      try {
        for (const [c, email] of [
          [normal, o.representante],
          [privado, o.gestor],
        ] as [BrowserContext, string][]) {
          const p = await c.newPage();
          const contagem = new Map<string, number>();
          const erros: string[] = [];
          p.on("pageerror", (e) => erros.push(e.message));
          p.on("response", (r) => {
            if (
              r.status() >= 500 &&
              new URL(r.url()).pathname.startsWith("/admin")
            )
              erros.push(new URL(r.url()).pathname + ":" + r.status());
          });
          await c.route("**/*", (r) => {
            const u = new URL(r.request().url());
            if (
              u.origin !== o.origem ||
              u.searchParams.has("senha") ||
              (u.pathname === "/_next/image" &&
                /^https?:/.test(u.searchParams.get("url") ?? ""))
            )
              return r.abort();
            if ((contagem.get("GET /admin/products") ?? 0) > 30)
              return r.abort();
            return r.continue();
          });
          p.on("request", (r) => {
            const u = new URL(r.url());
            if (
              u.pathname.startsWith("/admin") ||
              u.pathname.startsWith("/api/auth")
            ) {
              const chave = r.method() + " " + u.pathname;
              contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
            }
          });
          paginas.push({ p, c, email, contagem, erros });
          await p.goto(o.origem + "/admin/login", {
            waitUntil: "domcontentloaded",
            timeout: 90000,
          });
          const entrar = p.getByRole("button", {
            name: "Entrar no admin",
            exact: true,
          });
          await expect(entrar).toBeEnabled({ timeout: 30000 });
          await p.getByLabel("E-mail ou WhatsApp", { exact: true }).fill(email);
          await p.locator("input[name=senha]").fill(o.senha);
          await entrar.click();
          await p.waitForURL(
            email === o.gestor
              ? o.origem + "/admin"
              : o.origem + "/admin/products",
            { timeout: 60000 },
          );
          await expect(
            p
              .locator("main")
              .last()
              .getByRole("heading", {
                name: email === o.gestor ? "Visão geral" : "Produtos",
                exact: true,
              }),
          ).toBeVisible({ timeout: 60000 });
          if (email !== o.gestor) {
            const lista = p.getByRole("table", {
              name: "Produtos autorizados",
            });
            await expect(lista).toBeVisible();
            await expect
              .poll(async () => {
                const texto = await lista.innerText();
                return o.skusAutorizados.some((s) => texto.includes(s));
              })
              .toBe(true);
            assert.equal(
              (await lista.innerText()).includes(o.skuProibido),
              false,
            );
            assert.equal(
              await p.locator('a[href="/admin"]:visible').count(),
              0,
            );
          }
          const sessao = await c.request.get(
            o.origem + "/api/auth/get-session",
          );
          assert.equal((await sessao.json()).user.email, email);
        }
        const rep = paginas[0],
          gestor = paginas[1];
        // Navegação por links Next, sem recarregar o documento, exercita o layout compartilhado.
        for (const caminho of [
          "/admin/products",
          "/admin/fornecedores",
          "/admin",
        ]) {
          let link = gestor.p.locator(`a[href="${caminho}"]:visible`).first();
          if (!(await link.count())) {
            if (mobile)
              await gestor.p
                .getByRole("button", { name: "Mais", exact: true })
                .click();
            else if (caminho === "/admin/products")
              await gestor.p
                .getByRole("button", { name: "Catálogo", exact: true })
                .click();
            if (
              caminho === "/admin/fornecedores" &&
              !(await gestor.p.locator(`a[href="${caminho}"]:visible`).count())
            )
              await gestor.p
                .getByRole("button", { name: "Fornecedores", exact: true })
                .click();
            link = gestor.p.locator(`a[href="${caminho}"]:visible`).first();
          }
          if (mobile) {
            // O badge de desenvolvimento do Next cobre o primeiro item da barra mobile.
            // Remove só esse badge no ensaio; overlays de erro e a captura de erros permanecem ativos.
            await gestor.p.locator("nextjs-portal").evaluateAll((portais) => {
              for (const portal of portais) {
                const raiz = portal.shadowRoot;
                if (
                  raiz &&
                  !raiz.querySelector("style[data-nooo-teste-badge]")
                ) {
                  const estilo = document.createElement("style");
                  estilo.dataset.noooTesteBadge = "true";
                  estilo.textContent =
                    "[data-next-badge-root]{display:none!important}";
                  raiz.appendChild(estilo);
                }
              }
            });
            const caixa = await link.boundingBox();
            assert.ok(caixa);
            await link.tap({ position: { x: caixa.width / 2, y: 8 } });
          } else await link.click();
          await gestor.p.waitForURL(o.origem + caminho, { timeout: 60000 });
          if (caminho === "/admin")
            await expect(
              gestor.p.locator("main").last().getByRole("heading", {
                name: "Visão geral",
                exact: true,
              }),
            ).toBeVisible();
          else if (caminho === "/admin/products")
            await expect(
              gestor.p
                .locator("main")
                .last()
                .getByRole("heading", { name: "Produtos", exact: true }),
            ).toBeVisible();
          else
            await expect(
              gestor.p
                .locator("main")
                .last()
                .getByRole("heading", { name: /Fornecedores/i })
                .first(),
            ).toBeVisible();
          await rep.p.bringToFront();
          assert.equal(
            (
              await (
                await rep.c.request.get(o.origem + "/api/auth/get-session")
              ).json()
            ).user.email,
            o.representante,
          );
          await gestor.p.bringToFront();
        }
        // Voltar a /admin não dá acesso ao dashboard ao representante, nem deixa redirect em loop.
        await rep.p.goto(o.origem + "/admin", {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        await rep.p.waitForURL(o.origem + "/admin/products");
        await expect(
          rep.p
            .locator("main")
            .last()
            .getByRole("heading", { name: "Produtos", exact: true }),
        ).toBeVisible();
        for (const item of paginas) {
          await item.p.reload({
            waitUntil: "domcontentloaded",
            timeout: 60000,
          });
          await expect(
            item.p
              .locator("main")
              .last()
              .getByRole("heading", {
                name: item.email === o.gestor ? "Visão geral" : "Produtos",
                exact: true,
              }),
          ).toBeVisible();
          assert.equal(
            (
              await (
                await item.c.request.get(o.origem + "/api/auth/get-session")
              ).json()
            ).user.email,
            item.email,
          );
          await expect(item.p.locator("main").last()).not.toHaveText("");
        }
        // Foco pode produzir UMA revalidação legítima; aguarde-a antes de medir o repouso.
        await rep.p.bringToFront();
        await gestor.p.bringToFront();
        await new Promise((r) => setTimeout(r, 2000));
        const redeAntes = paginas.map((v) => Object.fromEntries(v.contagem));
        const antes = paginas.map(
          (v) => v.contagem.get("GET /admin/products") ?? 0,
        );
        await new Promise((r) => setTimeout(r, 6000));
        const depois = paginas.map(
          (v) => v.contagem.get("GET /admin/products") ?? 0,
        );
        assert.deepEqual(
          paginas.map((v) => Object.fromEntries(v.contagem)),
          redeAntes,
          "Nenhuma requisição administrativa/auth recorrente em repouso",
        );
        assert.deepEqual(
          depois,
          antes,
          "Sem GET /admin/products recorrentes durante seis segundos de repouso",
        );
        for (const item of paginas) {
          assert.deepEqual(
            item.erros,
            [],
            "Sem erro de execução ou resposta administrativa 500",
          );
          assert.ok(
            (item.contagem.get("GET /admin/products") ?? 0) < 12,
            "Sem tempestade de navegação",
          );
          assert.equal(
            await item.p.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
          );
          if (o.capturas) {
            mkdirSync(o.capturas, { recursive: true });
            await item.p.screenshot({
              path: join(
                o.capturas,
                `${item.email === o.gestor ? "gestor" : "representante"}-${mobile ? "android" : "desktop"}.png`,
              ),
              fullPage: false,
            });
          }
          resultados.push({
            conta: item.email,
            viewport: mobile ? "Android Pixel 7" : "desktop",
            sessaoIsolada: true,
            rota: new URL(item.p.url()).pathname,
            renderizou: true,
            navegacaoEAtualizacao: true,
            getsProdutos: item.contagem.get("GET /admin/products") ?? 0,
            getsEmRepouso: 0,
            requisicoesEmRepouso: 0,
            network: Object.fromEntries(item.contagem),
          });
        }
      } finally {
        await normal.close();
        await privado.close();
        rmSync(perfil, { recursive: true, force: true });
      }
    }
    writeFileSync(o.relatorio, JSON.stringify(resultados, null, 2));
    return resultados;
  } finally {
    await browser.close();
  }
}
