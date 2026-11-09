import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import { armazenarImagemRepresentante } from "../../actions/representantes/armazenar-imagem-produto";

const require = createRequire(import.meta.url);
const blob = require("@vercel/blob") as typeof import("@vercel/blob");
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=",
  "base64",
);

/** Não carrega .env, não abre banco e falha se algum código tentar acessar rede. */
test("upload do representante usa Blob simulado sem armazenamento temporário", async (t) => {
  const anteriores = {
    NODE_ENV: process.env.NODE_ENV,
    NOOO_BANCO: process.env.NOOO_BANCO,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  };
  t.after(() => {
    for (const [nome, valor] of Object.entries(anteriores)) {
      if (valor === undefined) delete process.env[nome];
      else process.env[nome] = valor;
    }
  });
  const rede = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Acesso à rede proibido neste teste.");
  });
  process.env.BLOB_READ_WRITE_TOKEN = "fixture-sem-credencial-real";
  const envios: { caminho: string; acesso: string | undefined }[] = [];
  const remocoes: string[] = [];
  t.mock.method(
    blob,
    "put",
    async (...[caminho, conteudo, opcoes]: Parameters<typeof blob.put>) => {
      assert.deepEqual(Buffer.from(conteudo as Buffer), png);
      envios.push({ caminho, acesso: opcoes.access });
      return {
        url: `https://storage.fixture.invalid/${caminho}`,
        downloadUrl: `https://storage.fixture.invalid/${caminho}?download=1`,
        pathname: caminho,
        contentType: opcoes.contentType ?? "image/png",
        contentDisposition: "inline",
      };
    },
  );
  t.mock.method(blob, "del", async (...[url]: Parameters<typeof blob.del>) => {
    assert.equal(typeof url, "string");
    remocoes.push(url as string);
  });

  await t.test("desenvolvimento bloqueia antes do SDK", async () => {
    Object.assign(process.env, {
      NODE_ENV: "development",
      NOOO_BANCO: "local",
    });
    await assert.rejects(
      armazenarImagemRepresentante("produto-teste", png, "image/png"),
      /Blob exclusivo de testes/,
    );
    assert.equal(envios.length, 0);
  });
  await t.test(
    "build com NODE_ENV production não libera o banco local",
    async () => {
      Object.assign(process.env, {
        NODE_ENV: "production",
        NOOO_BANCO: "local",
      });
      await assert.rejects(
        armazenarImagemRepresentante("produto-teste", png, "image/png"),
        /Blob exclusivo de testes/,
      );
      assert.equal(envios.length, 0);
    },
  );
  // Somente este processo de teste simula o ambiente da aplicação. O SDK está
  // substituído acima e fetch é proibido; nenhuma credencial real é utilizada.
  Object.assign(process.env, { NODE_ENV: "production", NOOO_BANCO: "fixture" });
  await t.test(
    "mantém validação antes de enviar conteúdo ao Blob",
    async () => {
      for (const [bytes, tipo] of [
        [Buffer.from("conteudo invalido"), "image/png"],
        [png, "image/svg+xml"],
        [Buffer.alloc(4 * 1024 * 1024 + 1), "image/png"],
      ] as const) {
        await assert.rejects(
          armazenarImagemRepresentante("produto-teste", bytes, tipo),
        );
      }
      assert.equal(envios.length, 0);
    },
  );
  await t.test(
    "retorna a URL pública definitiva e preserva compensação por falha",
    async () => {
      const resultado = await armazenarImagemRepresentante(
        "produto-teste",
        png,
        "image/png",
      );
      assert.match(
        envios[0].caminho,
        /^products\/produto-teste\/[\da-f-]+\.png$/,
      );
      assert.equal(envios[0].acesso, "public");
      assert.equal(
        resultado.url,
        `https://storage.fixture.invalid/${envios[0].caminho}`,
      );
      assert.equal(
        resultado.url.includes("/api/imagens-representante-local/"),
        false,
      );
      await resultado.excluir();
      assert.deepEqual(remocoes, [resultado.url]);
      assert.equal(rede.mock.calls.length, 0);
    },
  );
});
