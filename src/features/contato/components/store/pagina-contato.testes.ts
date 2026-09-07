import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const raiz = process.cwd();
const fontePagina = readFileSync(
  path.join(raiz, "src/features/contato/components/store/pagina-contato.tsx"),
  "utf8",
);
const fonteCanais = readFileSync(
  path.join(raiz, "src/features/contato/components/store/canais-contato.tsx"),
  "utf8",
);

test("página apresenta os três canais e navegação institucional", () => {
  assert.match(fonteCanais, /Falar com a nossa assistente/);
  assert.match(fonteCanais, /Atendimento via WhatsApp/);
  assert.match(fonteCanais, /Enviar um e-mail/);
  assert.match(fontePagina, /aria-label="Breadcrumb"/);
});

test("HTML da página não importa nem expõe os contatos oficiais", () => {
  const fontesPublicas = `${fontePagina}\n${fonteCanais}`;
  assert.doesNotMatch(fontesPublicas, /contato@nooo\.com\.br/);
  assert.doesNotMatch(fontesPublicas, /5531988421694/);
  assert.doesNotMatch(fontesPublicas, /DADOS_EMPRESA/);
});
