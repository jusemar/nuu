import { createRequire } from "node:module";

import { validarFluxoBrowser } from "./fluxo-browser";
const require = createRequire(process.cwd() + "/package.json");
const { Pool } = require("pg");
/** Executar pelo lançador local: valida a identidade PostgreSQL antes de usar as contas indicadas. */
export const execucao = (async () => {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    url.pathname !== "/nooo_desenvolvimento"
  )
    throw new Error("Teste exige PostgreSQL local persistente validado.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const representante = "representante1@gmail.com";
    const r = await pool.query(
      `select distinct p.sku from product p join autorizacoes_produtos_representantes a on a.produto_id=p.id join representantes_fornecedores v on v.id=a.representante_fornecedor_id join fornecedores f on f.id=v.fornecedor_id join "user" u on u.id=v.usuario_id where u.email=$1 and a.ativa and v.ativo and f.status='ativo'`,
      [representante],
    );
    if (!r.rows.length)
      throw new Error(
        "Representante de teste sem produto autorizado para validar.",
      );
    const proibido = await pool.query(
      "select sku from product where not(sku=any($1::text[])) limit 1",
      [r.rows.map((v: { sku: string }) => v.sku)],
    );
    let pronto = false;
    for (let i = 0; i < 100; i++) {
      try {
        if (
          (
            await fetch("http://localhost:3000/api/auth/ok", {
              signal: AbortSignal.timeout(4000),
            })
          ).ok
        ) {
          pronto = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 300));
    }
    if (!pronto) throw new Error("Servidor local não ficou disponível.");
    const resultado = await validarFluxoBrowser({
      origem: "http://localhost:3000",
      gestor: "admin@nooo.local",
      representante,
      senha: Array.from({ length: 8 }, (_, i) => String(i + 1)).join(""),
      skusAutorizados: r.rows.map((v: { sku: string }) => v.sku),
      skuProibido: proibido.rows[0].sku,
      relatorio: "/tmp/nooo-login-validacao-final.json",
      capturas: "docs/prototipos/correcao-login-admin",
    });
    console.log(JSON.stringify(resultado, null, 2));
  } finally {
    await pool.end();
  }
})();
