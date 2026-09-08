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
const fonteFormulario = readFileSync(
  path.join(
    raiz,
    "src/features/contato/components/store/formulario-contato.tsx",
  ),
  "utf8",
);
const fonteAction = readFileSync(
  path.join(raiz, "src/features/contato/actions/enviar-mensagem-contato.ts"),
  "utf8",
);

test("página apresenta os três canais e navegação institucional", () => {
  assert.match(fonteCanais, /Falar com a nossa assistente/);
  assert.match(fonteCanais, /Atendimento via WhatsApp/);
  assert.match(fonteCanais, /Enviar um e-mail/);
  assert.match(fontePagina, /aria-label="Breadcrumb"/);
});

test("HTML da página não importa nem expõe os contatos oficiais", () => {
  const fontesPublicas = `${fontePagina}\n${fonteCanais}\n${fonteFormulario}`;
  assert.doesNotMatch(fontesPublicas, /contato@nooo\.com\.br/);
  assert.doesNotMatch(fontesPublicas, /5531988421694/);
  assert.doesNotMatch(fontesPublicas, /DADOS_EMPRESA/);
});

test("formulário substitui os blocos institucionais removidos", () => {
  assert.match(fontePagina, /<FormularioContato \/>/);
  assert.doesNotMatch(fontePagina, /InformacoesContato/);
  assert.doesNotMatch(
    fontePagina,
    /Perguntas frequentes|Dados da empresa|Segurança no atendimento/,
  );
});

test("envio possui validações antispam exclusivamente no servidor", () => {
  assert.match(fonteAction, /validarTurnstileContato/);
  assert.match(fonteAction, /consumirTentativaContato/);
  assert.match(fonteAction, /lerCampo\(formData, "website"\)/);
  assert.doesNotMatch(fonteFormulario, /TURNSTILE_SECRET_KEY/);
  assert.doesNotMatch(fonteFormulario, /emailAtendimento/);
});
