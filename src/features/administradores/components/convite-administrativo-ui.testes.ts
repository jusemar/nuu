import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaAdmin = readFileSync(
  "src/features/administradores/components/admin/pagina-usuarios-permissoes.tsx",
  "utf8",
);
const paginaPublica = readFileSync(
  "src/features/administradores/components/publico/pagina-aceite-convite.tsx",
  "utf8",
);

test("admin alterna o identificador e mostra somente o campo necessário", () => {
  assert.match(paginaAdmin, /Forma do convite/);
  assert.match(paginaAdmin, /E-mail/);
  assert.match(paginaAdmin, /WhatsApp/);
  assert.match(paginaAdmin, /tipoIdentificador === "email"/);
  assert.match(paginaAdmin, /id="convite-email"/);
  assert.match(paginaAdmin, /id="convite-whatsapp"/);
  assert.match(paginaAdmin, /formatarTelefoneBrasileiro/);
});

test("convite WhatsApp mostra e copia somente o link manual", () => {
  assert.match(paginaAdmin, /linkConvite/);
  assert.match(paginaAdmin, /navigator\.clipboard\.writeText/);
  assert.match(paginaAdmin, /Link copiado/);
  assert.match(paginaAdmin, /Envie este link ao convidado/);
  assert.doesNotMatch(paginaAdmin, /comunicacaoWhatsapp/);
});

test("página pública distingue convite por e-mail e WhatsApp", () => {
  assert.match(paginaPublica, /tipoIdentificador === "whatsapp"/);
  assert.match(paginaPublica, /emailMascarado/);
  assert.match(paginaPublica, /telefoneMascarado/);
  assert.match(paginaPublica, /Convite indisponível/);
  assert.match(paginaPublica, /Sair e continuar com a conta correta/);
  assert.match(paginaPublica, /window\.location\.reload\(\)/);
});

test("fluxo WhatsApp chama somente os endpoints e campos autorizados", () => {
  assert.match(paginaPublica, /\/admin\/convite\/whatsapp\/otp\/solicitar/);
  assert.match(paginaPublica, /\/admin\/convite\/whatsapp\/otp\/confirmar/);
  assert.match(
    paginaPublica,
    /\/admin\/convite\/whatsapp\/identificar-usuario/,
  );
  assert.match(paginaPublica, /\/admin\/convite\/whatsapp\/cadastrar-usuario/);
  assert.match(paginaPublica, /\/admin\/convite\/whatsapp\/aceitar/);
  assert.match(paginaPublica, /passwordConfirmation: confirmacaoSenha/);
  assert.doesNotMatch(
    paginaPublica.slice(paginaPublica.indexOf("async function cadastrar")),
    /telefone:/,
  );
  assert.match(paginaPublica, /segundosReenvio/);
  assert.match(paginaPublica, /disabled=\{processando/);
});
