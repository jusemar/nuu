import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

import { chromium, devices, expect, type Page } from "@playwright/test";
const origem = process.env.NOOO_REVISAO_URL ?? "http://127.0.0.1:3001";
async function testar() {
  const navegador = await chromium.launch({ headless: true });
  const pasta = "docs/prototipos/representante-etapa-8";
  mkdirSync(pasta, { recursive: true });
  try {
    let pronto = false;
    for (let i = 0; i < 120; i++) {
      try {
        if (
          (
            await fetch(`${origem}/test/representantes-jaaa`, {
              signal: AbortSignal.timeout(4000),
            })
          ).ok
        ) {
          pronto = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    assert.ok(pronto, "Revisão local disponível");
    for (const mobile of [false, true]) {
      const contexto = await navegador.newContext(
        mobile
          ? { ...devices["Pixel 7"] }
          : { viewport: { width: 1440, height: 1000 } },
      );
      // Nenhum clique de teste acessa o Jaaa remoto; só validamos o contrato público da URL.
      await contexto.route("https://jaaa.com.br/**", (rota) =>
        rota.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<p>Destino Jaaa interceptado no teste local.</p>",
        }),
      );
      const pagina = await contexto.newPage();
      const erros: string[] = [];
      pagina.on("pageerror", (e) => erros.push(e.message));
      const aba = async (nome: string) =>
        pagina.getByRole("tab", { name: nome, exact: true }).click();
      const semOverflow = async (p: Page) =>
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          "Sem overflow horizontal",
        );
      await pagina.goto(`${origem}/test/representantes-jaaa`, {
        waitUntil: "domcontentloaded",
      });
      await pagina
        .getByRole("heading", { name: "Jaaa dos representantes", exact: true })
        .waitFor();
      await expect(
        pagina.getByLabel("Usuário no Jaaa de Fernando", { exact: true }),
      ).toHaveValue("fernando_embrater");
      await semOverflow(pagina);
      await pagina.screenshot({
        path: `${pasta}/gestor-${mobile ? "android" : "desktop"}.png`,
        fullPage: true,
      });
      await aba("Cliente");
      assert.equal(
        await pagina
          .getByRole("link", { name: "Falar pelo Jaaa", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await pagina
          .getByRole("link", { name: "Atendimento Nooo", exact: true })
          .count(),
        1,
      );
      await aba("Gestor");
      await pagina
        .getByLabel("Representante para atendimento", { exact: true })
        .selectOption("beatriz");
      await pagina
        .getByRole("button", {
          name: "Salvar atendimento do produto",
          exact: true,
        })
        .click();
      await aba("Cliente");
      const conversar = pagina.getByRole("link", {
        name: "Falar pelo Jaaa",
        exact: true,
      });
      await conversar.waitFor();
      assert.equal(
        await conversar.getAttribute("href"),
        "https://jaaa.com.br/@beatriz_atendimento",
      );
      assert.equal(
        await conversar.getAttribute("referrerpolicy"),
        "no-referrer",
      );
      assert.ok((await conversar.boundingBox())!.height >= 44);
      const popup = contexto.waitForEvent("page");
      await conversar.click();
      const externa = await popup;
      await externa.waitForLoadState("domcontentloaded");
      assert.equal(externa.url(), "https://jaaa.com.br/@beatriz_atendimento");
      await externa.close();
      await semOverflow(pagina);
      await pagina.screenshot({
        path: `${pasta}/cliente-${mobile ? "android" : "desktop"}.png`,
        fullPage: true,
      });
      await aba("Representante");
      assert.equal(await pagina.getByRole("textbox").count(), 0);
      assert.equal(
        await pagina
          .getByRole("link", { name: "Abrir Jaaa", exact: true })
          .getAttribute("href"),
        "https://jaaa.com.br/@fernando_embrater",
      );
      for (const estado of [
        "sem_configuracao",
        "desativada",
        "representante_inativo",
        "fornecedor_inativo",
        "produto_nao_autorizado",
      ]) {
        await pagina
          .getByLabel("Simular disponibilidade na revisão", { exact: true })
          .selectOption(estado);
        assert.equal(
          await pagina
            .getByRole("link", { name: "Abrir Jaaa", exact: true })
            .count(),
          0,
        );
        await aba("Cliente");
        assert.equal(
          await pagina
            .getByRole("link", { name: "Falar pelo Jaaa", exact: true })
            .count(),
          0,
        );
        await aba("Representante");
      }
      await pagina
        .getByLabel("Simular disponibilidade na revisão", { exact: true })
        .selectOption("ativo");
      await semOverflow(pagina);
      await pagina.screenshot({
        path: `${pasta}/representante-${mobile ? "android" : "desktop"}.png`,
        fullPage: true,
      });
      await aba("Gestor");
      const identidade = pagina.getByLabel("Usuário no Jaaa de Fernando", {
        exact: true,
      });
      await identidade.fill("javascript:alert(1)");
      await pagina
        .getByRole("button", { name: "Salvar Jaaa de Fernando", exact: true })
        .click();
      await pagina
        .getByText(
          "Use de 3 a 30 letras, números ou _, começando por uma letra.",
          { exact: true },
        )
        .waitFor();
      assert.equal(
        await pagina
          .getByRole("link", {
            name: "Conferir endereço de Fernando",
            exact: true,
          })
          .count(),
        0,
      );
      await identidade.fill(" @Fernando_Novo ");
      await pagina
        .getByRole("button", { name: "Salvar Jaaa de Fernando", exact: true })
        .click();
      await aba("Representante");
      assert.equal(
        await pagina
          .getByRole("link", { name: "Abrir Jaaa", exact: true })
          .getAttribute("href"),
        "https://jaaa.com.br/@fernando_novo",
      );
      assert.deepEqual(erros, []);
      await contexto.close();
      console.log(
        `${mobile ? "Android Pixel 7" : "Desktop"}: revisão visual aprovada; estados, destinatário explícito, toque, URL maliciosa, privacidade e navegação externa interceptada.`,
      );
    }
  } finally {
    await navegador.close();
  }
}
testar().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
