import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { createServer } from "node:net";

import { chromium } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { prepararFixturePainel } from "@/features/checkout/testes/painel-comissoes/fixture-painel";

import { subirPostgresDescartavel } from "../../../../../scripts/lib/postgres-docker-descartavel";
import { validarFluxoBrowser } from "./fluxo-browser";
/** Diagnóstico delimitado: configuração equivalente à conta reportada, sem tocar em contas existentes. */
async function reproduzir() {
  const docker = await subirPostgresDescartavel("nuu-repro-login");
  let pool: Pool | undefined, pid: number | undefined;
  const browser = await chromium.launch({ headless: true });
  try {
    const url = await docker.criarBanco("login_repro");
    await docker.confirmarIdentidade(url, "login_repro");
    pool = new Pool({ connectionString: url });
    await migrate(drizzle(pool), {
      migrationsFolder: "./drizzle",
      migrationsSchema: "drizzle_v2",
      migrationsTable: "__drizzle_migrations",
    });
    await prepararFixturePainel(pool);
    await pool.query(
      "INSERT INTO administradores(usuario_id,administrador_principal) VALUES('comum',false)",
    );
    await pool.query(
      "INSERT INTO administradores_permissoes(administrador_id,permissao_id,efeito) SELECT a.id,p.id,'permitir' FROM administradores a CROSS JOIN permissoes_administrativas p WHERE a.usuario_id='comum' AND p.chave LIKE 'representantes_produtos.%'",
    );
    const senha = Array.from({ length: 8 }, (_, i) => String(i + 1)).join("");
    const hash = await hashPassword(senha);
    for (const id of ["rep-a", "gestor", "comum"])
      await pool.query(
        "INSERT INTO account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES($1,$2,'credential',$2,$3,now(),now())",
        [`cred-${id}`, id, hash],
      );
    const porta = await new Promise<number>((resolve, reject) => {
      const server = createServer();
      server.on("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const a = server.address();
        if (!a || typeof a === "string") return reject();
        server.close(() => resolve(a.port));
      });
    });
    const origem = `http://127.0.0.1:${porta}`;
    const log = openSync("/tmp/nooo-login-repro-dev.log", "w");
    const proc = spawn(
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
          NOOO_NEXT_DIST_DIR: ".next/login-repro",
          APP_ENVIRONMENT: "homologacao",
          BETTER_AUTH_URL: origem,
          NEXT_PUBLIC_APP_URL: origem,
          BETTER_AUTH_SECRET: "fixture-local-sem-segredos-01234567890123456789",
          GOOGLE_CLIENT_ID: "fixture",
          GOOGLE_CLIENT_SECRET: "fixture",
          RESEND_API_KEY: "fixture",
          STRIPE_SECRET_KEY: "sk_test_fixture",
          BLOB_READ_WRITE_TOKEN: "fixture",
        },
      },
    );
    pid = proc.pid;
    closeSync(log);
    for (let i = 0; i < 100; i++) {
      try {
        if (
          (
            await fetch(`${origem}/api/auth/ok`, {
              signal: AbortSignal.timeout(4000),
            })
          ).ok
        )
          break;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    const f = await pool.query("select id from product where sku='SKU-ATUAL'");
    await pool.query(
      "INSERT INTO product(category_id,marca_id,name,slug,sku,description) SELECT category_id,marca_id,'Não autorizado','nao-autorizado','SKU-FORA-DO-ESCOPO','Teste' FROM product WHERE id=$1",
      [f.rows[0].id],
    );
    await validarFluxoBrowser({
      origem,
      gestor: "gestor@fixture.invalid",
      representante: "a@fixture.invalid",
      senha,
      skusAutorizados: ["SKU-ATUAL"],
      skuProibido: "SKU-FORA-DO-ESCOPO",
      relatorio: "/tmp/nooo-login-regressao-browser.json",
    });
    const contexto = await browser.newContext();
    const pagina = await contexto.newPage();
    let gets = 0;
    await contexto.route("**/*", (r) =>
      new URL(r.request().url()).origin === origem ? r.continue() : r.abort(),
    );
    pagina.on("request", (r) => {
      if (
        r.method() === "GET" &&
        new URL(r.url()).pathname === "/admin/products"
      )
        gets++;
    });
    await pagina.goto(origem + "/admin/login");
    await pagina
      .getByRole("button", { name: "Entrar no admin", exact: true })
      .waitFor();
    await pagina
      .getByLabel("E-mail ou WhatsApp", { exact: true })
      .fill("comum@fixture.invalid");
    await pagina.locator("input[name=senha]").fill(senha);
    await pagina
      .getByRole("button", { name: "Entrar no admin", exact: true })
      .click();
    await pagina.waitForURL(origem + "/admin/products");
    await pagina
      .getByText(
        "Seu acesso aos produtos está indisponível. Solicite revisão ao gestor.",
        { exact: true },
      )
      .waitFor();
    const antes = gets;
    await pagina.waitForTimeout(2000);
    assert.equal(gets, antes);
    assert.ok(gets < 5);
    assert.equal(
      await pagina
        .getByRole("heading", { name: "Visão geral", exact: true })
        .count(),
      0,
    );
    await contexto.close();
    console.log(
      "Regressão: desktop/Android, sessões simultâneas, navegação/refresh sem loops; representante sem vínculo permanece bloqueado.",
    );
  } finally {
    await browser.close();
    if (pid) process.kill(-pid, "SIGTERM");
    await pool?.end();
    await docker.remover();
  }
}
reproduzir().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
